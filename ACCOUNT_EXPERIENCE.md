# Account Experience — Inzozi Nziza

Premium account management: profile, security, sessions, settings, and notification center.

---

## Routes

| Route | Page | Purpose |
|-------|------|---------|
| `/profile` | Profile hub | Personal information |
| `/profile/security` | Security | Change password |
| `/profile/sessions` | Sessions | Active sessions, revoke |
| `/profile/preferences` | Notification prefs | Category toggles (local) |
| `/settings` | Settings | Theme, privacy, account |
| `/notifications` | Notification center | Inbox with filters |

---

## Profile hub layout

Two-column on desktop:
- **Left sidebar** — avatar, name, email, section nav
- **Right content** — active section via nested routes

Sections:
1. **Personal information** — name, phone, email (read-only), save
2. **Security** — change password with strength meter + visibility toggles
3. **Sessions** — list from API, current badge, revoke one / revoke all others
4. **Notifications** (preferences) — toggle categories stored in `localStorage`

---

## Settings page

- **Appearance** — theme toggle (light/dark)
- **Notifications** — master switch, email digest placeholder
- **Privacy** — link to sessions, export data placeholder
- **Danger zone** — sign out all devices

---

## Notification center

**Data source:** `GET /api/v1/me/notifications` (poll every 20s for near real-time)

**Features:**
| Feature | Implementation |
|---------|----------------|
| Unread counter | `GET /notifications/unread-count` + header badge |
| Priority levels | Mapped from `NotificationType` (high/medium/low) |
| Filters | All, Unread, High, Medium, Low |
| Mark read | Per-item + mark all |
| Real-time feel | Polling + optimistic UI |

**Priority mapping:**
- **High:** `FINE_ISSUED`, `LOAN_DEFAULTED`, `LOAN_PAYMENT_DUE`, `MEMBER_REJECTED`
- **Medium:** `LOAN_APPROVED`, `LOAN_DENIED`, `MEMBER_APPROVED`, `CONTRIBUTION_RECORDED`
- **Low:** `SYSTEM`, approval workflow types, others

---

## API additions

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/me/sessions` | List active sessions |
| DELETE | `/api/v1/me/sessions/:id` | Revoke session |
| POST | `/api/v1/me/sessions/revoke-others` | Revoke all except current |
| GET | `/api/v1/me/notifications` | List notifications |
| GET | `/api/v1/me/notifications/unread-count` | Unread count |
| PATCH | `/api/v1/me/notifications/:id/read` | Mark one read |
| POST | `/api/v1/me/notifications/read-all` | Mark all read |

---

## Components

```
src/components/account/
├── AccountLayout.tsx
├── AccountSidebar.tsx
├── PersonalInfoSection.tsx
├── SecuritySection.tsx
├── SessionsSection.tsx
└── NotificationPreferencesSection.tsx

src/contexts/NotificationContext.tsx
src/lib/notification-utils.ts
src/lib/notification-preferences.ts
src/pages/Settings.tsx
src/pages/NotificationCenter.tsx
src/pages/ProfileLayout.tsx
```

---

## Motion & style

Framer Motion fade on section change. Matches dashboard cards, accent/emerald/gold tokens.
