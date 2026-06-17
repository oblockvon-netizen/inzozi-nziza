# Inzozi Nziza — Migration Plan: Supabase → Neon PostgreSQL + Prisma

**Date:** 2026-06-17  
**Status:** Phase 2 (Prisma schema) complete — schema and ERD created  
**Target database:** [Neon](https://neon.tech) PostgreSQL  
**Aligned with:** `AGENT.md`

---

## Progress tracker

| Phase | Description | Status |
|-------|-------------|--------|
| 1 | Audit current app | ✅ Done — see `AUDIT.md` |
| 2 | Create Prisma schema | ✅ Done — `prisma/schema.prisma`, `ERD.md` |
| 3 | Set up Neon PostgreSQL | ⬜ Next |
| 4 | Build backend auth | ⬜ Pending |
| 5 | Build RBAC middleware | ⬜ Pending |
| 6 | Replace Supabase client calls | ⬜ Pending |
| 7 | Rebuild UI | ⬜ Pending |
| 8 | Audit logs + two-admin approval | ⬜ Pending |
| 9 | Test all roles | ⬜ Pending |
| 10 | Update README and deployment docs | ⬜ Pending |

---

## 1. Goals

| Goal | Success criteria |
|------|------------------|
| Remove Supabase | Zero `@supabase/*` imports; no anon key in frontend |
| Neon PostgreSQL | `DATABASE_URL` server-only; pooled connection for serverless |
| Prisma ORM | `prisma/schema.prisma` + versioned migrations |
| Secure auth | HttpOnly cookies, `refresh_tokens` table, argon2/bcrypt |
| Server RBAC | All mutations through API middleware |
| Schema parity | All preserved tables + new governance tables |
| Production readiness | Audit logs, two-admin approval, rate limiting |

---

## 2. Target architecture

```
┌──────────────────────────────────────────────────────────────────┐
│  Frontend (Vite + React — existing)                              │
│  • React Router + TanStack Query                                 │
│  • API client → credentials: 'include'                           │
└────────────────────────────┬─────────────────────────────────────┘
                             │ HTTPS /api/v1/*
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│  Backend (/server — to be created)                               │
│  • Fastify or Express                                            │
│  • Auth, RBAC, Zod validation, rate limiting, CSRF                 │
│  • Prisma Client                                                 │
└────────────────────────────┬─────────────────────────────────────┘
                             │ DATABASE_URL (pooled)
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│  Neon PostgreSQL                                                 │
│  • prisma migrate deploy                                         │
│  • Optional: Neon branching for preview environments             │
└──────────────────────────────────────────────────────────────────┘
```

---

## 3. Prisma schema (created)

**Location:** [`prisma/schema.prisma`](prisma/schema.prisma)  
**Diagram:** [`ERD.md`](ERD.md)

### Tables

| Table | Origin | Purpose |
|-------|--------|---------|
| `users` | Replaces `auth.users` | Credentials, lockout, activity |
| `profiles` | Preserved | Member info, approval, status |
| `roles` | New lookup | `ADMIN`, `USER` seed rows |
| `user_roles` | Preserved | M:N user ↔ role |
| `contributions` | Preserved | Monthly 105,000 RWF tracking |
| `loans` | Preserved + extended | Loan lifecycle incl. `DEFAULTED` |
| `loan_payments` | Preserved + extended | Installments + payments |
| `fines` | Preserved + extended | Penalties with `amount_paid` |
| `fine_payments` | **Added** | Was in app code, missing from Supabase migration |
| `admin_approval_requests` | **Added** | Two-admin workflow |
| `audit_logs` | **Added** | Admin action trail |
| `notifications` | **Added** | In-app alerts (replaces polling) |
| `refresh_tokens` | **Added** | HttpOnly cookie session refresh |

### Design decisions

1. **Separate `users` and `profiles`** — mirrors Supabase split; simplifies data migration (preserve `auth.users.id` → `users.id`).
2. **`roles` lookup table** — per `AGENT.md`; seed `ADMIN` and `USER` instead of inline enum on `user_roles`.
3. **`MemberStatus` enum** — `PENDING` / `ACTIVE` / `INACTIVE` replaces boolean-only approval + ad-hoc `status` string.
4. **`recorded_by_id` / `issued_by_id`** — audit trail on financial writes before `audit_logs` is queried.
5. **No RLS** — authorization enforced in API layer (Neon has no Supabase Auth integration).
6. **Snake_case in DB** — `@map` on all columns for PostgreSQL convention.

---

## 4. Neon setup (Phase 3)

### 4.1 Create Neon project

1. Create project at [console.neon.tech](https://console.neon.tech) (or use Neon MCP in Cursor).
2. Region: choose closest to users (e.g. `aws-eu-central-1` for Rwanda/EU latency).
3. Create database: `inzozi_nziza`.

### 4.2 Connection strings

Neon provides two URLs — use both:

```env
# Pooled — use in application runtime (serverless-friendly)
DATABASE_URL="postgresql://user:pass@ep-xxx-pooler.region.aws.neon.tech/inzozi_nziza?sslmode=require"

# Direct — use for Prisma migrations only
DIRECT_URL="postgresql://user:pass@ep-xxx.region.aws.neon.tech/inzozi_nziza?sslmode=require"
```

Add to `prisma/schema.prisma` datasource when running migrations:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

### 4.3 Install Prisma (root or `/server`)

```bash
npm install prisma @prisma/client --save-dev
npm install @prisma/client
```

Add to root `package.json`:

```json
{
  "scripts": {
    "db:generate": "prisma generate",
    "db:migrate": "prisma migrate dev",
    "db:migrate:deploy": "prisma migrate deploy",
    "db:seed": "prisma db seed",
    "db:studio": "prisma studio"
  },
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  }
}
```

### 4.4 First migration

```bash
# After DATABASE_URL and DIRECT_URL are set in .env
npx prisma migrate dev --name init
npx prisma generate
```

### 4.5 Seed script (`prisma/seed.ts` — to create in Phase 3)

```typescript
// Pseudocode — implement in Phase 3
await prisma.role.createMany({
  data: [{ name: 'ADMIN' }, { name: 'USER' }],
  skipDuplicates: true,
});

// Create initial admin from env — never from public signup
const adminRole = await prisma.role.findUnique({ where: { name: 'ADMIN' } });
const passwordHash = await hash(process.env.INITIAL_ADMIN_PASSWORD!);
const admin = await prisma.user.create({
  data: {
    email: process.env.INITIAL_ADMIN_EMAIL!,
    passwordHash,
    emailVerifiedAt: new Date(),
    profile: { create: { fullName: 'System Admin', isApproved: true, status: 'ACTIVE' } },
    userRoles: { create: { roleId: adminRole!.id } },
  },
});
```

### 4.6 Neon branching (optional)

| Branch | Use |
|--------|-----|
| `main` | Production |
| `dev` | Local development |
| `preview/pr-*` | CI preview per PR |

Each branch gets its own `DATABASE_URL` — ideal for safe migration testing.

---

## 5. Data migration from Supabase (Phase 9)

Only required if production Supabase data exists.

### 5.1 Export order (respect FKs)

```
roles (seed first)
  ↓
users  ← auth.users
  ↓
profiles, user_roles, refresh_tokens (empty initially)
  ↓
contributions, loans, fines
  ↓
loan_payments, fine_payments
  ↓
notifications, audit_logs, admin_approval_requests (empty initially)
```

### 5.2 Field mapping

| Supabase | Prisma | Transform |
|----------|--------|-----------|
| `auth.users.id` | `users.id` | Keep UUID |
| `auth.users.email` | `users.email` | Lowercase trim |
| `auth.users.encrypted_password` | `users.password_hash` | Verify bcrypt compat or force reset |
| `profiles.is_approved = false` | `profiles.status = PENDING` | |
| `profiles.is_approved = true` | `profiles.status = ACTIVE` | |
| `user_roles.role = 'admin'` | `user_roles` → `roles.name = ADMIN` | Lookup role ID |
| `user_roles.role = 'user'` | `user_roles` → `roles.name = USER` | Lookup role ID |
| `loans.status = 'defaulted'` | `loans.status = DEFAULTED` | Uppercase enum |
| `contributions.status` | `ContributionStatus` | Uppercase enum |
| `fines` (no `amount_paid`) | `fines.amount_paid` | Compute from `fine_payments` sum or 0 |

### 5.3 Validation queries (post-import)

```sql
-- User count match
SELECT COUNT(*) FROM users;

-- Contribution totals reconcile
SELECT SUM(amount) FROM contributions WHERE status = 'COMPLETED';

-- No orphan loan payments
SELECT COUNT(*) FROM loan_payments lp
LEFT JOIN loans l ON l.id = lp.loan_id WHERE l.id IS NULL;
```

### 5.4 Cutover checklist

- [ ] Put Supabase project in read-only mode
- [ ] Run final export
- [ ] Import to Neon
- [ ] Run validation queries
- [ ] Deploy new API + frontend
- [ ] Smoke test login, dashboard, admin
- [ ] Revoke Supabase anon key after 7-day rollback window

---

## 6. Backend API plan (Phases 4–6)

Base path: `/api/v1`

### Auth (Phase 4)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/signup` | Member only — no role param |
| POST | `/auth/login` | Sets HttpOnly cookies |
| POST | `/auth/logout` | Revokes refresh token |
| POST | `/auth/refresh` | Rotates access token |
| POST | `/auth/forgot-password` | Email reset link |
| POST | `/auth/reset-password` | Token-based reset |

### Member (Phase 5–6) — requires `ACTIVE` profile

| Method | Path | Prisma models |
|--------|------|---------------|
| GET | `/me` | `User`, `Profile`, `UserRole` |
| PATCH | `/me/profile` | `Profile` |
| GET | `/me/contributions` | `Contribution` |
| GET | `/me/contributions/summary` | `Contribution` (monthly agg) |
| GET | `/me/loans` | `Loan`, `LoanPayment` |
| POST | `/me/loans` | `Loan` |
| GET | `/me/fines` | `Fine`, `FinePayment` |
| GET | `/me/notifications` | `Notification` |
| GET | `/me/report.pdf` | Multiple |

### Admin (Phase 5–6) — requires `ADMIN` role

| Method | Path | Notes |
|--------|------|-------|
| GET | `/admin/users` | All profiles + stats |
| POST | `/admin/users/:id/approve` | Creates `AdminApprovalRequest` or direct if config allows |
| GET | `/admin/loans` | **All loans** — fixes BUG-01 |
| POST | `/admin/loans/:id/approve` | Two-admin via `AdminApprovalRequest` |
| POST | `/admin/contributions` | `Contribution` + `AuditLog` |
| POST | `/admin/fines` | `Fine` + `Notification` |
| GET | `/admin/approval-requests` | Pending inbox |
| POST | `/admin/approval-requests/:id/resolve` | Second admin acts |

Every mutating admin route writes to `audit_logs`.

---

## 7. Two-admin approval flow (Phase 8)

Sensitive actions per `AGENT.md` create a `AdminApprovalRequest` instead of executing immediately:

```
Admin A → POST /admin/loans/:id/approve
       → INSERT admin_approval_requests (status: PENDING)
       → INSERT notifications (all other admins)
       → INSERT audit_logs (action: LOAN_APPROVAL_REQUESTED)

Admin B → POST /admin/approval-requests/:id/resolve { decision: APPROVED }
       → UPDATE loan, create loan_payments, etc.
       → UPDATE admin_approval_requests (status: APPROVED)
       → INSERT notifications (member + Admin A)
       → INSERT audit_logs (action: LOAN_APPROVED)
```

| `ApprovalRequestType` | Trigger |
|-----------------------|---------|
| `GRANT_ADMIN` | Promote user to admin |
| `APPROVE_MEMBER` | Activate pending member |
| `APPROVE_LOAN` | Approve loan application |
| `DENY_LOAN` | Deny loan application |
| `DELETE_USER` | Remove member |
| `DEACTIVATE_USER` | Set `profiles.status = INACTIVE` |
| `CONTRIBUTION_CORRECTION` | Adjust recorded contribution |
| `CANCEL_FINE` | Cancel outstanding fine |

---

## 8. Frontend migration (Phase 6)

### Replace Supabase imports

| File | Replace with |
|------|--------------|
| `src/pages/Auth.tsx` | `POST /auth/login`, `/auth/signup` |
| `src/pages/Dashboard.tsx` | `GET /me/*` hooks |
| `src/pages/AdminDashboard.tsx` | `GET/POST /admin/*` hooks |
| `src/pages/Profile.tsx` | `PATCH /me/profile`, `/me/password` |
| `src/components/FinesManagement.tsx` | `/admin/fines/*` |
| `src/components/UserFines.tsx` | `GET /me/fines` |
| `src/integrations/supabase/*` | **Delete** |

### New files to create

```
src/lib/api.ts           # fetch wrapper, CSRF header
src/hooks/useAuth.ts     # session from /me
src/hooks/useContributions.ts
src/hooks/useLoans.ts
src/hooks/useFines.ts
src/hooks/useNotifications.ts
```

---

## 9. Repository structure

```
inzozi-nziza/
├── prisma/
│   ├── schema.prisma      ✅ Created
│   ├── seed.ts            ⬜ Phase 3
│   └── migrations/        ⬜ Phase 3 (after neon migrate dev)
├── server/                ⬜ Phase 4
│   └── src/
├── src/                   # Existing frontend
├── ERD.md                 ✅ Created
├── AUDIT.md
├── SECURITY_ISSUES.md
├── MIGRATION_PLAN.md      ✅ This file
└── AGENT.md
```

---

## 10. Environment variables

### Server / Prisma (`.env` — never commit)

```env
# Neon
DATABASE_URL=postgresql://...@ep-xxx-pooler.../inzozi_nziza?sslmode=require
DIRECT_URL=postgresql://...@ep-xxx.../inzozi_nziza?sslmode=require

# Auth
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
COOKIE_SECRET=
CSRF_SECRET=

# Seed (one-time)
INITIAL_ADMIN_EMAIL=admin@inzozi.rw
INITIAL_ADMIN_PASSWORD=

# App
APP_URL=http://localhost:8080
API_URL=http://localhost:3000
NODE_ENV=development
```

### Frontend (`.env`)

```env
VITE_API_URL=http://localhost:3000
```

---

## 11. Supabase removal checklist

| Step | Phase |
|------|-------|
| All API routes implemented | 4–6 |
| Frontend uses API only | 6 |
| Delete `src/integrations/supabase/` | 6 |
| Remove `@supabase/supabase-js` from `package.json` | 6 |
| Archive `supabase/migrations/` | 10 |
| Rotate + delete Supabase project | 10 |

---

## 12. Risk register

| Risk | Mitigation |
|------|------------|
| Password hashes incompatible | Test bcrypt import; fallback to forced reset |
| Live Supabase schema differs from repo migration | Export `pg_dump --schema-only` before data migration |
| Neon cold starts | Use pooled `DATABASE_URL`; keep-alive ping in API |
| Prisma migrate on Neon production | Use `migrate deploy` in CI, never `migrate dev` |

---

## 13. Timeline (updated)

| Phase | Duration | Cumulative |
|-------|----------|------------|
| 1 Audit | Done | — |
| 2 Prisma schema | Done | — |
| 3 Neon + first migration | 1–2 days | ~2 days |
| 4 Auth API | 3–5 days | ~7 days |
| 5 RBAC + read/write API | 5–8 days | ~15 days |
| 6 Frontend integration | 4–6 days | ~21 days |
| 7 UI refresh | 5–8 days | ~29 days |
| 8 Two-admin + notifications | 3–4 days | ~33 days |
| 9 Data migration (if needed) | 1–2 days | ~35 days |
| 10 Decommission Supabase | 1 day | ~36 days |

**MVP (Phases 3–6):** ~3 weeks from today

---

## 14. Immediate next steps

1. **Phase 3** — Create Neon project and add `DATABASE_URL` / `DIRECT_URL` to `.env`
2. Add `directUrl` to `prisma/schema.prisma` datasource
3. Run `npx prisma migrate dev --name init`
4. Create `prisma/seed.ts` with roles + initial admin
5. **Phase 4** — Scaffold `/server` with auth routes using `RefreshToken` model

---

## 15. Definition of done

Migration is complete when:

- [ ] `prisma migrate deploy` succeeds on Neon production
- [ ] All 14 tables populated correctly (seed + optional Supabase import)
- [ ] No Supabase packages in `package.json`
- [ ] `SECURITY_ISSUES.md` Critical/High items resolved
- [ ] Two-admin approval works for loan approval and member deactivation
- [ ] `audit_logs` captures every admin mutation
- [ ] `notifications` replace fines polling
- [ ] README matches implementation
