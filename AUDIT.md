# Inzozi Nziza — Technical Audit

**Date:** 2026-06-17  
**Scope:** Full codebase audit per `AGENT.md` Phase 1  
**Status:** Read-only audit — no application code modified

---

## 1. Executive Summary

Inzozi Nziza is a **Vite + React SPA** that talks **directly** to **Supabase Auth** and **Supabase PostgreSQL** via `@supabase/supabase-js`. There is **no custom backend**. Authorization is split between:

- **Frontend route guards** (redirect based on session + `user_roles` query)
- **PostgreSQL Row Level Security (RLS)** policies evaluated on each PostgREST request

Business logic (loan interest calculation, installment schedules, overdue handling, PDF generation) lives inside large page components (`Dashboard.tsx`, `AdminDashboard.tsx`) and two domain components (`FinesManagement.tsx`, `UserFines.tsx`).

The README and several marketing claims **do not match** the implementation. Schema definitions in the repo migration, generated TypeScript types, and runtime code **diverge** in multiple places.

---

## 2. Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│  Browser (React 18 + Vite + React Router)                   │
│  ┌──────────┐ ┌───────────┐ ┌──────────────┐ ┌────────────┐ │
│  │ Index    │ │ Auth      │ │ Dashboard    │ │ Admin    │ │
│  │ (public) │ │           │ │ (member)     │ │ Dashboard│ │
│  └──────────┘ └───────────┘ └──────────────┘ └────────────┘ │
│  ┌──────────┐ ┌───────────────────────────────────────────┐ │
│  │ Profile  │ │ FinesManagement / UserFines / pdf-lib   │ │
│  └──────────┘ └───────────────────────────────────────────┘ │
└────────────────────────────┬────────────────────────────────┘
                             │ HTTPS (anon JWT in localStorage)
                             ▼
┌─────────────────────────────────────────────────────────────┐
│  Supabase                                                    │
│  • Auth (email/password)                                     │
│  • PostgREST API → public schema tables                      │
│  • PostgreSQL RLS + triggers + SECURITY DEFINER functions    │
└─────────────────────────────────────────────────────────────┘
```

| Layer | Actual stack | README claim |
|-------|--------------|--------------|
| Frontend | React, Vite, Tailwind, shadcn/ui | React, Tailwind |
| Backend | **None** (client → Supabase) | Next.js |
| Database | Supabase-hosted PostgreSQL | Supabase PostgreSQL |
| Auth | Supabase Auth (localStorage session) | JWT, Cookies |
| PDF | `pdf-lib` (client-side) | PDFKit |
| Real-time | Auth listener + 5s polling (fines) | WebSockets |

**Deployment:** Vercel SPA (`vercel.json` rewrites all routes to `index.html`).

---

## 3. Application Routes

| Route | Component | Auth required | Notes |
|-------|-----------|---------------|-------|
| `/` | `Index.tsx` | No | Landing page |
| `/auth` | `Auth.tsx` | No | Login, signup, forgot password |
| `/dashboard` | `Dashboard.tsx` | Yes | Member dashboard; blocked if not approved |
| `/admin` | `AdminDashboard.tsx` | Yes + admin role | Redirects non-admins to `/dashboard` |
| `/profile` | `Profile.tsx` | Yes | Edit profile/password; not linked from main nav |
| `*` | `NotFound.tsx` | No | 404 |

**Global providers** (`App.tsx`): TanStack Query (minimal usage), ThemeProvider, tooltips, toasters, `ParticleBackground`.

---

## 4. Authentication Flow

### 4.1 Supabase client configuration

**File:** `src/integrations/supabase/client.ts`

- Hardcoded `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` (anon key) committed to repo
- Session stored in **`localStorage`** (`persistSession: true`, `autoRefreshToken: true`)

### 4.2 Sign up (`Auth.tsx`)

```
User submits form (email, password, fullName, phone, role, [adminKey])
    │
    ├─ role === "admin" → frontend checks adminKey === "INZOZI_ADMIN_2024"
    │                     (fails client-side if wrong)
    │
    ▼
supabase.auth.signUp({ email, password, options: { data: { full_name, phone, role } } })
    │
    ▼
DB trigger `on_auth_user_created` → `handle_new_user()`
    • INSERT profiles (is_approved = false)
    • INSERT user_roles (role = 'user')
    │
    ├─ if role === "admin" (client-side follow-up):
    │     • INSERT user_roles (role = 'admin')     ← may fail RLS (see Security)
    │     • UPDATE profiles SET is_approved = true ← may succeed via self-update RLS
    │
    ▼
Toast: admin auto-approved OR user awaits admin approval
```

**Not implemented:** Google OAuth, server-side password policy, rate limiting, email verification gate before dashboard access.

### 4.3 Sign in (`Auth.tsx`)

```
supabase.auth.signInWithPassword({ email, password })
    │
    ▼
Query user_roles for session.user.id
    │
    ├─ has role 'admin' → window.location.href = '/admin'
    └─ else              → window.location.href = '/dashboard'
```

**Not checked on login:** `profiles.is_approved` (non-approved users reach dashboard and are gated there).

### 4.4 Session lifecycle

| Page | Mechanism |
|------|-----------|
| `Auth.tsx` | `getSession()` on mount → redirect if already logged in |
| `Dashboard.tsx` | `onAuthStateChange` + `getSession()` → redirect to `/auth` if no session |
| `AdminDashboard.tsx` | Same as Dashboard |
| `Profile.tsx` | `getUser()` → navigate to `/auth` if missing |

**Sign out:** `supabase.auth.signOut()` then redirect to `/auth`.

### 4.5 Password reset (`Auth.tsx`)

`supabase.auth.resetPasswordForEmail(email, { redirectTo: origin + '/auth' })`

### 4.6 Password change (`Profile.tsx`)

`supabase.auth.updateUser({ password })` — no current-password verification.

### 4.7 Auth API surface used

| Supabase Auth method | Used in |
|---------------------|---------|
| `signUp` | `Auth.tsx` |
| `signInWithPassword` | `Auth.tsx` |
| `signOut` | `Dashboard.tsx`, `AdminDashboard.tsx` |
| `getSession` | `Auth.tsx`, `Dashboard.tsx`, `AdminDashboard.tsx` |
| `getUser` | `Profile.tsx` |
| `onAuthStateChange` | `Dashboard.tsx`, `AdminDashboard.tsx` |
| `resetPasswordForEmail` | `Auth.tsx` |
| `updateUser` | `Profile.tsx` |

**Not used:** OAuth providers, `signInWithOtp`, Supabase MFA, admin auth APIs, service role.

---

## 5. Authorization Flow

### 5.1 Role model

- Enum `app_role`: `'admin' | 'user'`
- Table `user_roles` (user_id, role) — users can have rows in this table
- DB helper: `has_role(_user_id, _role)` — SECURITY DEFINER, used in RLS

### 5.2 Approval model

- `profiles.is_approved` boolean (default `false`)
- DB helper: `is_user_approved(_user_id)` — used in RLS for contributions/loans
- Frontend gate: `Dashboard.tsx` shows "Pending Approval" screen when `!is_approved`

### 5.3 Authorization layers (current)

| Layer | What it enforces | Weakness |
|-------|------------------|----------|
| React redirects | `/admin` only if `user_roles` contains admin | Bypassable if API called directly |
| RLS policies | Table-level read/write by role and approval | Column-level gaps (e.g. `is_approved`) |
| UI conditionals | Hide buttons for non-admins | Cosmetic only |

### 5.4 RLS policy summary

**`profiles`**
- Users: SELECT/UPDATE/INSERT own row
- Admins: SELECT/UPDATE all rows

**`user_roles`**
- Users: SELECT own roles
- Admins: SELECT all, ALL (manage)

**`contributions`**
- Approved users: SELECT/INSERT own
- Admins: SELECT all, ALL (manage)

**`loans`**
- Approved users: SELECT own, INSERT (apply)
- Admins: SELECT all, ALL (manage)

**`loan_payments`**
- Users: SELECT own (via loan ownership join)
- Admins: SELECT, UPDATE, INSERT

**`fines`**
- Users: SELECT own
- Admins: ALL

**`fine_payments`**
- **Not defined in migration** — table referenced in code only

### 5.5 Frontend authorization checks

| Check | Location | Behavior |
|-------|----------|----------|
| Admin role | `AdminDashboard.checkAdminRole()` | Query `user_roles` where role=admin; redirect if missing |
| Member approval | `Dashboard` render | Block UI if `!profile.is_approved` |
| Post-login routing | `Auth.tsx` | Admin → `/admin`, else → `/dashboard` |

**Not implemented:** second-admin approval, server-side RBAC middleware, CSRF protection, pending-user API restrictions beyond RLS.

---

## 6. Supabase Dependencies

### 6.1 Direct npm dependency

```json
"@supabase/supabase-js": "^2.50.5"
```

### 6.2 Transitive packages (via supabase-js)

| Package | Purpose in SDK | Used by app |
|---------|----------------|-------------|
| `@supabase/auth-js` | Authentication | Yes |
| `@supabase/postgrest-js` | REST queries (`.from()`) | Yes |
| `@supabase/realtime-js` | WebSocket subscriptions | **No** (bundled, unused) |
| `@supabase/storage-js` | File storage | **No** |
| `@supabase/functions-js` | Edge functions | **No** |
| `@supabase/node-fetch` | HTTP client | Internal |

### 6.3 Files that import Supabase

| File | Imports | Usage |
|------|---------|-------|
| `src/integrations/supabase/client.ts` | `createClient` | Singleton client |
| `src/integrations/supabase/types.ts` | — | Generated DB types |
| `src/pages/Auth.tsx` | client, auth | Sign up/in, roles query |
| `src/pages/Dashboard.tsx` | client, `User`, `Session` | Session, CRUD reads, loan insert |
| `src/pages/AdminDashboard.tsx` | client, `User`, `Session`, `PostgrestError` | Full admin CRUD |
| `src/pages/Profile.tsx` | client | Profile CRUD, password |
| `src/components/FinesManagement.tsx` | client | Fines + fine_payments CRUD |
| `src/components/UserFines.tsx` | client | Read fines for user |

### 6.4 Supabase infrastructure in repo

| Path | Purpose |
|------|---------|
| `supabase/migrations/20250713193519-....sql` | Single SQL migration |
| `supabase/config.toml` | Project ID only (`cwuchtwyhtcqfawlgfag`) |

### 6.5 Supabase features NOT used

- Edge Functions
- Storage buckets
- Realtime channels (`.channel()`)
- RPC calls (`.rpc()`)
- Database webhooks
- `begin_transaction` / `commit_transaction` / `rollback_transaction` SQL functions (defined but never called)

---

## 7. Database Schema Usage

### 7.1 Tables in migration SQL

| Table | Purpose | RLS |
|-------|---------|-----|
| `profiles` | Member identity, `is_approved` | Yes |
| `user_roles` | `admin` / `user` | Yes |
| `contributions` | Monthly savings payments | Yes |
| `loans` | Loan applications & lifecycle | Yes |
| `loan_payments` | Installment schedule | Yes |
| `fines` | Penalties | Yes |

**Auth schema:** `auth.users` referenced by FK; managed by Supabase Auth.

### 7.2 Tables/columns used in code but missing or incomplete in migration

| Item | Code expectation | Migration reality |
|------|------------------|-------------------|
| `fine_payments` | Full CRUD in `FinesManagement.tsx` | **Table not in migration** |
| `fines.amount_paid` | Used in fines UI | **Column not in migration** |
| `fines.reason` | Used in fines UI | Migration has `reason` ✓ |
| `loan_payments.installment_number` | Loan approval flow | **Column not in migration** |
| `profiles.status` | Set to `'inactive'` on loan default | **Column not in migration** |
| `loans` extended columns | `due_date`, `interest_rate`, `total_with_interest`, `amount_paid`, `last_payment_date`, `installments_count` | Added in migration ✓ |
| Generated `types.ts` `fines.description` | — | Code uses `reason`; types out of sync |

### 7.3 DB functions and triggers

| Object | Purpose |
|--------|---------|
| `has_role()` | RLS admin checks |
| `is_user_approved()` | RLS member data access |
| `handle_new_user()` | Trigger on `auth.users` INSERT → profile + user role |
| `update_updated_at_column()` | Auto-update `updated_at` on several tables |
| `begin/commit/rollback_transaction()` | Defined; **unused** |

### 7.4 Status enumerations

**`loans.status` (DB CHECK constraint):**  
`pending`, `approved`, `denied`, `disbursed`, `repaid`

**`loans.status` (code also uses):**  
`defaulted` — **violates DB CHECK** if constraint is enforced

**`contributions.status`:** `pending`, `completed`, `failed`

**`loan_payments.status`:** `pending`, `paid`, `overdue`

**`fines.status`:** `pending`, `paid`, `cancelled`

### 7.5 Generated types vs runtime

`src/integrations/supabase/types.ts` is auto-generated and **incomplete** relative to runtime:

- Missing `fine_payments` table
- Missing extended `loans` columns
- `fines` uses `description` in types but `reason` in code/migration
- Code uses type assertions (`as DbLoan[]`) to work around gaps

---

## 8. Role Management

### 8.1 Current behavior

| Action | Who | How |
|--------|-----|-----|
| Default role on signup | System | Trigger inserts `user` |
| Admin role on signup | User (self-selected) | Frontend admin key + client INSERT into `user_roles` |
| Admin auto-approval | System (client) | `profiles.is_approved = true` after admin signup |
| Member approval | Admin | `AdminDashboard.handleUserApproval()` updates `is_approved` |
| Member deactivation | Admin (cron) | `checkOverdueLoans()` sets `is_approved=false`, `status='inactive'` |
| Role check | Frontend | Query `user_roles` table |

### 8.2 Gaps vs `AGENT.md` target

- No server-side role assignment
- No `roles` lookup table (enum only)
- No protection against self-promotion to admin (RLS-dependent)
- No two-admin approval for granting admin
- No audit trail for role changes

---

## 9. Loan Management

### 9.1 Member flow (`Dashboard.tsx`)

1. **Apply:** INSERT into `loans` with `status: 'pending'`, amount, purpose
2. **View:** SELECT own loans with nested `loan_payments`
3. **Active loans UI:** Filters `status === 'approved'`, shows balance, progress bar
4. **Defaults:** `interest_rate` fallback 5%, `total_with_interest` fallback `amount * 1.05`

### 9.2 Admin flow (`AdminDashboard.tsx`)

1. **List loans:** SELECT with `loan_payments` join — **BUG:** filtered `.eq("user_id", user.id)` loads only the **logged-in admin's** loans, not all members' loans
2. **Approve** (`handleLoanDecision(true)`):
   - 5% interest on principal
   - 3 monthly installments
   - UPDATE loan: `approved`, `approved_at`, `due_date` (+90 days), `interest_rate`, `total_with_interest`, `installments_count`
   - INSERT 3 `loan_payments` rows with `installment_number`
3. **Deny:** UPDATE `status: 'denied'`, `admin_notes`
4. **Record payment** (`handlePaymentUpdate`):
   - UPDATE `loans.amount_paid`, `last_payment_date`
   - INSERT new `loan_payments` row (ad-hoc, not tied to installment schedule)
5. **Overdue check** (`checkOverdueLoans`, daily interval):
   - Finds approved loans with overdue pending payments
   - Sets loan `status: 'defaulted'`
   - Deactivates member profile

### 9.3 Loan business rules (implicit in code)

| Rule | Value |
|------|-------|
| Interest rate | 5% flat on principal |
| Installments | 3 months |
| Due date on approval | ~90 days from approval |
| Payment recording | Partial payments allowed |

### 9.4 Gaps

- No `disbursed` / `repaid` status transitions in UI
- `handleLoanAction` exists but appears superseded by `handleLoanDecision`
- Installment schedule not updated when ad-hoc payments recorded
- Admin cannot see all loans (query bug)
- No second-admin approval for loan decisions

---

## 10. Contribution Management

### 10.1 Business rule

**Required monthly contribution:** 105,000 RWF (`REQUIRED_CONTRIBUTION` constant in `Dashboard.tsx`)

Progress is calculated from **completed** contributions with `payment_date >= start of current calendar month`.

### 10.2 Who records contributions

| Actor | Capability |
|-------|------------|
| Member | Can INSERT own contributions (RLS allows) but **UI does not expose this** |
| Admin | `handleAddContribution()` — INSERT with `status: 'completed'`, amount, date, reference |

**Effective model:** contributions are **admin-recorded**; members only view.

### 10.3 Contribution data model

| Field | Usage |
|-------|-------|
| `user_id` | Member |
| `amount` | RWF amount |
| `payment_date` | When payment occurred |
| `status` | `pending` / `completed` / `failed` |
| `reference_number` | Optional payment reference |

### 10.4 Admin aggregation

`AdminDashboard` computes per-user:
- `total_contributions` — sum of completed
- `pending_contributions` — count of pending

### 10.5 Gaps

- Members cannot self-report payments (may be intentional)
- No validation that monthly total equals 105,000
- No correction/adjustment workflow
- No audit log for contribution changes

---

## 11. Fines Management

### 11.1 Admin (`FinesManagement.tsx`)

- List all fines; poll every **5 seconds**
- Issue fine: INSERT `fines` (amount, reason, `amount_paid: 0`, `status: pending`)
- Record payment: INSERT `fine_payments`, UPDATE `fines.amount_paid` and status
- Cancel fine: UPDATE `status: 'cancelled'`
- Export CSV report

### 11.2 Member (`UserFines.tsx`)

- SELECT own fines with `fine_payments` aggregate
- Show pending total alert

### 11.3 Schema gap

`fine_payments` table and `fines.amount_paid` are required by code but **not in the committed migration**. They may exist only on the live Supabase instance.

---

## 12. Other Features

| Feature | Implementation | Notes |
|---------|----------------|-------|
| PDF reports | `pdf-lib` in browser | Member + admin reports |
| Theme toggle | `next-themes` | Light/dark/system |
| Notifications | Toast (shadcn) | Not persistent; no DB notifications table |
| Real-time | 5s polling (fines only) | Not WebSockets |
| Inactivity removal | Not implemented | Overdue loan deactivation instead |
| Google login | Not implemented | |
| Two-admin approval | Not implemented | |
| Profile page | Implemented | Not linked from dashboard header |

---

## 13. File Inventory (domain-relevant)

```
src/
├── App.tsx                          # Routes, providers
├── main.tsx                         # Entry
├── pages/
│   ├── Index.tsx                    # Landing
│   ├── Auth.tsx                     # Auth + role routing
│   ├── Dashboard.tsx                # Member hub (~980 lines)
│   ├── AdminDashboard.tsx           # Admin hub (~1647 lines)
│   ├── Profile.tsx                  # Profile settings
│   └── NotFound.tsx
├── components/
│   ├── FinesManagement.tsx          # Admin fines
│   ├── UserFines.tsx                # Member fines view
│   ├── ThemeProvider.tsx
│   ├── ParticleBackground.tsx
│   └── LoadingSpinner.tsx
├── integrations/supabase/
│   ├── client.ts                    # Supabase singleton
│   └── types.ts                     # Generated types
└── lib/utils.ts                     # cn() helper

supabase/
├── config.toml
└── migrations/
    └── 20250713193519-....sql       # Single migration
```

---

## 14. Known Bugs and Inconsistencies

| ID | Severity | Issue |
|----|----------|-------|
| BUG-01 | High | Admin loans query filters by admin `user.id` — admins don't see member loans |
| BUG-02 | High | `loans.status = 'defaulted'` not in DB CHECK constraint |
| BUG-03 | High | `profiles.status` written but column may not exist |
| BUG-04 | Medium | `fine_payments` / `fines.amount_paid` missing from migration |
| BUG-05 | Medium | Generated types out of sync with schema and code |
| BUG-06 | Medium | `loan_payments.installment_number` used but not in migration |
| BUG-07 | Low | `Profile` route exists but no nav link from dashboards |
| BUG-08 | Low | TanStack Query configured but pages use manual `useEffect` fetching |
| BUG-09 | Low | README tech stack and features inaccurate |

---

## 15. README vs Reality Matrix

| README feature | Implemented? |
|----------------|--------------|
| Google login | No |
| Role-based access | Partial (frontend + RLS) |
| Loan application/approval | Yes |
| 105,000 RWF contribution tracking | Yes |
| 3-month inactivity auto-removal | No |
| PDF reports | Yes (pdf-lib, not PDFKit) |
| Fine tracking | Yes (schema incomplete in repo) |
| Second admin approval | No |
| Admin key | Yes (frontend-only, hardcoded) |
| Light/dark mode | Yes |
| Real-time notifications | No (toasts + polling only) |
| Next.js backend | No |
| JWT + Cookies | No (Supabase localStorage session) |
| WebSockets | No |

---

## 16. Conclusion

The current application is a **prototype-grade SPA** suitable for demonstration but **not production-ready** per `AGENT.md` security requirements. All sensitive operations are initiated from the browser with a publicly embedded anon key; RLS is the only server-side enforcement and has known gaps.

**Recommended next step:** Execute the phased migration described in `MIGRATION_PLAN.md` to introduce a proper API layer, Prisma ORM, standalone PostgreSQL, and server-side auth/RBAC — while remediating issues catalogued in `SECURITY_ISSUES.md`.
