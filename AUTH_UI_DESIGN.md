# Auth UI Design — Inzozi Nziza

Premium SaaS authentication experience aligned with the landing page (Stripe / Linear / Mercury aesthetic).

---

## Pages & routes

| Page | Route | Purpose |
|------|-------|---------|
| Login | `/auth/login` | Email + password sign in |
| Signup | `/auth/signup` | Member registration |
| Forgot password | `/auth/forgot-password` | Request reset email |
| Reset password | `/auth/reset-password?token=` | Set new password from email link |
| Verify email | `/auth/verify-email?token=` | Confirm email from signup link |

Legacy `/auth` redirects to `/auth/login`.

---

## Layout

**Two-column split (desktop ≥ lg):**

```
┌─────────────────────┬─────────────────────┐
│  Branding panel     │  Auth form panel    │
│  (navy, sticky)     │  (centered card)    │
│  Logo, story,       │  Title, form,       │
│  benefits list      │  Google CTA, links  │
└─────────────────────┴─────────────────────┘
```

**Mobile:** Form full-width; branding collapses to compact header strip with logo + tagline.

---

## Color & typography

Matches landing page:

- Background: `#0a0f1a` (navy)
- Form surface: `#111827` with `border-white/10`
- Primary action: emerald accent
- Highlights: gold badges / strength meter
- Display font: Plus Jakarta Sans
- Body: Inter

---

## Left panel — branding

**Elements:**
- Logo mark + "Inzozi Nziza"
- Headline: "Community finance, built for trust"
- Subcopy: 105K RWF savings, loans, admin oversight
- **Benefits list** (icon + text):
  1. Monthly community savings
  2. Transparent loan tracking
  3. Role-based security & audit logs
  4. Admin-approved membership
- Footer quote / trust line

Subtle grid background + emerald radial glow.

---

## Right panel — form patterns

### Shared elements (all pages)

| Element | Behavior |
|---------|----------|
| **Google button** | Full-width outline; shows "coming soon" (OAuth not wired yet) |
| **Divider** | "or continue with email" |
| **Password field** | Visibility toggle (Eye / EyeOff) |
| **Submit button** | Loading spinner + disabled while pending |
| **AuthAlert** | Inline error (red) / success (emerald) / info (gold) |
| **Footer links** | Cross-link between login ↔ signup ↔ forgot |

### Login

- Email, password (toggle)
- Forgot password link
- Sign in CTA
- Link to signup

### Signup

- Full name, email, phone (optional), password (toggle + strength meter)
- Create account CTA
- Link to login
- **No admin key field**

### Forgot password

- Email input
- Send reset link CTA
- Success state: check email message + back to login
- Back to login link

### Reset password

- Reads `token` from URL query
- New password + confirm (both with toggle; strength on primary)
- Reset CTA
- Success state → link to login
- Error if token missing

### Verify email

- Auto-verifies on mount when `token` present
- Loading → success or error state
- Resend verification (email input) on failure
- Link to login

---

## Password strength meter

Matches server validation (`auth.schemas.ts`):

| Rule | Weight |
|------|--------|
| ≥ 8 characters | 25% |
| Lowercase letter | 25% |
| Uppercase letter | 25% |
| Number | 25% |

Visual: 4-segment bar (weak → fair → good → strong) with color progression red → gold → emerald.

Shown on signup and reset password fields.

---

## Motion (Framer Motion)

| Target | Animation |
|--------|-----------|
| Page enter | Fade + slide up form panel |
| Branding items | Stagger fade in |
| Success state | Scale in + check icon |
| Alert | Height auto + opacity |
| Form switch | Crossfade between states |

Respect `prefers-reduced-motion`.

---

## Components

```
src/components/auth/
├── AuthLayout.tsx
├── AuthBrandingPanel.tsx
├── PasswordField.tsx
├── PasswordStrengthMeter.tsx
├── GoogleAuthButton.tsx
├── AuthAlert.tsx
└── AuthFormShell.tsx

src/pages/auth/
├── LoginPage.tsx
├── SignupPage.tsx
├── ForgotPasswordPage.tsx
├── ResetPasswordPage.tsx
├── VerifyEmailPage.tsx
└── AuthRedirect.tsx

src/lib/password-strength.ts
```

---

## API additions

Extend `authApi` in `src/lib/api.ts`:

- `resetPassword({ token, password })`
- `verifyEmail({ token })`
- `resendVerification({ email? })`

---

## Accessibility

- Labels linked to inputs
- `aria-live` on alerts and success states
- Visible focus rings
- Password toggle with `aria-label`
