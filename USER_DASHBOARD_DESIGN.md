# User Dashboard Design — Inzozi Nziza

Modern analytics dashboard for community members — premium fintech feel aligned with landing and auth pages.

---

## Goals

| Goal | Approach |
|------|----------|
| Feel data-rich | KPI grid, 3 charts, activity feed, notifications |
| Actionable | Quick actions in hero (apply loan, download report) |
| Trustworthy | Clear RWF formatting, status badges, progress bars |
| Animated | Framer Motion stagger on sections; chart fade-in |

---

## Layout (desktop)

```
┌──────────────────────────────────────────────────────────────┐
│ AppShell header (existing)                                    │
├──────────────────────────────────────────────────────────────┤
│ 1. Welcome Hero — greeting, date, quick actions               │
├──────────────────────────────────────────────────────────────┤
│ 2. KPI Cards — 4-column grid                                  │
├───────────────────────────────┬──────────────────────────────┤
│ 3. Contribution Progress      │ 7. Notifications             │
│    (wide)                     │    (sidebar)                 │
├───────────────────────────────┴──────────────────────────────┤
│ 4. Loan Overview — horizontal loan cards                    │
├──────────────────────────────────────────────────────────────┤
│ 5. Charts — 3-column: trends | repayment | growth           │
├──────────────────────────────────────────────────────────────┤
│ 6. Recent Activity — unified timeline                         │
└──────────────────────────────────────────────────────────────┘
```

Mobile: single column; notifications below KPIs.

---

## Section specs

### 1. Welcome Hero

- Gradient navy card with emerald accent glow
- "Good morning/afternoon/evening, {name}"
- Subline: member since / email verified badge
- Quick actions: **Apply for loan**, **Download report**
- Animated entrance

### 2. KPI Cards

| KPI | Source |
|-----|--------|
| Monthly progress | `summary.progressPercent` |
| Total contributed (all time) | Sum of completed contributions |
| Active loans | Approved loans count |
| Outstanding fines | Sum of pending fine balances |

Icons: emerald, gold, navy accents. Stagger animation.

### 3. Contribution Progress

Enhanced `ContributionProgress` in dedicated card:
- Large progress ring optional + bar
- Month label, remaining RWF, completion state

### 4. Loan Overview

Horizontal scroll or grid of loan cards:
- Amount, purpose, status badge
- Repayment progress bar per approved loan
- Empty state with CTA to apply

### 5. Charts (Recharts)

| Chart | Type | Data |
|-------|------|------|
| Contribution trends | Area chart | Monthly totals (last 6 months) |
| Loan repayment | Bar chart | Paid vs remaining per active loan |
| Growth history | Line chart | Cumulative contributions over time |

Theme-aware tooltips; accent/gold stroke fills.

### 6. Recent Activity

Unified feed merging:
- Contributions (payment date)
- Loan applications (appliedAt)
- Fines (issuedAt)

Sorted desc, max 10 items. Icon + title + amount + relative time + status badge.

### 7. Notifications

Derived alerts (no backend push yet):
- Monthly contribution incomplete
- Pending loan review
- Outstanding fines
- Loan approved
- Target met this month

Priority styling: info / warning / success. Dismiss not required (static list).

---

## Pending approval state

Unchanged: centered card on MarketingLayout when `PENDING_USER` or not approved.

---

## Components

```
src/lib/dashboard-analytics.ts
src/components/dashboard/user/
├── WelcomeHero.tsx
├── DashboardKpiGrid.tsx
├── ContributionProgressSection.tsx
├── LoanOverviewSection.tsx
├── DashboardCharts.tsx
├── RecentActivityFeed.tsx
└── NotificationsPanel.tsx
```

---

## Tech

- **Recharts** — AreaChart, BarChart, LineChart
- **Framer Motion** — section stagger, hero fade
- **shadcn/ui** — Card, Button, Badge, Progress, Dialog
- **Existing** — AppShell, StatusBadge, ContributionProgress, UserFines data via finesApi

---

## Colors

Uses design tokens: `accent` (emerald), `gold`, `primary` (navy), `muted-foreground`.

Chart palette:
- Primary series: `hsl(var(--accent))`
- Secondary: `hsl(var(--gold))`
- Grid: `hsl(var(--border))`
