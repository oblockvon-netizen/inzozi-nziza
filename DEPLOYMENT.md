# Deploying Inzozi Nziza

This guide explains how to put the app online so anyone can access it with a public URL.

## Architecture

| Part | What it is | Suggested host |
|------|------------|----------------|
| **Frontend** | React static site (`npm run build` → `dist/`) | [Vercel](https://vercel.com) or [Netlify](https://netlify.com) |
| **API** | Fastify Node server (`server/`) | [Render](https://render.com) or [Railway](https://railway.app) |
| **Database** | PostgreSQL | [Neon](https://neon.tech) (already used locally) |

You need all three running in production.

---

## Step 1 — Push code to GitHub

If the project is not on GitHub yet:

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR-USERNAME/inzozi-nziza.git
git push -u origin main
```

---

## Step 2 — Neon database (production)

1. Open your [Neon](https://neon.tech) project (or create one).
2. Copy the **pooled** `DATABASE_URL` and **direct** `DIRECT_URL`.
3. Paste these into the API host environment variables.

Run migrations against production once:

```bash
cd server
DATABASE_URL="your-pooled-url" DIRECT_URL="your-direct-url" npx prisma migrate deploy --schema ../prisma/schema.prisma
npm run db:seed
```

---

## Step 3 — Deploy the API (Render example)

1. Go to [render.com](https://render.com) → **New → Web Service**.
2. Connect your GitHub repo.
3. Settings:
   - **Root directory:** `server`
   - **Build command:** `npm install && npm run prisma:generate && npm run build`
   - **Start command:** `npm start`
4. **Environment variables** (minimum):

```env
NODE_ENV=production
PORT=10000
DATABASE_URL=postgresql://...neon...?sslmode=require
DIRECT_URL=postgresql://...neon...?sslmode=require
API_URL=https://YOUR-SERVICE.onrender.com
APP_URL=https://YOUR-FRONTEND.vercel.app
JWT_ACCESS_SECRET=long-random-string-at-least-32-chars
JWT_REFRESH_SECRET=another-long-random-string
COOKIE_SECRET=another-long-random-string
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
BOOTSTRAP_ADMIN_EMAIL=admin@yourdomain.com
BOOTSTRAP_ADMIN_PASSWORD=StrongPassword123!
```

5. Deploy and note your API URL, e.g. `https://inzozi-api.onrender.com`.

---

## Step 4 — Deploy the frontend (Vercel example)

1. Go to [vercel.com](https://vercel.com) → **Add New Project** → import the repo.
2. **Framework:** Vite · **Build:** `npm run build` · **Output:** `dist`
3. Environment variable:

```env
VITE_API_URL=https://YOUR-SERVICE.onrender.com
```

4. Deploy, then set the API `APP_URL` to your Vercel URL and redeploy the API.

---

## Step 5 — Google OAuth

1. [Google Cloud Console](https://console.cloud.google.com/apis/credentials) → **OAuth 2.0 Client ID** (Web).
2. **Authorized JavaScript origins:** `http://localhost:8080`, `https://YOUR-FRONTEND.vercel.app`
3. **Authorized redirect URIs:**
   - `http://localhost:8080/api/v1/auth/google/callback` (local)
   - `https://YOUR-SERVICE.onrender.com/api/v1/auth/google/callback` (production)
4. Add `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` to `server/.env` and Render.

---

## Step 6 — Verify

1. Open your public frontend URL.
2. Test **Continue with Google** and email login.
3. Hit `https://YOUR-API.onrender.com/health` → `{ "status": "ok" }`.

---

## Local vs production

| Setting | Local | Production |
|---------|-------|------------|
| Frontend | `http://localhost:8080` | `https://your-app.vercel.app` |
| API | `http://localhost:3000` | `https://your-api.onrender.com` |
| `VITE_API_URL` | empty (Vite proxy) | full API URL |
| `APP_URL` | `http://localhost:8080` | frontend URL |
| Google redirect (dev) | `http://localhost:8080/api/v1/auth/google/callback` | — |

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Google button disabled | Set Google env vars in `server/.env`, restart API |
| `redirect_uri_mismatch` | Add exact callback URL in Google Console |
| CORS errors | `APP_URL` must match the browser origin exactly |
| Cookies fail cross-domain | Use HTTPS; may need SameSite `none` for split hosts |
