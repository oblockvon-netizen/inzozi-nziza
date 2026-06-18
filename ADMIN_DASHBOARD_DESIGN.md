# Admin Dashboard Design — Operations Center

Transform the admin view into a command-center for community finance operations.

---

## Layout

```
┌─────────────────────────────────────────────────────────────┐
│ AppShell — "Operations center"                               │
├─────────────────────────────────────────────────────────────┤
│ Ops Hero — title, export report, refresh                     │
├─────────────────────────────────────────────────────────────┤
│ KPI Grid (5 cards)                                           │
├──────────────────────────────┬──────────────────────────────┤
│ Approval Center              │ Admin Notifications          │
├──────────────────────────────┴──────────────────────────────┤
│ Analytics — Bar | Area | Pie (Recharts)                      │
├─────────────────────────────────────────────────────────────┤
│ Tabs: Users | Contributions | Loans | Fines | Notifications│
│   └─ Toolbar: search + status filter + bulk actions          │
│   └─ Data table with row selection                           │
└─────────────────────────────────────────────────────────────┘
```

---

## KPI cards

| KPI | Calculation |
|-----|-------------|
| Total members | All users count |
| Pending approvals | Users with `isApproved === false` |
| Active loans | Loans with status `APPROVED` |
| Total contributions | Sum of `COMPLETED` contribution amounts |
| Outstanding debt | Unpaid loan balances + pending fine balances |

Accent colors: navy, emerald, gold, destructive for debt.

---

## Analytics (Recharts)

| Chart | Type | Data |
|-------|------|------|
| Contributions by month | Bar | Last 6 months completed totals |
| Platform growth | Area | Cumulative contributions over time |
| Portfolio mix | Pie | Loan statuses (pending / approved / denied) |

Secondary pie optional: member approval split.

---

## Approval center

Dedicated panel surfacing items needing action:
- Pending member signups — quick approve / reject + bulk from selection
- Pending loan applications — review link + bulk approve/deny

Badge counts on each queue.

---

## Management tabs

Each tab includes **AdminToolbar**:
- **Search** — filter rows by member name, purpose, reason
- **Status filter** — All | Pending | Approved | etc.
- **Bulk actions** — when rows selected:
  - Users: Approve selected, Reject selected
  - Loans: Approve selected, Deny selected

Row checkboxes with select-all in header.

### Users
Existing: approve, reject, add contribution.

### Contributions
Read-only table with search/filter by status.

### Loans
Review dialog, record payment — preserved from current implementation.

### Fines
Reuse `FinesManagement` component with search prop.

### Notifications
Operational alerts derived client-side:
- Pending member approvals
- Pending loan reviews
- Unpaid fines total
- Pending contributions count

---

## Components

```
src/lib/admin-analytics.ts
src/components/admin/
├── AdminOpsHero.tsx
├── AdminKpiGrid.tsx
├── AdminAnalytics.tsx
├── ApprovalCenter.tsx
├── AdminNotifications.tsx
├── AdminToolbar.tsx
├── UsersManagement.tsx
├── ContributionsManagement.tsx
└── LoansManagement.tsx
```

---

## Motion & style

- Framer Motion stagger on KPIs and sections
- Matches member dashboard: cards, borders, accent tokens
- Dense but readable tables with horizontal scroll on mobile

---

## Access control

Non-admin users see existing access-denied screen. Unchanged dialogs for contribution, loan review, payment.
