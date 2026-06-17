# Inzozi Nziza — Migration Plan: Supabase → PostgreSQL + Prisma

**Date:** 2026-06-17  
**Status:** Plan only — no code changes yet  
**Aligned with:** `AGENT.md` phases and target stack

---

## 1. Goals

| Goal | Success criteria |
|------|------------------|
| Remove Supabase dependency | Zero `@supabase/*` imports; no anon key in frontend |
| Standalone PostgreSQL | Neon or Aiven Free tier; connection string server-only |
| Prisma ORM | Schema, migrations, typed client |
| Secure auth | HttpOnly cookies, refresh tokens, bcrypt/argon2 |
| Server RBAC | All mutations through API with middleware |
| Fix known bugs | Admin sees all loans; schema complete; README accurate |
| Production readiness | Audit logs, two-admin approval, rate limiting |

---

## 2. Target Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│  Frontend (keep Vite + React initially)                          │
│  • React Router                                                  │
│  • TanStack Query → API client                                   │
│  • shadcn/ui + Framer Motion (UI refresh in Phase 7)             │
│  • pdf-lib OR server PDF endpoint                                │
└────────────────────────────┬─────────────────────────────────────┘
                             │ REST /api/v1/*
                             │ credentials: 'include' (cookies)
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│  Backend (new: recommend Fastify or Express in /server)          │
│  • Auth routes (login, signup, refresh, logout, reset)           │
│  • Member routes (profile, contributions RO, loans, fines RO)    │
│  • Admin routes (users, contributions, loans, fines, reports)    │
│  • Middleware: auth, rbac, rateLimit, csrf, validate(zod)       │
│  • Services: loanService, contributionService, fineService, etc. │
└────────────────────────────┬─────────────────────────────────────┘
                             │ Prisma Client
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│  PostgreSQL (Neon / Aiven)                                       │
│  • Prisma migrations                                             │
│  • No RLS required (app-layer auth); optional DB constraints     │
└──────────────────────────────────────────────────────────────────┘
```

**Why not Next.js full migration initially:** Current app is Vite SPA. Adding a separate `/server` package minimizes rewrite risk. Next.js can be evaluated in Phase 7 if SSR/API colocation is desired.

---

## 3. Prisma Schema (Target)

Maps current tables + `AGENT.md` requirements. Supabase `auth.users` collapses into `users`.

```prisma
// prisma/schema.prisma (planned — not created yet)

enum Role {
  ADMIN
  USER
}

enum MemberStatus {
  PENDING
  ACTIVE
  INACTIVE
}

enum ContributionStatus {
  PENDING
  COMPLETED
  FAILED
}

enum LoanStatus {
  PENDING
  APPROVED
  DENIED
  DISBURSED
  REPAID
  DEFAULTED
}

enum LoanPaymentStatus {
  PENDING
  PAID
  OVERDUE
}

enum FineStatus {
  PENDING
  PAID
  CANCELLED
}

enum ApprovalRequestType {
  GRANT_ADMIN
  APPROVE_MEMBER
  APPROVE_LOAN
  DENY_LOAN
  DELETE_USER
  DEACTIVATE_USER
  CONTRIBUTION_CORRECTION
  CANCEL_FINE
}

enum ApprovalRequestStatus {
  PENDING
  APPROVED
  REJECTED
  EXPIRED
}

model User {
  id            String    @id @default(uuid())
  email         String    @unique
  passwordHash  String
  emailVerified DateTime?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  lastActiveAt  DateTime?

  profile       Profile?
  roles         UserRole[]
  contributions Contribution[]
  loans         Loan[]
  fines         Fine[]
  sessions      RefreshToken[]
  auditLogs     AuditLog[]     @relation("AuditActor")
  notifications Notification[]
  approvalRequestsCreated  AdminApprovalRequest[] @relation("Requester")
  approvalRequestsReviewed AdminApprovalRequest[] @relation("Reviewer")
}

model Role {
  id   String @id @default(uuid())
  name Role   @unique // maps to enum — or use enum directly on UserRole
}

model UserRole {
  id        String   @id @default(uuid())
  userId    String
  role      Role
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@unique([userId, role])
}

model Profile {
  id          String       @id @default(uuid())
  userId      String       @unique
  fullName    String
  phone       String?
  isApproved  Boolean      @default(false)
  status      MemberStatus @default(PENDING)
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
  user        User         @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Contribution {
  id              String             @id @default(uuid())
  userId          String
  amount          Decimal            @db.Decimal(12, 2)
  paymentDate     DateTime
  status          ContributionStatus @default(PENDING)
  referenceNumber String?
  recordedById    String?            // admin who recorded
  createdAt       DateTime           @default(now())
  updatedAt       DateTime           @updatedAt
  user            User               @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Loan {
  id                String     @id @default(uuid())
  userId            String
  amount            Decimal    @db.Decimal(12, 2)
  purpose           String
  status            LoanStatus @default(PENDING)
  appliedAt         DateTime   @default(now())
  approvedAt        DateTime?
  adminNotes        String?
  dueDate           DateTime?
  interestRate      Decimal?   @db.Decimal(5, 2)
  totalWithInterest Decimal?   @db.Decimal(12, 2)
  amountPaid        Decimal    @default(0) @db.Decimal(12, 2)
  lastPaymentDate   DateTime?
  installmentsCount Int        @default(3)
  createdAt         DateTime   @default(now())
  updatedAt         DateTime   @updatedAt
  user              User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  payments          LoanPayment[]
}

model LoanPayment {
  id                 String            @id @default(uuid())
  loanId             String
  amount             Decimal           @db.Decimal(12, 2)
  dueDate            DateTime
  paidAmount         Decimal           @default(0) @db.Decimal(12, 2)
  paidDate           DateTime?
  status             LoanPaymentStatus @default(PENDING)
  installmentNumber  Int?
  notes              String?
  createdAt          DateTime          @default(now())
  updatedAt          DateTime          @updatedAt
  loan               Loan              @relation(fields: [loanId], references: [id], onDelete: Cascade)
}

model Fine {
  id         String     @id @default(uuid())
  userId     String
  amount     Decimal    @db.Decimal(12, 2)
  amountPaid Decimal    @default(0) @db.Decimal(12, 2)
  reason     String
  status     FineStatus @default(PENDING)
  issuedAt   DateTime   @default(now())
  paidAt     DateTime?
  adminNotes String?
  issuedById String?
  createdAt  DateTime   @default(now())
  updatedAt  DateTime   @updatedAt
  user       User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  payments   FinePayment[]
}

model FinePayment {
  id        String   @id @default(uuid())
  fineId    String
  amount    Decimal  @db.Decimal(12, 2)
  paidAt    DateTime @default(now())
  recordedById String?
  fine      Fine     @relation(fields: [fineId], references: [id], onDelete: Cascade)
}

model AdminApprovalRequest {
  id            String                @id @default(uuid())
  type          ApprovalRequestType
  status        ApprovalRequestStatus @default(PENDING)
  requesterId   String
  reviewerId    String?
  targetUserId  String?
  targetLoanId  String?
  targetFineId  String?
  payload       Json                  // amounts, notes, etc.
  createdAt     DateTime              @default(now())
  resolvedAt    DateTime?
  requester     User                  @relation("Requester", fields: [requesterId], references: [id])
  reviewer      User?                 @relation("Reviewer", fields: [reviewerId], references: [id])
}

model AuditLog {
  id         String   @id @default(uuid())
  actorId    String?
  action     String
  entityType String
  entityId   String?
  metadata   Json?
  ipAddress  String?
  createdAt  DateTime @default(now())
  actor      User?    @relation("AuditActor", fields: [actorId], references: [id])
}

model Notification {
  id        String   @id @default(uuid())
  userId    String
  title     String
  body      String
  read      Boolean  @default(false)
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model RefreshToken {
  id        String   @id @default(uuid())
  userId    String
  tokenHash String   @unique
  expiresAt DateTime
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

### Schema mapping: Supabase → Prisma

| Supabase (current) | Prisma (target) | Notes |
|--------------------|-----------------|-------|
| `auth.users` | `User` | Add `passwordHash`; migrate emails |
| `profiles` | `Profile` | Add `status` enum; merge `is_approved` |
| `user_roles` | `UserRole` | Keep `admin`/`user` |
| `contributions` | `Contribution` | Add `recordedById` |
| `loans` | `Loan` | Add `DEFAULTED` to enum |
| `loan_payments` | `LoanPayment` | Add `installmentNumber` |
| `fines` | `Fine` | Add `amountPaid` |
| — | `FinePayment` | **New** (exists in code, missing in migration) |
| — | `AdminApprovalRequest` | **New** per AGENT.md |
| — | `AuditLog` | **New** |
| — | `Notification` | **New** (replace polling) |
| — | `RefreshToken` | **New** for cookie auth |

---

## 4. API Design (Planned)

Base path: `/api/v1`

### Auth

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/signup` | Public | Member signup only (no role param) |
| POST | `/auth/login` | Public | Returns cookies |
| POST | `/auth/logout` | User | Clears cookies |
| POST | `/auth/refresh` | Refresh cookie | Rotate access token |
| POST | `/auth/forgot-password` | Public | Send reset email |
| POST | `/auth/reset-password` | Token | Set new password |

### Member (requires `ACTIVE` profile)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/me` | Profile + roles + approval status |
| PATCH | `/me/profile` | Update name, phone |
| PATCH | `/me/password` | Change password (verify current) |
| GET | `/me/contributions` | List own contributions |
| GET | `/me/contributions/summary` | Monthly 105k progress |
| GET | `/me/loans` | List own loans + payments |
| POST | `/me/loans` | Apply for loan |
| GET | `/me/fines` | List own fines |
| GET | `/me/report.pdf` | Member PDF report |
| GET | `/me/notifications` | List notifications |

### Admin (requires `ADMIN` role)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/admin/users` | All users + stats |
| POST | `/admin/users/:id/approve` | Approve member (or create approval request) |
| POST | `/admin/users/:id/deactivate` | Deactivate (two-admin) |
| POST | `/admin/contributions` | Record contribution |
| PATCH | `/admin/contributions/:id` | Correction (two-admin) |
| GET | `/admin/loans` | **All** loans (fixes BUG-01) |
| POST | `/admin/loans/:id/approve` | Approve (two-admin) |
| POST | `/admin/loans/:id/deny` | Deny |
| POST | `/admin/loans/:id/payments` | Record payment |
| GET | `/admin/fines` | All fines |
| POST | `/admin/fines` | Issue fine |
| POST | `/admin/fines/:id/payments` | Record fine payment |
| POST | `/admin/fines/:id/cancel` | Cancel (two-admin) |
| GET | `/admin/report.pdf` | Admin PDF report |
| GET | `/admin/approval-requests` | Pending second approvals |
| POST | `/admin/approval-requests/:id/resolve` | Approve/reject request |

### Background jobs (cron or node-cron)

| Job | Schedule | Logic |
|-----|----------|-------|
| `checkOverdueLoans` | Daily | Mark overdue installments; optional DEFAULTED flow |
| `checkInactiveMembers` | Daily | 3-month inactivity deactivation (if product confirms) |
| `cleanupRefreshTokens` | Daily | Delete expired tokens |

---

## 5. Migration Phases

### Phase 0 — Preparation (1–2 days)

- [ ] Confirm Neon or Aiven PostgreSQL project
- [ ] Rotate/revoke exposed Supabase keys
- [ ] Export existing Supabase data (if production data exists)
- [ ] Freeze feature development on Supabase paths
- [ ] Add `server/` package to monorepo (or `apps/api`)

**Deliverables:** Empty PostgreSQL instance, env template, data export scripts

---

### Phase 1 — Prisma foundation (2–3 days)

- [ ] Initialize Prisma in `server/prisma/`
- [ ] Implement schema from Section 3
- [ ] `prisma migrate dev` — initial migration
- [ ] Seed script: first admin user (env-based), no public admin signup
- [ ] Prisma client singleton + connection pooling (Neon serverless driver if needed)

**Deliverables:** `schema.prisma`, initial migration SQL, seed script

---

### Phase 2 — Auth system (3–5 days)

- [ ] Password hashing (argon2id preferred)
- [ ] Access JWT (short-lived, 15m) + refresh token (7d, hashed in DB)
- [ ] HttpOnly, Secure, SameSite cookies
- [ ] Auth middleware: `requireAuth`, `requireApproved`, `requireAdmin`
- [ ] Rate limiting on `/auth/*`
- [ ] Account lockout after 5 failed logins
- [ ] Zod schemas for all auth inputs
- [ ] CSRF token issuance for cookie auth

**Deliverables:** Working login/signup/logout/refresh without Supabase

---

### Phase 3 — Core API — read paths (3–4 days)

- [ ] `GET /me`, contributions, loans, fines endpoints
- [ ] Port business logic from `Dashboard.tsx` into services
- [ ] Monthly contribution summary service (105,000 RWF rule)
- [ ] Fix admin loans list to return **all** loans with borrower info

**Deliverables:** Member read API; integration tests for RBAC

---

### Phase 4 — Core API — write paths (4–6 days)

- [ ] Loan application (member)
- [ ] Admin: approve/deny loan with installment generation (port `calculateLoanDetails`)
- [ ] Admin: record loan payments (update schedule + loan totals)
- [ ] Admin: record contributions
- [ ] Admin: approve members
- [ ] Fines: issue, pay, cancel (port `FinesManagement` logic)
- [ ] Audit log on every mutation

**Deliverables:** Feature parity with current app (minus intentional gaps)

---

### Phase 5 — Two-admin approval + notifications (3–4 days)

- [ ] `AdminApprovalRequest` workflow for sensitive actions per `AGENT.md`
- [ ] First admin creates request; second admin resolves
- [ ] `Notification` records on approval events
- [ ] Replace 5s fines polling with `GET /me/notifications` + optional SSE later

**Deliverables:** Dual-approval for loans, deactivation, fine cancel, admin grant

---

### Phase 6 — Frontend API integration (4–6 days)

- [ ] Create `src/lib/api.ts` fetch wrapper (`credentials: 'include'`)
- [ ] Replace all `supabase.from()` calls with API hooks (TanStack Query)
- [ ] Replace `supabase.auth.*` with auth API
- [ ] Update `Auth.tsx` — remove role selection, admin key
- [ ] Update route guards to use `/me` endpoint
- [ ] Remove `src/integrations/supabase/` directory
- [ ] Remove `@supabase/supabase-js` dependency

**Deliverables:** Frontend fully on new API

---

### Phase 7 — UI refresh (5–8 days, parallelizable)

- [ ] Framer Motion page transitions
- [ ] Dashboard redesign per `AGENT.md` UI direction
- [ ] Link Profile from header
- [ ] Admin tables polish
- [ ] Mobile-first pass

**Deliverables:** Modern UI matching target design

---

### Phase 8 — Reports, jobs, hardening (3–4 days)

- [ ] Server-side PDF generation (optional; or keep pdf-lib with API-gated data)
- [ ] Cron: overdue loans, inactivity (if required)
- [ ] Security headers in deployment config
- [ ] E2E tests: member, pending, admin, two-admin flows

**Deliverables:** Production-ready deployment

---

### Phase 9 — Data migration (1–2 days, if existing data)

**Only if Supabase production has real users:**

1. Export `auth.users` → transform to `User` + `passwordHash`  
   - **Note:** Supabase password hashes may be bcrypt — verify compatibility or force password reset
2. Export `profiles`, `user_roles`, `contributions`, `loans`, `loan_payments`, `fines`, `fine_payments`
3. Map `auth.users.id` → `User.id` (preserve UUIDs for FK integrity)
4. Validate counts and spot-check financial totals
5. Cutover: DNS/deploy new stack; read-only window on Supabase

**If no production data:** Seed only; skip export.

---

### Phase 10 — Decommission Supabase (1 day)

- [ ] Remove `supabase/` directory from repo (or archive)
- [ ] Update `README.md` to match implementation
- [ ] Update deployment docs (Vercel frontend + API host e.g. Railway/Fly/Render)
- [ ] Delete Supabase project after verification period

---

## 6. Repository Structure (Proposed)

```
inzozi-nziza/
├── src/                    # Vite React frontend (existing)
│   ├── lib/api.ts          # NEW — API client
│   ├── hooks/              # useAuth, useContributions, etc.
│   └── pages/              # Updated to use hooks
├── server/                 # NEW
│   ├── src/
│   │   ├── index.ts
│   │   ├── routes/
│   │   ├── middleware/
│   │   ├── services/
│   │   └── utils/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   ├── package.json
│   └── tsconfig.json
├── package.json            # Workspace root (optional npm workspaces)
├── AUDIT.md
├── MIGRATION_PLAN.md
├── SECURITY_ISSUES.md
├── AGENT.md
└── README.md
```

---

## 7. Environment Variables

### Server (never expose to client)

```env
DATABASE_URL=postgresql://...
JWT_ACCESS_SECRET=...
JWT_REFRESH_SECRET=...
COOKIE_SECRET=...
CSRF_SECRET=...
SMTP_HOST=...
SMTP_USER=...
SMTP_PASS=...
APP_URL=https://inzozi.example.com
API_URL=https://api.inzozi.example.com
INITIAL_ADMIN_EMAIL=...
INITIAL_ADMIN_PASSWORD=...  # seed only, change on first login
```

### Frontend

```env
VITE_API_URL=https://api.inzozi.example.com
```

---

## 8. Supabase Removal Checklist

| Item | Phase |
|------|-------|
| Remove `src/integrations/supabase/client.ts` | 6 |
| Remove `src/integrations/supabase/types.ts` | 6 |
| Remove `@supabase/supabase-js` from package.json | 6 |
| Remove Supabase auth from all pages | 6 |
| Remove `supabase/` config and migrations (after Prisma parity) | 10 |
| Rotate/delete Supabase project keys | 0, 10 |

---

## 9. Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Password hash incompatibility from Supabase export | Medium | High | Force password reset email on migration |
| Schema drift on live Supabase vs repo migration | High | High | Export live schema before data migration |
| Financial data corruption during migration | Low | Critical | Transactional import; reconciliation report |
| Extended downtime during cutover | Medium | Medium | Blue/green deploy; migrate read-only window |
| Scope creep in UI refresh | High | Medium | Phase 7 optional for MVP; ship API first |

---

## 10. Definition of Done

Migration is complete when:

1. No Supabase packages or credentials in the repository
2. All CRUD operations go through authenticated API routes
3. `SECURITY_ISSUES.md` Critical and High items are resolved
4. Admin can view and manage **all** member loans
5. `fine_payments` and full fines model exist in Prisma migrations
6. Two-admin approval works for loan approval and member deactivation
7. Audit logs capture admin financial actions
8. README accurately describes stack and features
9. E2E tests pass for member, pending, and admin roles
10. Production deployed with HTTPS, secure cookies, rate limiting

---

## 11. Estimated Timeline

| Phase | Duration | Cumulative |
|-------|----------|------------|
| 0 Preparation | 1–2 days | ~2 days |
| 1 Prisma | 2–3 days | ~5 days |
| 2 Auth | 3–5 days | ~10 days |
| 3 Read API | 3–4 days | ~14 days |
| 4 Write API | 4–6 days | ~20 days |
| 5 Two-admin + notifications | 3–4 days | ~24 days |
| 6 Frontend integration | 4–6 days | ~30 days |
| 7 UI refresh | 5–8 days | ~38 days |
| 8 Hardening | 3–4 days | ~42 days |
| 9 Data migration | 1–2 days | ~44 days |
| 10 Decommission | 1 day | ~45 days |

**MVP (phases 0–6, skip UI refresh):** ~4–5 weeks  
**Full rebuild (all phases):** ~6–9 weeks

---

## 12. Immediate Next Steps (Awaiting Approval)

1. **Review** this plan and `SECURITY_ISSUES.md` — confirm two-admin scope and inactivity rule
2. **Choose** API framework (Fastify recommended for performance + Zod integration)
3. **Choose** PostgreSQL host (Neon MCP available in workspace)
4. **Approve** Phase 0 start: scaffold `server/`, Prisma, env template
5. **Do not** deploy current Supabase build to production until SEC-001/002/003 remediated

No files have been modified except these three planning documents.
