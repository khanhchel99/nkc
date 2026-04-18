# NKC ERP — Deployment Guide (Free Tier)

> Step-by-step guide to deploy the NKC Furniture Manufacturing ERP to production using **free-tier services only**.

---

## Architecture Overview

```
┌─────────────┐       ┌──────────────────┐       ┌──────────────────┐
│   Browser    │──────▶│  Vercel (Free)   │──────▶│ Supabase (Free)  │
│              │◀──────│  Next.js 14 App  │◀──────│ PostgreSQL 16    │
└─────────────┘       └──────────────────┘       └──────────────────┘
```

| Component       | Service           | Free Tier Limits                        |
|-----------------|-------------------|-----------------------------------------|
| **Frontend + API** | Vercel         | 100 GB bandwidth, 1000 serverless invocations/day, 10s function timeout |
| **Database**    | Supabase          | 500 MB database, 1 GB file storage, 50K monthly active users |
| **Source Code** | GitHub            | Unlimited public/private repos           |

---

## Prerequisites

- [Node.js](https://nodejs.org/) >= 20.x installed locally
- [pnpm](https://pnpm.io/) 9.15.4 (`corepack enable && corepack prepare pnpm@9.15.4 --activate`)
- A [GitHub](https://github.com/) account (free)
- A [Vercel](https://vercel.com/) account (free — sign up with GitHub)
- A [Supabase](https://supabase.com/) account (free)

---

## Step 1: Create a GitHub Repository

```bash
cd /Users/khanhnguyen/Documents/nkc

# Initialize git if not already
git init
git add .
git commit -m "Initial commit: NKC ERP"

# Create repo on GitHub (via website or CLI), then:
git remote add origin https://github.com/<your-username>/nkc-erp.git
git branch -M main
git push -u origin main
```

---

## Step 2: Set Up Supabase (Free Tier Database)

### 2.1 Create Project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Click **"New Project"**
3. Fill in:
   - **Name**: `nkc-erp`
   - **Database Password**: Choose a strong password — **save this, you'll need it**
   - **Region**: Choose closest to your users (e.g., `Southeast Asia (Singapore)`)
4. Click **"Create new project"** — wait ~2 minutes for provisioning

### 2.2 Get Connection String

1. In Supabase dashboard → **Settings** → **Database**
2. Scroll to **"Connection string"** section
3. Select **"URI"** tab
4. Copy the connection string. It looks like:
   ```
   postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
   ```
5. **Important**: Use the **"Transaction" pooler (port 6543)** mode for serverless (Vercel).
   - If you see port `5432` (direct), switch to `6543` (pooler) for Vercel compatibility
6. Replace `[YOUR-PASSWORD]` in the string with your actual database password

Your final `DATABASE_URL` should look like:
```
postgresql://postgres.abcdefghij:YourPassword@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
```

### 2.3 Initialize the Database Schema

1. In Supabase dashboard → **SQL Editor**
2. Click **"New query"**
3. Copy the **entire contents** of `infra/schema.sql` (1228 lines) and paste into the editor
4. Click **"Run"** — this creates all 11 schemas and 56 tables
5. Create another new query
6. Copy the **entire contents** of `infra/seed.sql` (421 lines) and paste
7. Click **"Run"** — this inserts tenant, roles, permissions, test users, sample data

**Verify**: Go to **Table Editor** → change schema dropdown to `iam` → you should see the `users`, `roles`, `tenants` tables with data.

### 2.4 Default Login Credentials (from seed data)

| Email              | Password    | Role              |
|--------------------|-------------|-------------------|
| admin@nkc.com      | `admin123`  | Admin             |
| sales@nkc.com      | `sales123`  | Sales Manager     |
| planner@nkc.com    | `planner123`| Planner           |

> **Security Note**: Change these passwords immediately after first login in production.

---

## Step 3: Deploy to Vercel (Free Tier)

### 3.1 Connect Repository

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click **"Import Git Repository"**
3. Select your `nkc-erp` GitHub repository
4. Vercel auto-detects the monorepo. Configure:

### 3.2 Build Settings

| Setting              | Value                           |
|----------------------|---------------------------------|
| **Framework Preset** | Next.js                         |
| **Root Directory**   | `apps/web`                      |
| **Build Command**    | `cd ../.. && npx pnpm@9 install --frozen-lockfile && npx pnpm@9 run build --filter @nkc/web` |
| **Output Directory** | `.next`                         |
| **Install Command**  | _(leave empty — handled in build command)_ |
| **Node.js Version**  | 20.x                            |

> **Why this build command?** Vercel needs to install all workspace dependencies from the monorepo root, build shared packages (`@nkc/database`, `@nkc/types`, etc.) first, then build the web app. The `--filter @nkc/web` flag with Turborepo handles the correct build order.

### 3.3 Environment Variables

In the Vercel project settings → **Environment Variables**, add:

| Variable              | Value                                    | Environment |
|-----------------------|------------------------------------------|-------------|
| `DATABASE_URL`        | `postgresql://postgres.xxx:YourPwd@...pooler.supabase.com:6543/postgres` | Production, Preview |
| `JWT_SECRET`          | _(generate a random 64-char string)_     | Production, Preview |
| `NEXT_PUBLIC_APP_URL` | `https://your-project.vercel.app`        | Production  |

**Generate a secure JWT_SECRET**:
```bash
openssl rand -base64 48
```

### 3.4 Deploy

1. Click **"Deploy"**
2. Wait for the build to complete (~2-3 minutes)
3. Vercel gives you a URL like `https://nkc-erp.vercel.app`
4. Update the `NEXT_PUBLIC_APP_URL` environment variable to match this URL
5. **Redeploy** (Settings → Deployments → Redeploy) so the URL takes effect

### 3.5 Verify Deployment

Test the API:
```bash
# Health check — login with seed credentials
curl -X POST https://nkc-erp.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@nkc.com","password":"admin123"}'
```

Expected: `200 OK` with `{ "accessToken": "...", "refreshToken": "...", "expiresIn": 900, "user": {...} }`

---

## Step 4: Post-Deployment Configuration

### 4.1 Custom Domain (Optional, Free)

1. Vercel dashboard → **Settings** → **Domains**
2. Add your domain (e.g., `erp.nkc.com`)
3. Update DNS records as instructed (CNAME or A record)
4. Update `NEXT_PUBLIC_APP_URL` to `https://erp.nkc.com`
5. Redeploy

### 4.2 Enable Automatic Deployments

Already configured by default:
- **Push to `main`** → Production deployment
- **Pull requests** → Preview deployment (with unique URL)

### 4.3 Change Default Passwords

After first login as admin, update all seed user passwords via the Users management page or directly in Supabase SQL Editor:

```sql
-- Generate new bcrypt hashes at https://bcrypt-generator.com/ (use 10 rounds)
UPDATE iam.users SET password_hash = '$2b$10$<new-hash>' WHERE email = 'admin@nkc.com';
UPDATE iam.users SET password_hash = '$2b$10$<new-hash>' WHERE email = 'sales@nkc.com';
UPDATE iam.users SET password_hash = '$2b$10$<new-hash>' WHERE email = 'planner@nkc.com';
```

---

## Free Tier Limits & What to Watch

### Supabase Free Tier

| Resource          | Limit              | Monitoring                          |
|-------------------|--------------------|-------------------------------------|
| Database size     | 500 MB             | Dashboard → Settings → Usage        |
| API requests      | Unlimited          | —                                   |
| Edge functions    | 500K invocations   | —                                   |
| Bandwidth         | 5 GB               | Dashboard → Settings → Usage        |
| Pausing           | Paused after **7 days inactive** | Visit dashboard periodically |

> **Important**: Supabase free-tier projects pause after 7 days of inactivity. To prevent this, set up a simple cron ping (see below).

### Vercel Free Tier (Hobby)

| Resource               | Limit                    |
|------------------------|--------------------------|
| Bandwidth              | 100 GB/month             |
| Serverless executions  | 100 GB-hours/month       |
| Function duration      | 10 seconds max           |
| Builds                 | 6000 minutes/month       |
| Team members           | 1 (personal account)     |
| Commercial use         | **Not allowed on Hobby** |

> **Note**: Vercel Hobby plan is for personal/non-commercial use. For commercial deployment, upgrade to Pro ($20/month) or use an alternative.

### Prevent Supabase Project Pausing

Use a free cron service to ping your API every 5 days:

**Option A: Use [cron-job.org](https://cron-job.org/) (free)**
1. Create account
2. New cron job → URL: `https://nkc-erp.vercel.app/api/auth/login`
3. Method: POST, Body: `{"email":"admin@nkc.com","password":"admin123"}`
4. Schedule: Every 5 days
5. This keeps the DB connection alive and prevents pausing

**Option B: GitHub Actions (free, already have GitHub)**

Create `.github/workflows/keep-alive.yml`:
```yaml
name: Keep Supabase Alive
on:
  schedule:
    - cron: '0 0 */5 * *'  # Every 5 days
jobs:
  ping:
    runs-on: ubuntu-latest
    steps:
      - run: |
          curl -s -X POST ${{ secrets.APP_URL }}/api/auth/login \
            -H "Content-Type: application/json" \
            -d '{"email":"admin@nkc.com","password":"admin123"}'
```

Add `APP_URL` as a GitHub Actions secret pointing to your Vercel URL.

---

## Troubleshooting

### Build fails on Vercel

| Error | Fix |
|-------|-----|
| `Cannot find module '@nkc/database'` | Ensure **Root Directory** is `apps/web` and build command starts with `cd ../..` |
| `prisma generate` fails | Add `postinstall` script: the database package already has `"build": "prisma generate"` which Turborepo runs |
| `bcrypt` native module error | Already handled in `next.config.js` → `serverComponentsExternalPackages: ['bcrypt']` |
| `ENOMEM` (out of memory) | Vercel free tier has 1024 MB. If build fails, try `NODE_OPTIONS=--max_old_space_size=1024` |

### Database connection issues

| Error | Fix |
|-------|-----|
| `ECONNREFUSED` | Use Supabase **pooler** URL (port `6543`), not direct (port `5432`) |
| `too many connections` | Supabase free tier allows ~60 direct connections. Use the pooler URL to avoid exhaustion |
| `relation does not exist` | Run `infra/schema.sql` in Supabase SQL Editor first |
| `permission denied for schema` | Supabase's `postgres` role has full access. If using a custom role, grant schema usage |

### Auth issues

| Error | Fix |
|-------|-----|
| `JWT_SECRET is not configured` | Add `JWT_SECRET` in Vercel environment variables |
| `401 Unauthorized` on all routes | Check that the `Authorization: Bearer <token>` header is being sent |
| Token expired too fast | Access tokens expire in 15 minutes by design. Use the refresh endpoint |

---

## Project Structure Reference

```
nkc-erp/
├── apps/
│   ├── web/                    # Next.js 14 app (deployed to Vercel)
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── api/        # 34+ API route handlers
│   │   │   │   ├── (dashboard)/# Vietnamese Web UI (20 pages)
│   │   │   │   └── login/      # Login page
│   │   │   ├── components/     # React components (shadcn/ui)
│   │   │   ├── lib/            # prisma.ts, auth.ts, api-helpers.ts
│   │   │   └── stores/         # Zustand state management
│   │   └── next.config.js
│   └── mobile/                 # Expo React Native (Phase 4 — not deployed yet)
├── packages/
│   ├── database/               # Prisma schema + generated client
│   ├── types/                  # Shared TypeScript types
│   ├── validation/             # Zod schemas
│   ├── config/                 # Shared constants
│   └── utils/                  # Shared utilities
├── infra/
│   ├── schema.sql              # Database DDL (run in Supabase SQL Editor)
│   └── seed.sql                # Sample data (run after schema)
├── turbo.json                  # Turborepo pipeline config
├── pnpm-workspace.yaml         # Monorepo workspace definition
└── package.json                # Root (Node >=20, pnpm 9.15.4)
```

---

## Summary Checklist

- [ ] Push code to GitHub
- [ ] Create Supabase project (free tier)
- [ ] Copy connection string (pooler, port 6543)
- [ ] Run `schema.sql` in Supabase SQL Editor
- [ ] Run `seed.sql` in Supabase SQL Editor
- [ ] Create Vercel project (free tier, linked to GitHub)
- [ ] Set Root Directory to `apps/web`
- [ ] Set build command (see Step 3.2)
- [ ] Add environment variables: `DATABASE_URL`, `JWT_SECRET`, `NEXT_PUBLIC_APP_URL`
- [ ] Deploy and verify login works
- [ ] Change default seed passwords
- [ ] Set up keep-alive cron to prevent Supabase pausing
