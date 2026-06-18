# Inzozi Nziza — RBAC

**Status:** Implemented in `server/`  
**Aligned with:** `AGENT.md` Phase 5

---

## Access roles

Resolved at login from DB state (`server/src/lib/access-role.ts`):

| Access role | Condition |
|-------------|-----------|
| `ADMIN` | User has `ADMIN` in `user_roles` |
| `USER` | Approved + `profile.status = ACTIVE` |
| `PENDING_USER` | Not approved or not active |

JWT carries `roles` (DB); API uses **`accessRole`** + **`permissions`** on `request.authUser`.

---

## Permissions

Defined in `server/src/types/rbac.ts` and mapped in `server/src/config/permissions.ts`.

### PENDING_USER
- `view:own_profile`
- `view:pending_status`

### USER
- Own profile, contributions, contribution summary
- Apply for and view own loans
- View own fines

### ADMIN
- All member permissions plus admin namespace:
- Users, contributions, loans, fines (view + mutate)

---

## Middleware stack

| File | Purpose |
|------|---------|
| `middleware/auth.ts` | `requireAuth`, `optionalAuth`, `requireEmailVerified` |
| `middleware/role.ts` | `requireAccessRole('ADMIN' \| 'USER' \| 'PENDING_USER')` |
| `middleware/permissions.ts` | `requirePermission(...)`, `requireAnyPermission(...)` |
| `middleware/guards.ts` | Composed preHandler chains per route group |
| `middleware/rbac.ts` | Legacy DB role checks (deprecated) |

### Guard presets (`guards.ts`)

| Guard | Used on |
|-------|---------|
| `adminOnly` | Admin stats |
| `adminManageUsers` | `GET /admin/users` |
| `adminApproveMembers` | Member approve/reject |
| `adminContributions` | `GET /contributions` |
| `adminRecordContribution` | `POST /contributions` |
| `adminLoans` | `GET /loans` |
| `adminApproveLoan` | `POST /loans/:id/approve` |
| `adminDenyLoan` | `POST /loans/:id/deny` |
| `adminRecordLoanPayment` | `POST /loans/:id/payments` |
| `adminFines` | `GET /fines` |
| `adminIssueFine` | `POST /fines` |
| `adminRecordFinePayment` | `POST /fines/:id/payments` |
| `adminCancelFine` | `POST /fines/:id/cancel` |
| `activeMember` | Member financial routes |
| `memberContributions` | Own contributions |
| `memberLoans` / `memberApplyLoan` | Own loans |
| `memberFines` | Own fines |
| `pendingUser` | `GET /me/pending-status` |

---

## Protected routes

| Prefix | Protection |
|--------|------------|
| `/api/v1/admin/*` | Admin role + permissions |
| `/api/v1/contributions` (admin) | `adminContributions` / `adminRecordContribution` |
| `/api/v1/contributions/mine` | `memberContributions` |
| `/api/v1/loans` (admin) | Loan admin guards |
| `/api/v1/loans/mine` | Member loan guards |
| `/api/v1/fines` (admin) | Fine admin guards |
| `/api/v1/fines/mine` | `memberFines` |
| `/api/v1/me/pending-status` | `PENDING_USER` only |

---

## Audit logs

All admin mutations call `writeAuditLog()` (`server/src/lib/audit.ts`):

| Action | Service |
|--------|---------|
| `member.approved` / `member.rejected` | `admin.service.ts` |
| `contribution.recorded` | `contribution.service.ts` |
| `loan.application_created` | `loan.service.ts` (member apply) |
| `loan.approved` / `loan.denied` | `loan.service.ts` |
| `loan.payment.recorded` | `loan.service.ts` |
| `fine.issued` / `fine.payment.recorded` / `fine.cancelled` | `fine.service.ts` |

Stored in `audit_logs` with `actorId`, `entityType`, `entityId`, `metadata`, IP, user agent.

---

## Rate limiting

- Global: 200 req / 15 min
- Admin mutations: 60 / 15 min (`adminRateLimits.mutations`)
- Auth routes: per-endpoint limits in `authRateLimits`

---

## Usage example

```typescript
app.post(
  "/users/:userId/approve",
  {
    preHandler: adminApproveMembers,
    preValidation: [validateBody(approveMemberSchema)],
  },
  handler
);
```

```typescript
// Custom permission check
app.get(
  "/:loanId",
  {
    preHandler: [
      requireAuth,
      requireAnyPermission(Permission.VIEW_ALL_LOANS, Permission.VIEW_OWN_LOANS),
    ],
  },
  handler
);
```
