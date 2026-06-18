# Landing Page Design — Inzozi Nziza

Premium fintech SaaS landing page inspired by Stripe, Linear, Mercury, Ramp, and Vercel.

---

## Design goals

| Goal | Approach |
|------|----------|
| Premium SaaS feel | Deep navy canvas, generous whitespace, refined typography |
| Trust & credibility | Social proof metrics, testimonials, security badges |
| Clarity | Scannable sections, progressive disclosure, strong CTAs |
| Motion | Subtle Framer Motion — scroll reveals, floating cards, no distraction |
| Brand | Rwanda community finance — emerald growth, gold prosperity |

---

## Color system

| Token | Light | Dark (landing default) | Usage |
|-------|-------|------------------------|-------|
| **Navy deep** | — | `#0a0f1a` | Page background |
| **Navy surface** | — | `#111827` / `#1a2332` | Cards, nav |
| **Emerald** | `hsl(160 84% 39%)` | `hsl(160 70% 45%)` | Primary CTA, accents, success |
| **Gold** | `hsl(43 74% 49%)` | `hsl(43 80% 55%)` | Highlights, badges, metric accents |
| **Foreground** | `hsl(222 47% 11%)` | `hsl(210 40% 96%)` | Headlines |
| **Muted** | `hsl(215 14% 42%)` | `hsl(215 16% 62%)` | Body, captions |

Landing page uses a **forced dark navy theme** via `.landing-page` wrapper — independent of global theme toggle for consistent marketing presentation.

---

## Typography

| Role | Font | Weight | Size (desktop) |
|------|------|--------|----------------|
| Display | Plus Jakarta Sans | 700 | 4.5rem–5.5rem |
| H2 section | Plus Jakarta Sans | 600 | 2.5rem–3rem |
| H3 card | Inter | 600 | 1.25rem |
| Body | Inter | 400 | 1rem–1.125rem |
| Label / badge | Inter | 500 | 0.75rem uppercase tracking-wider |

- Headlines: `tracking-tight`, `text-balance`
- Section labels: emerald or gold pill badges

---

## Layout & spacing

- **Max width:** `1280px` (container)
- **Section padding:** `py-24` to `py-32` (96–128px)
- **Grid gap:** `gap-6` to `gap-8`
- **Card radius:** `rounded-2xl` (16px)
- **Nav height:** 64px sticky, backdrop blur

---

## Section breakdown

### 1. Hero

**Layout:** Two-column on desktop — copy left, floating dashboard preview right.

**Elements:**
- Pill badge: "Rwanda community finance"
- Headline: "Build wealth together, transparently"
- Subhead: 105,000 RWF/month contributions, loans, admin oversight
- CTAs: Primary "Get started" (emerald), Secondary "See how it works" (ghost)
- **Floating visual:** Stacked glass cards — contribution progress, loan balance, member count — with subtle `y` oscillation animation

**Background:** Radial emerald/gold glows + subtle grid pattern

---

### 2. Trust Metrics

**Layout:** 4-column stat bar in glass panel

**Metrics:**
| Stat | Label |
|------|-------|
| 105K RWF | Monthly contribution |
| 500+ | Active members |
| 98% | On-time repayments |
| 24/7 | Platform availability |

Animated count-up on scroll (opacity + y reveal). Gold accent on numbers.

---

### 3. Features

**Layout:** Bento grid (2×2 + wide card)

**Features:**
1. **Community savings** — recurring contributions, progress tracking
2. **Smart loans** — applications, installments, admin approval
3. **Fine management** — accountability, automated reminders
4. **Role-based security** — RBAC, audit logs, CSRF protection (wide card)

Each card: icon in emerald/gold container, hover lift + border glow.

---

### 4. How It Works

**Layout:** Horizontal step timeline (4 steps) with connecting line

| Step | Title | Description |
|------|-------|-------------|
| 01 | Join & verify | Sign up, email verification, admin approval |
| 02 | Contribute monthly | 105,000 RWF tracked in your dashboard |
| 03 | Apply for loans | Submit request, await admin review |
| 04 | Grow together | Repay on schedule, build community credit |

Number badges in gold circles. Cards animate in sequence on scroll.

---

### 5. Testimonials

**Layout:** 3-column card grid

**Cards:** Avatar initials, quote, name, role (member/admin), star rating

Sample personas:
- Marie U. — Group treasurer
- Jean-Paul M. — Small business owner
- Admin Grace K. — Community coordinator

Subtle card tilt on hover.

---

### 6. CTA

**Layout:** Full-width emerald gradient panel with navy overlay pattern

**Copy:** "Ready to start saving with your community?"
**Buttons:** Get started (white/navy), Contact admin (outline)
**Footer note:** No hidden fees · Admin-approved membership · Secure by design

---

## Navigation & footer

**Nav (sticky):**
- Logo + wordmark
- Anchor links: Features, How it works, Testimonials
- Sign in + Get started

**Footer:**
- Logo, tagline
- Links: Auth, Features sections
- © 2026 Inzozi Nziza

---

## Motion (Framer Motion)

| Element | Animation |
|---------|-----------|
| Hero copy | `opacity 0→1`, `y 24→0`, 0.6s |
| Hero cards | Stagger 0.15s, infinite float `y: [0, -8, 0]` 4s |
| Sections | `whileInView` fade up, `viewport: { once: true, margin: "-80px" }` |
| Feature cards | Hover `y: -4`, scale 1.01 |
| Metrics | Stagger children 0.1s |

---

## Components

```
src/components/landing/
├── LandingNav.tsx
├── LandingFooter.tsx
├── HeroSection.tsx
├── TrustMetricsSection.tsx
├── FeaturesSection.tsx
├── HowItWorksSection.tsx
├── TestimonialsSection.tsx
├── CtaSection.tsx
├── FloatingPreview.tsx
└── motion.ts          # shared variants
```

---

## Responsive

| Breakpoint | Behavior |
|------------|----------|
| Mobile | Single column, stacked hero, 2×2 metrics grid |
| Tablet | 2-column features, stacked testimonials |
| Desktop | Full bento, 4-col metrics, side-by-side hero |

---

## Accessibility

- Semantic `<section>` with `aria-labelledby`
- Sufficient contrast on navy (WCAG AA)
- Focus rings on interactive elements
- Reduced motion: respect `prefers-reduced-motion`

---

## Implementation files

| File | Change |
|------|--------|
| `src/pages/Index.tsx` | Compose all sections |
| `src/components/layout/MarketingLayout.tsx` | Optional nav/footer |
| `src/index.css` | Landing utilities (grid, glow) |
| `index.html` | Plus Jakarta Sans font |
| `tailwind.config.ts` | Display font family |
