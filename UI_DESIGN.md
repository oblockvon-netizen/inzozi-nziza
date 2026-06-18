# Inzozi Nziza — UI Design System

**Direction:** Modern fintech (Stripe / Linear / Ramp quality)  
**Theme:** Rwanda community savings — trustworthy, calm, professional

---

## Principles

1. **Clarity over decoration** — data-first layouts, minimal imagery
2. **Generous spacing** — 8px grid, section padding `py-8`–`py-12`, card padding `p-6`
3. **Purposeful motion** — Framer Motion for entrances and progress, not distraction
4. **Glass sparingly** — sticky headers and auth card only
5. **Mobile-first** — single column → multi-column at `md` / `lg`

---

## Color palette (HSL)

| Token | Light | Dark | Use |
|-------|-------|------|-----|
| `--background` | Soft white `210 20% 98%` | Deep navy `222 47% 7%` | Page bg |
| `--foreground` | Navy `222 47% 11%` | `210 40% 96%` | Body text |
| `--primary` | Navy `222 47% 14%` | `210 40% 98%` | Brand, headings |
| `--accent` | Emerald `160 84% 39%` | `160 70% 45%` | Success, CTAs, progress |
| `--gold` | `43 74% 49%` | `43 80% 55%` | Highlights, badges |
| `--muted` | Slate `215 16% 94%` | `217 32% 14%` | Secondary surfaces |
| `--card` | White | `222 40% 10%` | Cards |
| `--border` | `214 20% 90%` | `217 25% 18%` | Dividers |

Semantic: success = emerald, warning = amber, destructive = red (unchanged shadcn).

---

## Typography

- **Font:** Inter (UI), system fallback
- **Display:** `text-4xl`–`text-6xl`, `font-semibold`, tight tracking on hero
- **Page title:** `text-2xl font-semibold tracking-tight`
- **Section:** `text-sm font-medium text-muted-foreground uppercase tracking-wider`
- **Body:** `text-sm` / `text-base`, `leading-relaxed`
- **Numbers:** `tabular-nums` on all financial figures

---

## Layout

### Marketing (landing, auth)
- Full-height centered content
- Subtle mesh gradient background (no particles)
- Single glass auth panel max-width `md`

### App shell (dashboard, admin, profile)
- Sticky header: `h-16`, `border-b`, `bg-background/80 backdrop-blur-xl`
- Content: `container max-w-7xl px-4 sm:px-6 lg:px-8 py-8`
- Admin: stat row → tabs → data tables
- Member: 12-col grid — primary (8) + sidebar stats (4)

---

## Components

| Component | Role |
|-----------|------|
| `AppShell` | Header + nav + page container |
| `StatCard` | Animated KPI with icon |
| `ContributionProgress` | Animated monthly bar + labels |
| `GlassPanel` | Auth / pending approval card |
| `PageTransition` | Route enter/exit fade |
| `MarketingLayout` | Landing/auth background |

---

## Motion (Framer Motion)

| Element | Animation |
|---------|-----------|
| Page | `opacity 0→1`, `y 8→0`, 0.35s ease |
| Stat cards | Stagger 0.08s, spring |
| Progress bar | Width 0→value over 0.8s |
| Lists | Fade-in per row |

---

## Dark mode

- True dark navy background (not pure black)
- Cards slightly elevated (`222 40% 10%`)
- Borders subtle (`217 25% 18%`)
- Emerald accent brightened for contrast

---

## Responsive

| Breakpoint | Behavior |
|------------|----------|
| `< sm` | Stack stats 1-col, hide table columns |
| `md` | 2-col stats |
| `lg` | Full admin 4-col stats, member 8/4 grid |

---

## Do not

- Particle backgrounds on app pages
- Heavy glass on every card
- Stock photos
- Admin key / role picker on signup (backend handles roles)
