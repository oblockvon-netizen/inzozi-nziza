# Inzozi Nziza

Community savings and loans platform for Rwanda — members contribute **105,000 RWF/month**, apply for loans, track fines, and receive admin-managed approvals.

---

## Current architecture

The project is mid-migration from Supabase to a secure full-stack setup:

| Layer | Stack | Status |
|-------|--------|--------|
| **Frontend** | React 18, Vite, Tailwind, shadcn/ui, Framer Motion | ✅ UI redesigned |
| **Backend API** | Fastify, Prisma, JWT + HttpOnly cookies, RBAC | ✅ Built (`server/`) |
| **Database** | PostgreSQL on [Neon](https://neon.tech) | ⬜ You configure |
| **Frontend data layer** | Still uses Supabase client | ⚠️ Phase 6 pending |

**What works today**

- Run the **frontend** against the legacy Supabase project (quick demo, not production-safe).
- Run the **backend API** against Neon with full auth, RBAC, rate limiting, CSRF, and audit logs.
- Test the API with Postman/curl while the UI migration is in progress.

**What is not wired yet**

- The React app does not call `/api/v1/*` yet — it still talks to Supabase directly.
- Two-admin approval, inactivity auto-removal, and real-time notifications are planned, not implemented.

---

## Prerequisites

| Tool | Version |
|------|---------|
| [Node.js](https://nodejs.org/) | 20+ recommended |
| [npm](https://www.npmjs.com/) | 10+ |
| [Neon account](https://neon.tech) | Free tier works |
| Git | Any recent version |

Optional: [Postman](https://www.postman.com/) or similar for API testing.

---

## Project structure

```
inzozi-nziza/
├── src/                 # React frontend (Vite)
├── server/              # Fastify API
├── prisma/
│   ├── schema.prisma    # Database schema
│   └── seed.ts          # Seeds ADMIN + USER roles
├── supabase/            # Legacy migrations (old stack)
├── AGENT.md             # Rebuild guide for contributors
├── AUTH_API.md          # Auth endpoint reference (in server/)
├── RBAC.md              # Roles and permissions
├── SECURITY_REPORT.md   # Security audit summary
└── UI_DESIGN.md         # Design system
```

---

## Quick start — frontend only (legacy Supabase)

Use this if you only want to preview the UI with the existing Supabase project.

```bash
git clone https://github.com/ntwali123/inzozi-nziza.git
cd inzozi-nziza
npm install
npm run dev
```

Open **http://localhost:8080**

> **Warning:** The legacy frontend has known security issues (client-side admin key, Supabase anon key in source). Do not use this mode in production. See `SECURITY_ISSUES.md` and `SECURITY_REPORT.md`.

---

## Full setup — backend API + Neon database

This is the recommended path for development and future production.

### 1. Clone and install

```bash
git clone https://github.com/ntwali123/inzozi-nziza.git
cd inzozi-nziza

# Frontend dependencies
npm install

# Backend dependencies
cd server
npm install
cd ..
```

### 2. Create a Neon database

1. Sign in at [neon.tech](https://neon.tech) and create a project.
2. Copy the **pooled** connection string → use as `DATABASE_URL`.
3. Copy the **direct** connection string → use as `DIRECT_URL` (required for migrations).

Both URLs should include `?sslmode=require`.

### 3. Configure environment variables

```bash
cp server/.env.example server/.env
```

Edit `server/.env`:

```env
DATABASE_URL="postgresql://...@ep-xxx-pooler....neon.tech/inzozi_nziza?sslmode=require"
DIRECT_URL="postgresql://...@ep-xxx....neon.tech/inzozi_nziza?sslmode=require"

NODE_ENV=development
PORT=3000
API_URL=http://localhost:3000
APP_URL=http://localhost:8080

JWT_ACCESS_SECRET="your-random-string-at-least-32-characters-long"
JWT_REFRESH_SECRET="another-random-string-at-least-32-characters"
COOKIE_SECRET="third-random-string-at-least-32-characters"
```

Generate secrets (PowerShell):

```powershell
[Convert]::ToBase64String((1..48 | ForEach-Object { Get-Random -Maximum 256 }))
```

Prisma CLI reads `.env` from the repo root or `prisma/` folder. Easiest approach — copy DB URLs to the root:

```bash
# From repo root (Git Bash / macOS / Linux)
cp server/.env .env
```

On Windows PowerShell:

```powershell
Copy-Item server\.env .env
```

### 4. Initialize the database

From the `server/` directory:

```bash
cd server

# Generate Prisma client
npm run prisma:generate

# Create tables (first run creates the initial migration)
npm run db:migrate
# When prompted for a migration name, use: init

# Seed roles (ADMIN, USER)
npm run db:seed
```

If `prisma generate` fails with a `bun` error, run the local binary directly:

```bash
npx --yes prisma generate --schema ../prisma/schema.prisma
```

### 5. Start the API

```bash
cd server
npm run dev
```

API runs at **http://localhost:3000**

Verify:

```bash
curl http://localhost:3000/health
# {"status":"ok"}
```

### 6. Start the frontend (separate terminal)

```bash
# From repo root
npm run dev
```

Frontend runs at **http://localhost:8080**

Until Phase 6 is complete, the UI still uses Supabase — the API runs independently for testing.

---

## Create your first admin user

The API does **not** allow self-service admin signup. Promote a user manually after they register.

### Option A — Register via API, then promote in the database

**1. Get a CSRF token and sign up:**

```bash
curl -c cookies.txt http://localhost:3000/api/v1/auth/csrf

# Copy csrfToken from response, then:
curl -b cookies.txt -c cookies.txt \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: YOUR_CSRF_TOKEN" \
  -d '{"email":"admin@example.com","password":"SecurePass1","fullName":"Admin User","phone":"+250788000000"}' \
  http://localhost:3000/api/v1/auth/signup
```

**2. Open Prisma Studio:**

```bash
cd server
npx prisma studio --schema ../prisma/schema.prisma
```

**3. In the database:**

- Find the user in `users` and note their `id`.
- In `user_roles`, add a row linking that `user_id` to the `ADMIN` role id (from `roles` table).
- In `profiles`, set `is_approved = true` and `status = ACTIVE` for that user.

### Option B — Use Neon SQL editor

After signup, run SQL in the Neon console (replace `USER_UUID`):

```sql
INSERT INTO user_roles (id, user_id, role_id)
SELECT gen_random_uuid(), 'USER_UUID', id FROM roles WHERE name = 'ADMIN';

UPDATE profiles SET is_approved = true, status = 'ACTIVE' WHERE user_id = 'USER_UUID';
```

---

## Development commands

### Frontend (repo root)

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server on port **8080** |
| `npm run build` | Production build → `dist/` |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |

### Backend (`server/`)

| Command | Description |
|---------|-------------|
| `npm run dev` | Start API with hot reload (port **3000**) |
| `npm run build` | Compile TypeScript → `dist/` |
| `npm start` | Run compiled API (production) |
| `npm run prisma:generate` | Regenerate Prisma client |
| `npm run db:migrate` | Apply migrations (dev) |
| `npm run db:seed` | Seed roles |

### Database (from `server/`)

```bash
npx prisma studio --schema ../prisma/schema.prisma   # GUI browser
npx prisma migrate deploy --schema ../prisma/schema.prisma   # Production deploy
```

---

## API overview

Base URL: `http://localhost:3000`

| Prefix | Purpose |
|--------|---------|
| `GET /health` | Health check |
| `/api/v1/auth/*` | Signup, login, refresh, logout, password reset |
| `/api/v1/admin/*` | User management, stats, audit logs |
| `/api/v1/contributions/*` | Member + admin contributions |
| `/api/v1/loans/*` | Loan applications and admin actions |
| `/api/v1/fines/*` | Fines management |
| `/api/v1/me/*` | Pending-user status |

**Authenticated requests**

- Send cookies: `credentials: 'include'`
- Mutations require header: `X-CSRF-Token` (must match `inzozi_csrf` cookie)

Full reference: [`server/AUTH_API.md`](server/AUTH_API.md) · [`RBAC.md`](RBAC.md)

---

## Roles

| Role | Access |
|------|--------|
| **ADMIN** | Manage users, contributions, loans, fines, reports |
| **USER** | Approved member — dashboard, own data, loan applications |
| **PENDING_USER** | Awaiting approval — limited pending screen only |

Details: [`RBAC.md`](RBAC.md)

---

## Implemented features

- Email/password auth with Argon2id hashing
- HttpOnly cookie sessions (access + refresh rotation)
- CSRF protection, rate limiting, account lockout
- Server-side RBAC and permission guards
- Audit logs for admin and sensitive actions
- Monthly contribution tracking (105,000 RWF requirement)
- Loan application and admin approval flow
- Fines issuance and payment recording
- PDF report generation (frontend)
- Modern fintech UI with dark mode

## Planned / not yet implemented

- Frontend migration off Supabase → API client (`Phase 6`)
- Two-admin approval for sensitive actions
- Auto-removal after 3 months inactivity
- Real-time notifications (WebSockets)
- Google OAuth login

See [`MIGRATION_PLAN.md`](MIGRATION_PLAN.md) for the full roadmap.

---

## Production deployment (outline)

1. Complete frontend API migration (Phase 6).
2. Set `NODE_ENV=production` and HTTPS URLs for `APP_URL` / `API_URL`.
3. Replace all default JWT and cookie secrets.
4. Configure SMTP for verification and password-reset emails.
5. Run `npx prisma migrate deploy` against the production Neon database.
6. Deploy API (Node host, Railway, Render, etc.) and frontend (Vercel static build).

Frontend build:

```bash
npm run build
# Deploy dist/ to Vercel or any static host
```

Backend build:

```bash
cd server
npm run build
npm start
```

Production env validation rejects HTTP URLs and placeholder secrets automatically.

---

## Documentation index

| Document | Contents |
|----------|----------|
| [`AGENT.md`](AGENT.md) | Master rebuild guide |
| [`AUDIT.md`](AUDIT.md) | Original app audit |
| [`MIGRATION_PLAN.md`](MIGRATION_PLAN.md) | Supabase → Neon migration phases |
| [`ERD.md`](ERD.md) | Database entity diagram |
| [`RBAC.md`](RBAC.md) | Authorization rules |
| [`SECURITY_REPORT.md`](SECURITY_REPORT.md) | Security controls and checklist |
| [`SECURITY_ISSUES.md`](SECURITY_ISSUES.md) | Legacy Supabase findings |
| [`UI_DESIGN.md`](UI_DESIGN.md) | Design system |
| [`COMPONENT_MAP.md`](COMPONENT_MAP.md) | UI component map |
| [`server/AUTH_API.md`](server/AUTH_API.md) | Auth API reference |

---

## Troubleshooting

### `prisma generate` fails with `bun is not recognized`

Use npm directly:

```bash
cd server
npx --yes prisma generate --schema ../prisma/schema.prisma
```

Ensure you are using Node/npm, not a broken package-manager hook.

### API exits on startup — invalid environment

Check `server/.env` against `server/.env.example`. All three secrets must be at least 32 characters.

### CORS errors when calling the API from the frontend

`APP_URL` in `server/.env` must exactly match the frontend origin (default `http://localhost:8080`).

### Frontend login works but backend does not

Expected until Phase 6 — the UI still uses Supabase. Test the API separately with curl/Postman.

### Port already in use

- Frontend default: **8080** (change in `vite.config.ts`)
- API default: **3000** (change `PORT` in `server/.env`)

---

## Tech stack

| Layer | Technologies |
|-------|----------------|
| Frontend | React, Vite, TypeScript, Tailwind CSS, shadcn/ui, Framer Motion, React Router, TanStack Query, Zod |
| Backend | Fastify, Prisma, PostgreSQL (Neon), Argon2, JWT, Zod |
| Legacy (being removed) | Supabase Auth + PostgREST |

---

## License

Private project — see repository owner for usage terms.
