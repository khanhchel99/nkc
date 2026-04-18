# NKC ERP - Furniture Manufacturing

Production-grade ERP platform for furniture manufacturing.

## Architecture

- **Monorepo**: pnpm workspaces + Turborepo
- **Backend**: Next.js API Route Handlers + Prisma + PostgreSQL
- **Web**: Next.js + Tailwind CSS + shadcn/ui
- **Mobile**: React Native + Expo
- **Database**: PostgreSQL 16 (local Docker or Supabase)
- **Deployment**: Vercel (web + API) + Supabase (database)

## Quick Start

```bash
# Install dependencies
pnpm install

# Start local database
docker compose up -d

# Copy environment file
cp apps/web/.env.example apps/web/.env.local

# Build shared packages
pnpm run build

# Start dev server
pnpm --filter @nkc/web dev
```

## Project Structure

```
apps/
  web/              - Next.js app + API routes (port 3100)
  mobile/           - React Native mobile app (Expo)
packages/
  database/         - Prisma client (multiSchema, 56 models)
  types/            - Shared TypeScript types
  validation/       - Zod schemas
  config/           - Configuration constants
  utils/            - Shared utilities
infra/
  schema.sql        - Full database DDL (11 schemas, 56 tables)
  seed.sql          - Development seed data
```

## API Routes

All API routes live in `apps/web/src/app/api/`:

| Route | Methods | Description |
|-------|---------|-------------|
| `/api/auth/login` | POST | Login (public) |
| `/api/auth/refresh` | POST | Refresh token (public) |
| `/api/auth/logout` | POST | Logout |
| `/api/users` | GET, POST | List / create users |
| `/api/users/[id]` | GET | Get user by ID |
| `/api/roles` | GET, POST | List / create roles |
| `/api/roles/[id]/permissions` | POST | Assign permissions |
| `/api/products` | GET, POST | List / create products |
| `/api/products/[id]` | GET | Product detail with versions |
| `/api/products/[id]/versions` | POST | Create product version |
| `/api/products/[id]/bom` | POST | Create BOM |
| `/api/products/[id]/routing` | POST | Create routing |
| `/api/items` | GET, POST | List / create items |
| `/api/customers` | GET, POST | List / create customers |
| `/api/suppliers` | GET, POST | List / create suppliers |
| `/api/sales-orders` | GET, POST | List / create sales orders |
| `/api/sales-orders/[id]` | GET | Sales order detail |
| `/api/sales-orders/[id]/confirm` | POST | Confirm order |
| `/api/sales-orders/[id]/revise` | POST | Revise order |
| `/api/order-import/upload` | POST | Upload Excel for import |
| `/api/order-import/jobs/[id]` | GET | Import job status |

## Local Development (Docker)

| Service | Port | Credentials |
|---------|------|-------------|
| PostgreSQL | 5433 | nkc / nkc_dev_password |
