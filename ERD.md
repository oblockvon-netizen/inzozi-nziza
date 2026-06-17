# Inzozi Nziza — Entity Relationship Diagram

**Database:** PostgreSQL on Neon  
**ORM:** Prisma (`prisma/schema.prisma`)  
**Last updated:** 2026-06-17

---

## Overview

This schema replaces Supabase `auth.users` + `public.*` tables with a single application-owned PostgreSQL database. Authorization moves from Row Level Security to the API layer; the database enforces integrity via foreign keys, enums, and indexes.

**14 tables** · **9 enums** · **UUID primary keys** throughout

---

## Full ERD

```mermaid
erDiagram
    User ||--o| Profile : has
    User ||--o{ UserRole : has
    Role ||--o{ UserRole : assigned_to
    User ||--o{ Contribution : receives
    User ||--o{ Contribution : records
    User ||--o{ Loan : borrows
    User ||--o{ Loan : reviews
    Loan ||--o{ LoanPayment : has
    User ||--o{ LoanPayment : records
    User ||--o{ Fine : receives
    User ||--o{ Fine : issues
    Fine ||--o{ FinePayment : has
    User ||--o{ FinePayment : records
    User ||--o{ RefreshToken : has
    User ||--o{ Notification : receives
    User ||--o{ AuditLog : performs
    User ||--o{ AdminApprovalRequest : requests
    User ||--o{ AdminApprovalRequest : reviews
    User ||--o{ AdminApprovalRequest : targets
    Loan ||--o{ AdminApprovalRequest : targets
    Fine ||--o{ AdminApprovalRequest : targets

    User {
        uuid id PK
        string email UK
        string password_hash
        timestamptz email_verified_at
        int failed_login_attempts
        timestamptz locked_until
        timestamptz last_active_at
        timestamptz created_at
        timestamptz updated_at
    }

    Profile {
        uuid id PK
        uuid user_id FK UK
        string full_name
        string phone
        boolean is_approved
        member_status status
        timestamptz created_at
        timestamptz updated_at
    }

    Role {
        uuid id PK
        app_role name UK
        timestamptz created_at
    }

    UserRole {
        uuid id PK
        uuid user_id FK
        uuid role_id FK
        timestamptz created_at
    }

    Contribution {
        uuid id PK
        uuid user_id FK
        decimal amount
        timestamptz payment_date
        contribution_status status
        string reference_number
        uuid recorded_by_id FK
        string notes
        timestamptz created_at
        timestamptz updated_at
    }

    Loan {
        uuid id PK
        uuid user_id FK
        decimal amount
        string purpose
        loan_status status
        timestamptz applied_at
        timestamptz approved_at
        uuid reviewed_by_id FK
        string admin_notes
        timestamptz due_date
        decimal interest_rate
        decimal total_with_interest
        decimal amount_paid
        timestamptz last_payment_date
        int installments_count
        timestamptz created_at
        timestamptz updated_at
    }

    LoanPayment {
        uuid id PK
        uuid loan_id FK
        decimal amount
        timestamptz due_date
        decimal paid_amount
        timestamptz paid_date
        loan_payment_status status
        int installment_number
        string notes
        uuid recorded_by_id FK
        timestamptz created_at
        timestamptz updated_at
    }

    Fine {
        uuid id PK
        uuid user_id FK
        decimal amount
        decimal amount_paid
        string reason
        fine_status status
        timestamptz issued_at
        timestamptz paid_at
        uuid issued_by_id FK
        string admin_notes
        timestamptz created_at
        timestamptz updated_at
    }

    FinePayment {
        uuid id PK
        uuid fine_id FK
        decimal amount
        timestamptz paid_at
        uuid recorded_by_id FK
        string notes
        timestamptz created_at
    }

    AdminApprovalRequest {
        uuid id PK
        approval_request_type type
        approval_request_status status
        uuid requester_id FK
        uuid reviewer_id FK
        uuid target_user_id FK
        uuid target_loan_id FK
        uuid target_fine_id FK
        json payload
        string review_notes
        timestamptz expires_at
        timestamptz created_at
        timestamptz resolved_at
    }

    AuditLog {
        uuid id PK
        uuid actor_id FK
        string action
        string entity_type
        uuid entity_id
        json metadata
        string ip_address
        string user_agent
        timestamptz created_at
    }

    Notification {
        uuid id PK
        uuid user_id FK
        notification_type type
        string title
        string body
        boolean read
        json metadata
        timestamptz created_at
        timestamptz read_at
    }

    RefreshToken {
        uuid id PK
        uuid user_id FK
        string token_hash UK
        timestamptz expires_at
        timestamptz revoked_at
        timestamptz created_at
        string user_agent
        string ip_address
    }
```

---

## Domain groupings

### Identity & access

```
users ──┬── profiles (1:1)
        ├── user_roles ── roles (M:N via junction)
        └── refresh_tokens (1:N)
```

| Table | Replaces (Supabase) |
|-------|---------------------|
| `users` | `auth.users` (credentials) |
| `profiles` | `public.profiles` |
| `roles` | `app_role` enum (now seedable lookup) |
| `user_roles` | `public.user_roles` |
| `refresh_tokens` | Supabase session / JWT refresh |

### Financial core

```
users ──┬── contributions
        ├── loans ── loan_payments
        └── fines ── fine_payments
```

| Table | Business rule |
|-------|---------------|
| `contributions` | 105,000 RWF monthly target; admin-recorded |
| `loans` | Member applies; admin approves at 5% / 3 installments |
| `loan_payments` | Installment schedule + ad-hoc payments |
| `fines` | Admin-issued penalties with partial payment support |
| `fine_payments` | Individual payment records against a fine |

### Governance & observability

```
users ──┬── admin_approval_requests (two-admin workflow)
        ├── audit_logs (immutable action trail)
        └── notifications (in-app alerts)
```

---

## Enum reference

| Enum | Values | Used by |
|------|--------|---------|
| `AppRole` | `ADMIN`, `USER` | `roles.name` |
| `MemberStatus` | `PENDING`, `ACTIVE`, `INACTIVE` | `profiles.status` |
| `ContributionStatus` | `PENDING`, `COMPLETED`, `FAILED` | `contributions.status` |
| `LoanStatus` | `PENDING`, `APPROVED`, `DENIED`, `DISBURSED`, `REPAID`, `DEFAULTED` | `loans.status` |
| `LoanPaymentStatus` | `PENDING`, `PAID`, `OVERDUE` | `loan_payments.status` |
| `FineStatus` | `PENDING`, `PAID`, `CANCELLED` | `fines.status` |
| `ApprovalRequestType` | `GRANT_ADMIN`, `APPROVE_MEMBER`, `APPROVE_LOAN`, `DENY_LOAN`, `DELETE_USER`, `DEACTIVATE_USER`, `CONTRIBUTION_CORRECTION`, `CANCEL_FINE` | `admin_approval_requests.type` |
| `ApprovalRequestStatus` | `PENDING`, `APPROVED`, `REJECTED`, `EXPIRED` | `admin_approval_requests.status` |
| `NotificationType` | `MEMBER_APPROVED`, `LOAN_APPROVED`, `FINE_ISSUED`, … | `notifications.type` |

---

## Supabase → Prisma mapping

| Supabase | Prisma | Notes |
|----------|--------|-------|
| `auth.users.id` | `users.id` | Preserve UUIDs on data migration |
| `auth.users.email` | `users.email` | |
| — | `users.password_hash` | New; force reset or import hash |
| `profiles.*` | `profiles.*` | `status` enum replaces ad-hoc `inactive` string |
| `app_role` enum | `roles` + `user_roles` | Seed `ADMIN` and `USER` rows |
| `contributions` | `contributions` | + `recorded_by_id` |
| `loans` | `loans` | + `DEFAULTED` status; + `reviewed_by_id` |
| `loan_payments` | `loan_payments` | + `installment_number` |
| `fines` | `fines` | + `amount_paid` |
| — | `fine_payments` | Missing from Supabase migration; required by app code |
| — | `admin_approval_requests` | New |
| — | `audit_logs` | New |
| — | `notifications` | New |
| — | `refresh_tokens` | New |

---

## Key relationships & delete behavior

| Parent | Child | On delete |
|--------|-------|-----------|
| `users` | `profiles`, `user_roles`, `contributions`, `loans`, `fines`, `refresh_tokens`, `notifications` | `CASCADE` |
| `users` | `contributions.recorded_by`, `loans.reviewed_by`, audit actor | `SET NULL` |
| `loans` | `loan_payments` | `CASCADE` |
| `fines` | `fine_payments` | `CASCADE` |
| `loans` / `fines` / `users` | `admin_approval_requests` targets | `SET NULL` |

---

## Indexes (query patterns)

| Table | Index | Supports |
|-------|-------|----------|
| `users` | `email` | Login lookup |
| `users` | `last_active_at` | Inactivity job |
| `profiles` | `is_approved`, `status` | Member filtering |
| `contributions` | `user_id`, `payment_date`, `status` | Monthly 105k progress |
| `loans` | `user_id`, `status`, `applied_at` | Admin loan queue |
| `loan_payments` | `loan_id`, `due_date`, `status` | Overdue detection |
| `fines` | `user_id`, `status`, `issued_at` | Member + admin views |
| `notifications` | `user_id, read` | Unread badge |
| `audit_logs` | `entity_type, entity_id`, `created_at` | Forensics |
| `admin_approval_requests` | `status`, `type` | Approval inbox |
| `refresh_tokens` | `user_id`, `expires_at` | Session cleanup |

---

## Seed data (required)

On first migration, seed the `roles` table:

| name |
|------|
| `ADMIN` |
| `USER` |

Initial admin user is created via `prisma/seed.ts` using `INITIAL_ADMIN_EMAIL` / `INITIAL_ADMIN_PASSWORD` env vars — never via public signup.

---

## Approval request payload examples

`admin_approval_requests.payload` is JSON for action-specific context:

```json
// APPROVE_LOAN
{ "amount": 500000, "purpose": "Business expansion", "adminNotes": "Approved per committee" }

// CONTRIBUTION_CORRECTION
{ "contributionId": "uuid", "previousAmount": 100000, "newAmount": 105000, "reason": "Data entry error" }

// GRANT_ADMIN
{ "targetEmail": "admin@example.com" }

// CANCEL_FINE
{ "fineId": "uuid", "reason": "Issued in error" }
```

---

## Related documents

- [`prisma/schema.prisma`](prisma/schema.prisma) — source of truth
- [`MIGRATION_PLAN.md`](MIGRATION_PLAN.md) — Neon setup and rollout phases
- [`AUDIT.md`](AUDIT.md) — current Supabase state
- [`SECURITY_ISSUES.md`](SECURITY_ISSUES.md) — issues this schema helps resolve
- [`AGENT.md`](AGENT.md) — rebuild requirements
