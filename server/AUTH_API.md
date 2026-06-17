# Auth API

Base URL: `http://localhost:3000` (configurable via `API_URL`)

All authenticated mutations (except exempt auth routes) require the `X-CSRF-Token` header matching the `inzozi_csrf` cookie.

## Cookies

| Cookie | HttpOnly | Purpose |
|--------|----------|---------|
| `inzozi_access` | Yes | JWT access token (15 min default) |
| `inzozi_refresh` | Yes | Opaque refresh token (7 days default) |
| `inzozi_csrf` | No | CSRF double-submit token |

Send requests with `credentials: 'include'` from the frontend.

---

## Endpoints

### `GET /health`

Health check.

**Response:** `{ "status": "ok" }`

---

### `GET /api/v1/auth/csrf`

Issue a CSRF token cookie.

**Response:** `{ "csrfToken": "..." }`

---

### `POST /api/v1/auth/signup`

Register a new member (USER role only — no admin self-signup).

**Rate limit:** 5 / hour / IP

**Body:**
```json
{
  "email": "member@example.com",
  "password": "SecurePass1",
  "fullName": "Jean Baptiste",
  "phone": "+250788000000"
}
```

**Response `201`:**
```json
{
  "user": {
    "id": "uuid",
    "email": "member@example.com",
    "roles": ["USER"],
    "emailVerified": false,
    "isApproved": false,
    "status": "PENDING",
    "fullName": "Jean Baptiste"
  },
  "csrfToken": "..."
}
```

Sets auth cookies. Sends verification email.

---

### `POST /api/v1/auth/login`

**Rate limit:** 10 / 15 min / IP

**Body:**
```json
{
  "email": "member@example.com",
  "password": "SecurePass1"
}
```

**Response `200`:** Same shape as signup (without `201`).

**Errors:**
- `401` — Invalid credentials
- `423` — Account locked after repeated failures

---

### `POST /api/v1/auth/refresh`

Rotate access + refresh tokens using `inzozi_refresh` cookie.

**Rate limit:** 30 / 15 min / IP

**Response `200`:** User + `csrfToken`; new cookies set.

---

### `POST /api/v1/auth/logout`

Revoke refresh token and clear cookies.

**Auth:** Required (access cookie)

**CSRF:** Required

**Response `200`:** `{ "message": "Logged out successfully" }`

---

### `GET /api/v1/auth/me`

Current session user.

**Auth:** Required

**Response `200`:**
```json
{
  "user": { ... }
}
```

---

### `POST /api/v1/auth/forgot-password`

**Rate limit:** 5 / hour / IP

**Body:**
```json
{ "email": "member@example.com" }
```

**Response `200`:** Always generic success (no email enumeration).

---

### `POST /api/v1/auth/reset-password`

**Body:**
```json
{
  "token": "token-from-email",
  "password": "NewSecurePass1"
}
```

Revokes all refresh tokens. Clears cookies.

**Response `200`:** `{ "message": "Password reset successfully. Please sign in." }`

---

### `POST /api/v1/auth/verify-email`

**Body:**
```json
{ "token": "token-from-email" }
```

**Response `200`:** `{ "user": { ... }, "message": "Email verified successfully" }`

---

### `POST /api/v1/auth/resend-verification`

**Rate limit:** 5 / hour / IP

**Body (optional if authenticated):**
```json
{ "email": "member@example.com" }
```

**Response `200`:** Generic success message.

---

### `POST /api/v1/auth/change-password`

**Auth:** Required

**CSRF:** Required

**Body:**
```json
{
  "currentPassword": "SecurePass1",
  "newPassword": "NewSecurePass1"
}
```

Revokes all sessions after password change.

---

## Middleware

| Middleware | File | Purpose |
|------------|------|---------|
| `requireAuth` | `middleware/auth.ts` | Validates JWT from cookie or `Authorization: Bearer` |
| `optionalAuth` | `middleware/auth.ts` | Attaches user when token present |
| `requireEmailVerified` | `middleware/auth.ts` | Blocks unverified email |
| `requireApprovedMember` | `middleware/auth.ts` | Blocks pending/inactive members |
| `requireAdmin` | `middleware/auth.ts` | Admin role check |
| `requireRoles` | `middleware/rbac.ts` | Flexible RBAC |
| `csrfProtection` | `middleware/csrf.ts` | Double-submit CSRF |
| `validateBody` | `middleware/validate.ts` | Zod request validation |
| Rate limiting | `middleware/rateLimit.ts` | Global + per-route limits |

---

## Setup

```bash
cd server
cp .env.example .env
# Set DATABASE_URL, JWT secrets, etc.

npm install
npm run prisma:generate
npx prisma migrate dev --schema ../prisma/schema.prisma --name auth_tokens
npx prisma db seed --schema ../prisma/schema.prisma

npm run dev
```
