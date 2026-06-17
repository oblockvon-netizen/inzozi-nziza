# Inzozi Nziza — Security Issues

**Date:** 2026-06-17  
**Scope:** Security audit of current Supabase-based implementation  
**Severity scale:** Critical → High → Medium → Low → Informational

---

## Executive Summary

The application exposes a **Supabase anon key** in the frontend and relies on **Row Level Security** as the primary authorization boundary. Several RLS policies are **overly permissive** (column-level), admin promotion is **client-controlled**, and secrets are **hardcoded**. Migrating to a backend API with Prisma (per `MIGRATION_PLAN.md`) addresses the structural issues; the items below must be fixed during or before migration.

**Critical findings:** 3  
**High findings:** 6  
**Medium findings:** 7  
**Low findings:** 4  
**Informational:** 3

---

## Critical

### SEC-001 — Users can self-approve their account

| Field | Detail |
|-------|--------|
| **Severity** | Critical |
| **Location** | `supabase/migrations/...sql` — policy `"Users can update their own profile"` |
| **Also** | `Auth.tsx` admin signup path updates `is_approved` |

**Description:**  
RLS allows any authenticated user to `UPDATE` their own `profiles` row with **no column restrictions**. A member can set `is_approved = true` via a direct PostgREST request (or modified client) and bypass the pending-approval gate.

**Evidence:**
```sql
CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = user_id);
```

**Impact:** Unauthorized access to contributions, loans, and full dashboard features.

**Remediation:**
- Move approval to server-only API endpoint with admin RBAC
- If retaining RLS temporarily: use column-level policy or trigger preventing `is_approved` changes by non-admins
- Prisma: `is_approved` writable only through `approveMember` admin service

---

### SEC-002 — Admin role assignable from the client

| Field | Detail |
|-------|--------|
| **Severity** | Critical |
| **Location** | `Auth.tsx` lines 77–87 |
| **RLS** | `"Admins can manage roles"` on `user_roles` |

**Description:**  
On signup, users choose "Admin" and the frontend inserts into `user_roles` after `signUp`. Even with RLS, the companion update sets `is_approved = true` on their profile (SEC-001). The admin key `INZOZI_ADMIN_2024` is validated **only in JavaScript** — trivially bypassed via DevTools or direct API calls.

**Impact:** Privilege escalation to admin; full data access and financial control.

**Remediation:**
- Remove role selection from signup UI entirely
- Admin promotion only via existing-admin server action + two-admin approval
- Never accept role from `user_metadata` or request body without server verification
- Remove hardcoded admin key; use invite-only admin onboarding

---

### SEC-003 — Supabase anon key and project URL committed to source

| Field | Detail |
|-------|--------|
| **Severity** | Critical |
| **Location** | `src/integrations/supabase/client.ts` |

**Description:**
```typescript
const SUPABASE_URL = "https://cwuchtwyhtcqfawlgfag.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIs...";
```

**Impact:** Anyone can use the anon key against the live project. Combined with RLS gaps, this enables exploitation at scale. Key rotation required after migration.

**Remediation:**
- Rotate Supabase anon key immediately if project is still live
- Never commit credentials; use environment variables
- After migration: **no database credentials in frontend** — only API base URL

---

## High

### SEC-004 — Session tokens in localStorage (XSS risk)

| Field | Detail |
|-------|--------|
| **Severity** | High |
| **Location** | `client.ts` — `storage: localStorage` |

**Description:** Supabase persists JWT in `localStorage`. Any XSS vulnerability grants full session theft.

**Remediation:** HttpOnly, Secure, SameSite cookies for access/refresh tokens (per `AGENT.md`).

---

### SEC-005 — No server-side authorization layer

| Field | Detail |
|-------|--------|
| **Severity** | High |
| **Location** | All pages/components using `supabase.from()` |

**Description:** All business operations (approve loans, add contributions, issue fines, record payments) are invoked from the browser. Frontend role checks are bypassable.

**Remediation:** Express/Fastify or Next.js API routes with RBAC middleware; frontend calls API only.

---

### SEC-006 — Frontend-only route protection

| Field | Detail |
|-------|--------|
| **Severity** | High |
| **Location** | `AdminDashboard.tsx` `checkAdminRole()`, `Dashboard.tsx` approval gate |

**Description:** `/admin` protection is a client-side redirect after querying `user_roles`. Direct PostgREST calls don't require visiting `/admin`.

**Remediation:** Server-side route guards; return 403 from API for unauthorized roles.

---

### SEC-007 — Password change without current password verification

| Field | Detail |
|-------|--------|
| **Severity** | High |
| **Location** | `Profile.tsx` — `updateUser({ password })` |

**Description:** Attacker with brief session access can change password without knowing the current one. `currentPassword` field is collected in UI state but **never validated**.

**Remediation:** Server endpoint requiring current password verification before update.

---

### SEC-008 — No rate limiting on authentication endpoints

| Field | Detail |
|-------|--------|
| **Severity** | High |
| **Location** | `Auth.tsx` — sign in, sign up, password reset |

**Description:** Unlimited login attempts enable credential stuffing. Password reset can be abused for email harassment.

**Remediation:** Rate limit by IP + email; account lockout after N failures; CAPTCHA on signup if public.

---

### SEC-009 — Missing CSRF protection (future cookie auth)

| Field | Detail |
|-------|--------|
| **Severity** | High (when migrating) |
| **Location** | N/A today (Bearer in localStorage) |

**Description:** Moving to cookie-based auth without CSRF tokens exposes state-changing endpoints.

**Remediation:** SameSite=Strict/Lax cookies + CSRF double-submit or synchronizer token on mutating requests.

---

## Medium

### SEC-010 — Members can INSERT contributions via RLS (UI hidden)

| Field | Detail |
|-------|--------|
| **Severity** | Medium |
| **Location** | RLS `"Users can insert their own contributions"` |

**Description:** RLS allows approved users to insert contribution rows. UI doesn't expose this, but API allows self-crediting payments.

**Remediation:** Restrict contribution INSERT to admin role on server.

---

### SEC-011 — Loan status `defaulted` may violate DB constraint

| Field | Detail |
|-------|--------|
| **Severity** | Medium |
| **Location** | `AdminDashboard.checkOverdueLoans()` |

**Description:** Code sets `status: 'defaulted'` but migration CHECK allows only `pending, approved, denied, disbursed, repaid`. Either fails silently or indicates schema drift.

**Remediation:** Align enum in Prisma schema; validate status transitions server-side.

---

### SEC-012 — No audit logging for financial actions

| Field | Detail |
|-------|--------|
| **Severity** | Medium |
| **Location** | All admin mutations |

**Description:** No record of who approved loans, added contributions, issued fines, or deactivated users.

**Remediation:** `audit_logs` table + middleware logging actor, action, entity, before/after snapshot.

---

### SEC-013 — No two-admin approval for sensitive actions

| Field | Detail |
|-------|--------|
| **Severity** | Medium |
| **Location** | Documented in README; required in `AGENT.md` |

**Description:** Single admin can unilaterally approve members, loans, cancel fines, deactivate users.

**Remediation:** `admin_approval_requests` workflow per `AGENT.md`.

---

### SEC-014 — Admin loans query bug hides data (operational security)

| Field | Detail |
|-------|--------|
| **Severity** | Medium |
| **Location** | `AdminDashboard.loadAdminData()` line 359 — `.eq("user_id", user.id)` |

**Description:** Admins may approve/deny loans they cannot see in UI, or miss fraudulent applications — governance failure.

**Remediation:** Fix query; add server-side list endpoint with admin scope.

---

### SEC-015 — PII in client-generated PDFs without access control

| Field | Detail |
|-------|--------|
| **Severity** | Medium |
| **Location** | `Dashboard.tsx`, `AdminDashboard.tsx` — `pdf-lib` |

**Description:** PDFs generated client-side from data already fetched. Admin PDF includes all users. No export audit trail.

**Remediation:** Server-generated reports with authorization check + audit log entry.

---

### SEC-016 — Schema/type drift enables runtime errors and policy gaps

| Field | Detail |
|-------|--------|
| **Severity** | Medium |
| **Location** | `fine_payments`, `fines.amount_paid`, `profiles.status`, `types.ts` |

**Description:** Code references tables/columns not in migration. Production schema unknown from repo alone — deployment and security reviews unreliable.

**Remediation:** Single source of truth via Prisma migrations; CI schema drift check.

---

## Low

### SEC-017 — No password strength enforcement

| Field | Detail |
|-------|--------|
| **Severity** | Low |
| **Location** | `Auth.tsx` signup/signin forms |

**Description:** Only HTML `required` on password field.

**Remediation:** Zod schema: min length, complexity rules; server-side validation.

---

### SEC-018 — Email verification not enforced before access

| Field | Detail |
|-------|--------|
| **Severity** | Low |
| **Location** | `Auth.tsx`, `Dashboard.tsx` |

**Description:** Signup mentions email verification in toast but dashboard accessible if session exists regardless of `email_confirmed_at`.

**Remediation:** Block login until email verified; server check on every request.

---

### SEC-019 — `user_metadata.role` stored but unused server-side

| Field | Detail |
|-------|--------|
| **Severity** | Low |
| **Location** | `Auth.tsx` signUp options.data.role |

**Description:** Role stored in auth metadata could be misused if future code trusts it.

**Remediation:** Remove role from signup metadata; never trust auth metadata for authorization.

---

### SEC-020 — Verbose error messages to client

| Field | Detail |
|-------|--------|
| **Severity** | Low |
| **Location** | All `toast({ description: error.message })` |

**Description:** Raw Supabase/PostgREST errors may leak schema or policy details.

**Remediation:** Map errors to safe user messages; log details server-side only.

---

## Informational

### SEC-021 — No Content Security Policy headers

| Field | Detail |
|-------|--------|
| **Severity** | Informational |
| **Location** | `vercel.json` — only Cache-Control |

**Remediation:** Add CSP, X-Frame-Options, Referrer-Policy headers.

---

### SEC-022 — No dependency vulnerability scanning in CI

| Field | Detail |
|-------|--------|
| **Severity** | Informational |
| **Location** | `package.json` scripts |

**Remediation:** `npm audit` / Dependabot in CI pipeline.

---

### SEC-023 — Supabase Realtime/Storage bundled but unused

| Field | Detail |
|-------|--------|
| **Severity** | Informational |
| **Location** | `package-lock.json` transitive deps |

**Description:** Increases attack surface in bundle; no runtime use.

**Remediation:** Removed automatically when `@supabase/supabase-js` is removed.

---

## Attack Scenarios (Current Architecture)

### Scenario A — Self-approval

1. Attacker signs up as regular user
2. Uses browser console or curl with session JWT:
   ```http
   PATCH /rest/v1/profiles?user_id=eq.<uuid>
   { "is_approved": true }
   ```
3. Full member access granted

### Scenario B — Admin escalation (if RLS insert succeeds or combined with SEC-001)

1. Sign up with `role=admin` in client (skip key check via modified JS)
2. Insert admin `user_roles` row OR rely on profile self-approval
3. Access `/admin` and all admin RLS policies

### Scenario C — Fake contribution (if approved)

1. Self-approve (Scenario A)
2. `POST /rest/v1/contributions` with `status: completed`, arbitrary amount
3. Monthly progress bar shows false compliance

---

## Remediation Priority Matrix

| Priority | Issue IDs | When |
|----------|-----------|------|
| P0 — Block production use | SEC-001, SEC-002, SEC-003 | Immediately |
| P1 — Migration MVP | SEC-004, SEC-005, SEC-006, SEC-008, SEC-010 | Phase 4–6 |
| P2 — Production hardening | SEC-007, SEC-009, SEC-012, SEC-013, SEC-017 | Phase 7–8 |
| P3 — Operational | SEC-011, SEC-014, SEC-015, SEC-016, SEC-018–023 | Phase 8–10 |

---

## Security Requirements Checklist (`AGENT.md` compliance)

| Requirement | Current | Target |
|-------------|---------|--------|
| Remove frontend admin key | ❌ | Server invite flow |
| Never trust frontend role | ❌ | Server RBAC |
| HttpOnly cookies | ❌ | JWT in cookies |
| Server RBAC middleware | ❌ | Per-route guards |
| CSRF protection | ❌ | Token on mutations |
| Rate limiting | ❌ | Login/signup/admin |
| Account lockout | ❌ | After N failures |
| Strong passwords | ❌ | Zod validation |
| Audit logs | ❌ | `audit_logs` table |
| Two-admin approval | ❌ | `admin_approval_requests` |
| Zod validation | ❌ | All API inputs |
| Hide admin routes server-side | ❌ | API 403 |
| Env vars for secrets | ❌ | `.env` only |
| No DB keys in frontend | ❌ | API layer only |

---

## Post-Migration Security Architecture (Target)

```
Client (React)
    │  HTTPS only
    │  HttpOnly cookies (access + refresh)
    │  CSRF token header on mutations
    ▼
API Server (Express/Fastify or Next.js)
    │  Rate limiter
    │  Auth middleware (verify JWT)
    │  RBAC middleware (role + approval status)
    │  Zod validation
    │  Audit logger
    ▼
Prisma → PostgreSQL (Neon/Aiven)
    │  No public exposure
    │  Migrations versioned in repo
    └  Row-level checks in service layer
```

This document should be reviewed and updated after each migration phase. All Critical and High items must be resolved before production deployment.
