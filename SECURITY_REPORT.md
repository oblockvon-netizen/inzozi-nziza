# Inzozi Nziza — Security Report

**Date:** 2026-06-17  
**Scope:** Full-stack security audit (Fastify API + React frontend)  
**Reference:** `AGENT.md` security requirements, `SECURITY_ISSUES.md` (legacy Supabase findings)

---

## Executive Summary

The **backend API** (`server/`) implements production-grade security controls aligned with `AGENT.md`: cookie-based JWT auth, CSRF double-submit, rate limiting, account lockout, RBAC, Zod validation, input sanitization, audit logging, and Prisma-parameterized queries.

The **frontend** still calls Supabase directly and retains critical legacy vulnerabilities until Phase 6 migration completes. **Do not deploy the current frontend to production without migrating to the API.**

| Area | Backend API | Frontend (current) |
|------|-------------|-------------------|
| Authentication | Secure (HttpOnly cookies, Argon2id) | Supabase + localStorage session |
| Authorization | Server RBAC | Client-side role checks + RLS |
| CSRF | Implemented | N/A (direct Supabase) |
| Input validation | Zod + sanitization | Minimal client validation |
| Audit logs | Implemented | None |
| SQL injection | Protected (Prisma) | PostgREST (parameterized) but RLS bypass risks |

---

## Implemented Controls

### 1. CSRF Protection

| Detail | Value |
|--------|-------|
| **Mechanism** | Double-submit cookie pattern |
| **Cookie** | `inzozi_csrf` (readable by JS) |
| **Header** | `X-CSRF-Token` must match cookie |
| **Exempt routes** | Auth bootstrap endpoints (login, signup, refresh, logout, password reset, verify email, `/csrf`) |
| **Safe methods** | GET, HEAD, OPTIONS skip CSRF |

**Files:** `server/src/middleware/csrf.ts`, `server/src/routes/auth.routes.ts`

**Hardening applied:** Pathname-based matching (ignores query strings); constant-time length check before comparison.

---

### 2. Rate Limiting

| Endpoint group | Limit | Window |
|----------------|-------|--------|
| Global | 200 req | 15 min |
| Login | 10 req | 15 min |
| Signup | 5 req | 1 hour |
| Forgot password | 5 req | 1 hour |
| Reset password | 5 req | 1 hour |
| Verify email | 10 req | 1 hour |
| Change password | 5 req | 1 hour |
| Refresh token | 30 req | 15 min |
| Resend verification | 5 req | 1 hour |
| Admin reads | 100 req | 15 min |
| Admin mutations | 60 req | 15 min |
| Loan applications | 10 req | 1 hour |

**Files:** `server/src/middleware/rateLimit.ts`

---

### 3. Account Lockout

| Setting | Default | Env var |
|---------|---------|---------|
| Max failed attempts | 5 | `MAX_FAILED_LOGIN_ATTEMPTS` |
| Lockout duration | 15 min | `ACCOUNT_LOCKOUT_MINUTES` |

Failed attempts increment on invalid password. Successful login resets counter. Lock returns HTTP 423 with remaining time.

**Files:** `server/src/services/auth.service.ts`

---

### 4. Audit Logs

All sensitive actions write to `audit_logs` with actor, action, entity, metadata, IP, and user agent.

| Action | Trigger |
|--------|---------|
| `member.approved` | Admin approves member |
| `member.rejected` | Admin rejects member |
| `contribution.recorded` | Admin records contribution |
| `loan.application_created` | Member applies for loan |
| `loan.approved` / `loan.denied` | Admin loan decision |
| `loan.payment.recorded` | Admin records loan payment |
| `fine.issued` / `fine.payment.recorded` / `fine.cancelled` | Fine lifecycle |
| `auth.password_changed` | User changes password |

**Read endpoint:** `GET /api/v1/admin/audit-logs?page=1&limit=50&action=...` (admin only)

**Files:** `server/src/lib/audit.ts`, `server/src/services/*.service.ts`, `server/src/routes/admin.routes.ts`

---

### 5. Secure Cookies

| Cookie | HttpOnly | Signed | Secure (prod) | SameSite |
|--------|----------|--------|---------------|----------|
| `inzozi_access` | Yes | Yes | Yes | strict (prod) |
| `inzozi_refresh` | Yes | Yes | Yes | strict (prod) |
| `inzozi_csrf` | No | No | Yes | strict (prod) |

Access and refresh tokens use `@fastify/cookie` signing with `COOKIE_SECRET`. JWT access tokens expire in 15 minutes (configurable). Refresh tokens rotate on each use and are stored hashed in the database.

**Files:** `server/src/utils/cookies.ts`, `server/src/middleware/auth.ts`

---

### 6. Environment Variable Validation

Startup fails fast if required env vars are missing or invalid. Production enforces:

- `APP_URL` and `API_URL` must use HTTPS
- Default placeholder secrets are rejected

**Files:** `server/src/config/env.ts`, `server/.env.example`

---

### 7. Input Sanitization

All user-provided text fields pass through `sanitizeText()`:

- Strips HTML tags
- Removes control characters
- Normalizes whitespace
- Trims input

Applied via Zod `.transform()` on auth and domain schemas.

**Files:** `server/src/lib/sanitize.ts`, `server/src/schemas/auth.schemas.ts`, `server/src/schemas/domain.schemas.ts`

---

### 8. Zod Validation

| Layer | Coverage |
|-------|----------|
| Request body | All POST/PATCH endpoints |
| Query params | Audit log pagination |
| Route params | UUID validation on `userId`, `loanId`, `fineId` |
| Password policy | Min 8 chars, upper + lower + digit |

**Files:** `server/src/middleware/validate.ts`, `server/src/schemas/*.ts`

---

### 9. SQL Injection Protection

All database access uses **Prisma ORM** with parameterized queries. No raw SQL string concatenation in application code. User input never interpolates into query strings.

**Files:** `server/src/lib/prisma.ts`, all `*.service.ts`

---

### 10. XSS Protection

| Control | Implementation |
|---------|----------------|
| API response headers | `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY` via `@fastify/helmet` |
| Referrer policy | `strict-origin-when-cross-origin` |
| Input storage | HTML stripped before persistence |
| JSON-only mutations | `Content-Type: application/json` required when body present |
| Body size limit | 1 MB max request body |

**Frontend note:** React escapes JSX by default. Avoid `dangerouslySetInnerHTML` with user content. The shadcn chart component uses it for CSS variables only (static, not user input).

**Files:** `server/src/middleware/security.ts`, `server/src/app.ts`

---

## Authentication & Authorization Summary

| Control | Status |
|---------|--------|
| Argon2id password hashing | Implemented |
| JWT access + refresh rotation | Implemented |
| HttpOnly cookie storage | Implemented |
| Server-side RBAC | Implemented (`ADMIN`, `USER`, `PENDING_USER`) |
| Permission-based route guards | Implemented |
| Email verification flow | Implemented |
| Password reset with token expiry | Implemented |
| Strong password validation | Implemented |
| Two-admin approval workflow | **Not yet implemented** |

---

## Remaining Risks (Frontend / Migration)

These issues from `SECURITY_ISSUES.md` remain until the frontend migrates off Supabase:

| ID | Risk | Severity | Status |
|----|------|----------|--------|
| SEC-001 | Users can self-approve via RLS | Critical | Open (Supabase frontend) |
| SEC-002 | Admin role from client signup | Critical | Open (`Auth.tsx` hardcoded key) |
| SEC-003 | Anon key in source | Critical | Open (`client.ts`) |
| SEC-004 | Auth tokens in localStorage | High | Open (Supabase client config) |
| SEC-005 | Business logic in React components | Medium | Open |

**Remediation:** Complete Phase 6 — replace Supabase calls with `fetch('/api/v1/...', { credentials: 'include' })`, remove admin role picker, remove hardcoded admin key, delete `src/integrations/supabase/`.

---

## Recommendations

### Before production

1. Migrate frontend to cookie-based API auth (Phase 6)
2. Rotate Supabase keys or decommission Supabase project
3. Set strong random secrets for `JWT_*` and `COOKIE_SECRET`
4. Enable HTTPS on API and app domains
5. Configure SMTP for transactional email
6. Run `prisma migrate deploy` against Neon production database

### Next security milestones

1. **Two-admin approval** for loan approval, fine cancellation, member deletion
2. **Security event logging** for repeated CSRF failures and lockout events
3. **Dependency scanning** in CI (`npm audit`, SAST)
4. **CSP headers** on frontend when served (Vite build / hosting layer)
5. **Session inactivity timeout** if required by policy

---

## Security Test Checklist

- [ ] Login rate limit triggers after 10 attempts in 15 min
- [ ] Account locks after 5 failed passwords
- [ ] CSRF rejected on protected POST without matching header
- [ ] Invalid UUID in route params returns 400
- [ ] HTML in loan purpose is stripped on save
- [ ] Non-admin cannot access `/api/v1/admin/*`
- [ ] Pending user cannot record contributions or apply for loans
- [ ] Audit log entry created on member approval
- [ ] Refresh token rotation invalidates old token
- [ ] Production startup fails with default secrets

---

## File Reference

| Purpose | Path |
|---------|------|
| Env validation | `server/src/config/env.ts` |
| CSRF middleware | `server/src/middleware/csrf.ts` |
| Rate limiting | `server/src/middleware/rateLimit.ts` |
| Security headers | `server/src/middleware/security.ts` |
| Zod validation | `server/src/middleware/validate.ts` |
| Input sanitization | `server/src/lib/sanitize.ts` |
| Audit logging | `server/src/lib/audit.ts` |
| Cookie utilities | `server/src/utils/cookies.ts` |
| Auth service | `server/src/services/auth.service.ts` |
| RBAC guards | `server/src/middleware/guards.ts` |
| Legacy findings | `SECURITY_ISSUES.md` |

---

*This report reflects the security posture after the backend hardening pass. Re-audit after frontend migration and before production deployment.*
