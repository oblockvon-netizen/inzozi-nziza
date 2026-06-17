# RBAC API Reference

**Base URL:** `/api/v1`  
**Roles:** `ADMIN`, `USER`, `PENDING_USER` (computed from DB roles + profile approval)

`PENDING_USER` is not stored in the database. Members with `profile.isApproved = false` or `status != ACTIVE` (and without ADMIN role) receive the `PENDING_USER` access role.

---

## Access roles

| Access role | How assigned | Can access |
|-------------|--------------|------------|
| `ADMIN` | `user_roles` contains ADMIN | All admin + own profile |
| `USER` | Approved + ACTIVE, not admin | Own contributions, loans, fines |
| `PENDING_USER` | Not approved or inactive | Pending status screen only |

---

## Middleware

| Middleware | File | Purpose |
|------------|------|---------|
| `requireAuth` | `middleware/auth.ts` | Validates JWT cookie/Bearer |
| `requireAccessRole(...)` | `middleware/role.ts` | Enforces ADMIN / USER / PENDING_USER |
| `requirePermission(...)` | `middleware/permissions.ts` | Fine-grained permission checks |
| `requireAnyPermission(...)` | `middleware/permissions.ts` | Any-of permission check |
| Pre-composed guards | `middleware/guards.ts` | Route chains for admin/member routes |

---

## Protected routes

### Admin (`/api/v1/admin`) — `ADMIN` only

| Method | Path | Permission | Audit log |
|--------|------|------------|-----------|
| GET | `/users` | `admin:view_users` | — |
| GET | `/stats` | ADMIN role | — |
| POST | `/users/:userId/approve` | `admin:approve_members` | `member.approved` |
| POST | `/users/:userId/reject` | `admin:approve_members` | `member.rejected` |

### Contributions (`/api/v1/contributions`)

| Method | Path | Role | Permission | Audit |
|--------|------|------|------------|-------|
| GET | `/mine` | USER | `view:own_contributions` | — |
| GET | `/mine/summary` | USER | `view:own_contribution_summary` | — |
| GET | `/` | ADMIN | `admin:view_contributions` | — |
| POST | `/` | ADMIN | `admin:record_contributions` | `contribution.recorded` |

### Loans (`/api/v1/loans`)

| Method | Path | Role | Permission | Audit |
|--------|------|------|------------|-------|
| GET | `/mine` | USER | `view:own_loans` | — |
| POST | `/mine` | USER | `apply:loan` | `loan.application_created` |
| GET | `/` | ADMIN | `admin:view_loans` | — |
| GET | `/:loanId` | ADMIN or owner | — | — |
| POST | `/:loanId/approve` | ADMIN | `admin:approve_loans` | `loan.approved` |
| POST | `/:loanId/deny` | ADMIN | `admin:deny_loans` | `loan.denied` |
| POST | `/:loanId/payments` | ADMIN | `admin:record_loan_payments` | `loan.payment.recorded` |

### Fines (`/api/v1/fines`)

| Method | Path | Role | Permission | Audit |
|--------|------|------|------------|-------|
| GET | `/mine` | USER | `view:own_fines` | — |
| GET | `/` | ADMIN | `admin:view_fines` | — |
| POST | `/` | ADMIN | `admin:issue_fines` | `fine.issued` |
| POST | `/:fineId/payments` | ADMIN | `admin:record_fine_payments` | `fine.payment.recorded` |
| POST | `/:fineId/cancel` | ADMIN | `admin:cancel_fines` | `fine.cancelled` |

### Pending user (`/api/v1/me`)

| Method | Path | Role | Permission |
|--------|------|------|------------|
| GET | `/pending-status` | PENDING_USER | `view:pending_status` |

### Auth session (`/api/v1/auth/me`)

Returns `user` object including `accessRole` and `permissions` array.

---

## Permission matrix

See `server/src/config/permissions.ts` for the full `ROLE_PERMISSIONS` map.

---

## Audit logs

All admin mutations write to `audit_logs` with:

- `actorId` — admin user ID
- `action` — e.g. `loan.approved`
- `entityType` / `entityId`
- `metadata` — action context (JSON)
- `ipAddress` / `userAgent` — from request

Loan applications by members also create audit entries (`loan.application_created`).
