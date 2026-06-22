# Inzozi Nziza

Community savings and loans platform for Rwanda — members contribute **105,000 RWF/month**, apply for loans, track fines, and receive admin-managed approvals.

---

## Current architecture

| Layer | Stack | Status |
|-------|--------|--------|
| **Frontend** | React 18, Vite, Tailwind, shadcn/ui, Framer Motion | ✅ UI + API client |
| **Backend API** | Fastify, Prisma, JWT + HttpOnly cookies, RBAC | ✅ Built (`server/`) |
| **Database** | PostgreSQL on [Neon](https://neon.tech) | ⬜ You configure |
| **Frontend data layer** | `src/lib/api.ts` → `/api/v1/*` with CSRF + cookies | ✅ Migrated |

**What works today**

- Run the **frontend** against the Fastify API (cookie auth, CSRF on mutations).
- Run the **backend API** against Neon with full auth, RBAC, rate limiting, CSRF, and audit logs.
- Member dashboard, admin dashboard, contributions, loans, and fines all use the API.

**What is not implemented yet**

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
├── server/              # Fastify API
└── README.md
```

---

## Quick start

Both the API and frontend must be running for the app to work.

```bash
git clone https://github.com/ntwali123/inzozi-nziza.git
cd inzozi-nziza
npm install
cd server && npm install && cd ..
```

Follow **Full setup** below to configure Neon and environment variables, then:

```bash
# Terminal 1 — API (from server/)
cd server
npm run dev

# Terminal 2 — Frontend (from repo root)
npm run dev
```

Open **http://localhost:8080**. The Vite dev server proxies `/api` to `http://localhost:3000`.

Optional: copy `.env.example` to `.env` and set `VITE_API_URL` if the API is on a different host (leave empty for the dev proxy).

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

The Prisma schema lives in `prisma/` at the repo root, so run **`npm install` at the repo root first** (step 1). Then generate the client and migrate:

```bash
# From repo root
npm run prisma:generate

# Or from server/ (uses the same schema)
cd server
npm run prisma:generate

# Create tables (first run creates the initial migration)
npm run db:migrate
# When prompted for a migration name, use: init

# Seed roles (ADMIN, USER)
npm run db:seed
```

Do **not** run bare `prisma generate` in PowerShell — the CLI is not on your PATH. Always use `npm run prisma:generate` or `npx prisma generate --schema prisma/schema.prisma` from the repo root.

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

Frontend runs at **http://localhost:8080** and talks to the API via cookie auth (`credentials: 'include'`) and CSRF tokens on mutations.

---

## Create your first admin user

### Recommended — bootstrap admin via seed (no manual DB edits)

After migrations, add these to `server/.env` (or root `.env`):

```env
BOOTSTRAP_ADMIN_EMAIL=admin@inzozi.local
BOOTSTRAP_ADMIN_PASSWORD=AdminPass123!
BOOTSTRAP_ADMIN_NAME=Site Admin
```

Then run:

```bash
npm run db:seed
```

Sign in at **http://localhost:8080/auth/login** with that email and password. You are routed to **`/admin`** automatically.

Re-running seed is safe: it upgrades an existing user to admin if the email already exists.

---

### Manual promotion (alternative)

The API does **not** allow self-service admin signup. You can still promote any registered user in the database.

#### Option A — Register via UI, then promote in Prisma Studio

**1.** Sign up at `/auth/signup`.

**2.** Open Prisma Studio:

```bash
cd server
npx prisma studio --schema ../prisma/schema.prisma
```

**3.** In the database:

- Find the user in `users` and note their `id`.
- In `user_roles`, add a row linking that `user_id` to the `ADMIN` role id (from `roles` table).
- In `profiles`, set `is_approved = true` and `status = ACTIVE` for that user.

#### Option B — Use Neon SQL editor

After signup, run SQL in the Neon console (replace `USER_UUID`):

```sql
INSERT INTO user_roles (id, user_id, role_id)
SELECT gen_random_uuid(), 'USER_UUID', id FROM roles WHERE name = 'ADMIN';

UPDATE profiles SET is_approved = true, status = 'ACTIVE' WHERE user_id = 'USER_UUID';
```

---

### Troubleshooting signup / auth errors

| Console error | Cause | Fix |
|---------------|-------|-----|
| `500` on `/api/v1/auth/signup` | Database tables missing | Run `npm run db:migrate` then `npm run db:seed` |
| `401` on `/api/v1/auth/me` and `/refresh` | Not logged in yet (normal on first visit) | Ignore, or sign in after seed |
| `USER role is not configured` | Roles not seeded | Run `npm run db:seed` |

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

Full reference: API routes under `/api/v1/*` — see `server/src/routes/` and `server/.env.example`.

---

## Roles

| Role | Access |
|------|--------|
| **ADMIN** | Manage users, contributions, loans, fines, reports |
| **USER** | Approved member — dashboard, own data, loan applications |
| **PENDING_USER** | Awaiting approval — limited pending screen only |

Details: roles are enforced in `server/src/middleware/guards.ts` and `server/src/config/permissions.ts`.

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

- Two-admin approval for sensitive actions
- Auto-removal after 3 months inactivity
- Real-time notifications (WebSockets)
- Google OAuth login ✅ (configure `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` in `server/.env`)

See **[DEPLOYMENT.md](./DEPLOYMENT.md)** for publishing the app online.

---

## Production deployment

See **[DEPLOYMENT.md](./DEPLOYMENT.md)** for step-by-step instructions (Vercel + Render + Neon + Google OAuth).

Summary:

1. Set `NODE_ENV=production` and HTTPS URLs for `APP_URL` / `API_URL`.
2. Replace all default JWT and cookie secrets.
3. Configure SMTP for verification and password-reset emails.
4. Run `npx prisma migrate deploy` against the production Neon database.
5. Deploy API (Node host, Railway, Render, etc.) and frontend (Vercel static build).
6. Set `VITE_API_URL` to your production API origin when building the frontend.

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

## Troubleshooting

### `prisma` is not recognized (PowerShell)

The Prisma CLI is installed locally in `node_modules`, not globally. From the repo root:

```powershell
npm run prisma:generate
```

Or from `server/`:

```powershell
cd server
npm run prisma:generate
```

### `prisma generate` fails with `bun is not recognized`

Prisma resolves the project root from `prisma/schema.prisma` (repo root), not `server/`. Install root dependencies first:

```powershell
cd D:\inzozi-nziza
npm install
npm run prisma:generate
```

If you only ran `npm install` inside `server/`, Prisma may try to auto-install packages with the wrong package manager.

### API exits on startup — invalid environment

Check `server/.env` against `server/.env.example`. All three secrets must be at least 32 characters.

### Frontend cannot reach the API

- Start the API on port **3000** before the frontend.
- In dev, leave `VITE_API_URL` empty so Vite proxies `/api` to localhost:3000.
- `APP_URL` in `server/.env` must match the frontend origin (`http://localhost:8080`).

### CORS errors when calling the API from the frontend

`APP_URL` in `server/.env` must exactly match the frontend origin (default `http://localhost:8080`).

### Port already in use

- Frontend default: **8080** (change in `vite.config.ts`)
- API default: **3000** (change `PORT` in `server/.env`)

---

## Tech stack

| Layer | Technologies |
|-------|----------------|
| Frontend | React, Vite, TypeScript, Tailwind CSS, shadcn/ui, Framer Motion, React Router, TanStack Query, Zod |
| Backend | Fastify, Prisma, PostgreSQL (Neon), Argon2, JWT, Zod |

---

## License

Private project — see repository owner for usage terms.
