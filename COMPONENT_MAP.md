# Component Map — UI Redesign

## New layout & dashboard components

| Component | Path | Used by |
|-----------|------|---------|
| `AppShell` | `src/components/layout/AppShell.tsx` | Dashboard, AdminDashboard, Profile |
| `MarketingLayout` | `src/components/layout/MarketingLayout.tsx` | Index, Auth |
| `PageTransition` | `src/components/layout/PageTransition.tsx` | App router wrapper |
| `StatCard` | `src/components/dashboard/StatCard.tsx` | AdminDashboard, Dashboard quick stats |
| `ContributionProgress` | `src/components/dashboard/ContributionProgress.tsx` | Dashboard |
| `AnimatedProgress` | `src/components/dashboard/AnimatedProgress.tsx` | Dashboard loan repayment bars |
| `SectionHeader` | `src/components/dashboard/SectionHeader.tsx` | Admin tabs, activity sections |
| `GlassPanel` | `src/components/ui/glass-panel.tsx` | Auth, pending state |
| `StatusBadge` | `src/components/dashboard/StatusBadge.tsx` | Tables, activity lists |

## Pages → components

| Page | Layout | Key components |
|------|--------|----------------|
| `Index.tsx` | MarketingLayout | Hero, feature grid, CTA buttons |
| `Auth.tsx` | MarketingLayout + GlassPanel | Tabs, form fields, ThemeToggle |
| `Dashboard.tsx` | AppShell | ContributionProgress, StatCard, shadcn Card/Dialog |
| `AdminDashboard.tsx` | AppShell | StatCard×4, Tabs, Table, FinesManagement |
| `Profile.tsx` | AppShell | Form cards |
| `NotFound.tsx` | MarketingLayout | Minimal message |

## Existing (unchanged logic)

| Component | Path | Notes |
|-----------|------|-------|
| `FinesManagement` | `src/components/FinesManagement.tsx` | Admin fines tab — styled via parent |
| `UserFines` | `src/components/UserFines.tsx` | Member fines list |
| `LoadingSpinner` | `src/components/LoadingSpinner.tsx` | Updated visual |
| shadcn/ui | `src/components/ui/*` | Tokens updated via CSS variables |

## Removed from app shell

| Component | Reason |
|-----------|--------|
| `ParticleBackground` | Replaced by mesh gradient (marketing) / clean bg (app) |

## Design tokens

| File | Contents |
|------|----------|
| `src/index.css` | HSL variables, mesh utilities |
| `tailwind.config.ts` | `accent`, `gold`, font family |
| `index.html` | Inter font preload |

## Backend RBAC (reference)

See `RBAC.md` — frontend should call API with cookies; route guards are server-side.
