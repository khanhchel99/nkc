# NKC ERP - Furniture Manufacturing

Production-grade ERP platform for furniture manufacturing.

## Implementation Status

| Phase | Module | Status | Details |
|-------|--------|--------|---------|
| 0 | **Foundation** | ✅ Complete | Monorepo, Prisma, auth (JWT), RBAC, 11 schemas, 56 tables |
| 1 | **Master Data** | ✅ Complete | Products, BOM, routing, versions, items, customers, suppliers |
| 2 | **Sales Orders** | ✅ Complete | Order lifecycle, Excel import, confirm/revise flow |
| 3A | **Inventory** | ✅ Complete | Warehouses, bins, lots, stock transactions, reservations |
| 3B | **Planning** | ✅ Complete | Production plans, MRP runs with demand/supply netting |
| 3C | **Production** | ✅ Complete | Work orders, step execution, materials, scrap, downtime |
| 3D | **Quality** | ✅ Complete | Quality plans, inspections, defect recording |
| 4 | **Shipping & Billing** | ✅ Complete | Shipments, packing, containers, invoices, payments |
| 5 | **Web UI** | ✅ Complete | 20 Vietnamese dashboard pages, all modules |

**Totals**: 57 API route files · 20 dashboard pages · 11 test files · 360 tests passing

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
  web/              - Next.js 14 app + 57 API routes (port 3100)
  mobile/           - React Native mobile app (Expo)
packages/
  database/         - Prisma client (multiSchema, 56 models)
  types/            - Shared TypeScript types (IAM, sales, inventory, planning, production, quality, shipping, billing)
  validation/       - Zod schemas
  config/           - Configuration constants
  utils/            - Shared utilities (order number generation, helpers)
infra/
  schema.sql        - Full database DDL (11 schemas, 56 tables)
  seed.sql          - Development seed data
```

## API Routes

All API routes live in `apps/web/src/app/api/` — **57 route files**:

### IAM & Auth
| Route | Methods | Description |
|-------|---------|-------------|
| `/api/auth/login` | POST | Login (public) |
| `/api/auth/refresh` | POST | Refresh token (public) |
| `/api/auth/logout` | POST | Logout |
| `/api/users` | GET, POST | List / create users |
| `/api/users/[id]` | GET | Get user by ID |
| `/api/roles` | GET, POST | List / create roles |
| `/api/roles/[id]/permissions` | POST | Assign permissions |

### Master Data
| Route | Methods | Description |
|-------|---------|-------------|
| `/api/products` | GET, POST | List / create products |
| `/api/products/[id]` | GET | Product detail with versions |
| `/api/products/[id]/versions` | POST | Create product version |
| `/api/products/[id]/bom` | POST | Create BOM |
| `/api/products/[id]/routing` | POST | Create routing |
| `/api/items` | GET, POST | List / create items |
| `/api/customers` | GET, POST | List / create customers |
| `/api/suppliers` | GET, POST | List / create suppliers |

### Sales Orders
| Route | Methods | Description |
|-------|---------|-------------|
| `/api/sales-orders` | GET, POST | List / create sales orders |
| `/api/sales-orders/manual` | POST | Create manual sales order |
| `/api/sales-orders/[id]` | GET | Sales order detail |
| `/api/sales-orders/[id]/confirm` | POST | Confirm order |
| `/api/sales-orders/[id]/revise` | POST | Revise order |
| `/api/order-import/upload` | POST | Upload Excel for import |
| `/api/order-import/jobs/[id]` | GET | Import job status |

### Inventory
| Route | Methods | Description |
|-------|---------|-------------|
| `/api/inventory/warehouses` | GET, POST | List / create warehouses |
| `/api/inventory/warehouses/[id]` | GET, PATCH | Warehouse detail / update |
| `/api/inventory/warehouses/[id]/bins` | GET, POST | List / create bins |
| `/api/inventory/lots` | GET, POST | List / create lots |
| `/api/inventory/transactions` | GET, POST | List / record stock transactions |
| `/api/inventory/stock-balances` | GET | Stock balance query |
| `/api/inventory/reservations` | GET, POST | List / create reservations |
| `/api/inventory/reservations/[id]/consume` | POST | Consume reservation |
| `/api/inventory/reservations/[id]/release` | POST | Release reservation |

### Planning
| Route | Methods | Description |
|-------|---------|-------------|
| `/api/planning/production-plans` | GET, POST | List / create production plans |
| `/api/planning/production-plans/[id]` | GET, PATCH | Plan detail / status transitions |
| `/api/planning/mrp` | GET, POST | List / run MRP calculations |
| `/api/planning/mrp/[id]` | GET | MRP run detail with results |

### Production
| Route | Methods | Description |
|-------|---------|-------------|
| `/api/production/work-orders` | GET, POST | List / create work orders |
| `/api/production/work-orders/[id]` | GET, PATCH | Work order detail / status transitions |
| `/api/production/work-orders/[id]/materials` | GET, POST | List / issue materials |
| `/api/production/work-orders/[id]/steps/[stepId]` | GET, PATCH | Step detail / update |
| `/api/production/work-orders/[id]/steps/[stepId]/executions` | GET, POST | Execution logs |
| `/api/production/work-orders/[id]/steps/[stepId]/scrap` | POST | Record scrap |
| `/api/production/work-orders/[id]/steps/[stepId]/downtime` | POST | Record downtime |

### Quality
| Route | Methods | Description |
|-------|---------|-------------|
| `/api/quality/plans` | GET, POST | List / create quality plans |
| `/api/quality/plans/[id]` | GET, PATCH | Plan detail / update |
| `/api/quality/inspections` | GET, POST | List / create inspections |
| `/api/quality/inspections/[id]` | GET, PATCH | Inspection detail / status transitions |
| `/api/quality/inspections/[id]/defects` | GET, POST | List / record defects |

### Shipping
| Route | Methods | Description |
|-------|---------|-------------|
| `/api/shipping/shipments` | GET, POST | List / create shipments |
| `/api/shipping/shipments/[id]` | GET, PATCH | Shipment detail / status transitions |
| `/api/shipping/shipments/[id]/lines` | GET, POST | List / add shipment lines |
| `/api/shipping/packing-units` | GET, POST | List / create packing units |
| `/api/shipping/containers` | GET, POST | List / create containers |
| `/api/shipping/containers/[id]` | GET, PATCH | Container detail / update |
| `/api/shipping/containers/[id]/allocations` | POST | Allocate packing units to container |

### Billing
| Route | Methods | Description |
|-------|---------|-------------|
| `/api/billing/invoices` | GET, POST | List / create invoices with line items |
| `/api/billing/invoices/[id]` | GET, PATCH | Invoice detail / status transitions |
| `/api/billing/invoices/[id]/payments` | GET, POST | List / record payment receipts |

## Web UI Pages (Vietnamese)

20 pages under `apps/web/src/app/(dashboard)/`:

| Page | Path | Description |
|------|------|-------------|
| Dashboard | `/dashboard` | Overview dashboard |
| Master Data | `/master-data` | Products, items, customers, suppliers hub |
| Products | `/master-data/products` | Product list + detail (BOM, routing, versions) |
| Items | `/master-data/items` | Raw material / component management |
| Customers | `/master-data/customers` | Customer management |
| Suppliers | `/master-data/suppliers` | Supplier management |
| Orders | `/orders` | Sales order list + detail + manual create |
| Inventory | `/inventory` | Warehouses, bins, lots, stock balances, transactions |
| Planning | `/planning` | Production plans + MRP runs |
| Production | `/production` | Work orders + steps, materials, executions, scrap, downtime |
| Quality | `/quality` | Quality plans, inspections, defects |
| Shipping | `/shipping` | Shipments, packing units, containers (3 tabs) |
| Billing | `/billing` | Invoices, payment receipts (2 tabs) |

## Tests

- **11 test files**, **360 tests** — all passing
- Framework: Vitest 2.1.9 with mocked Prisma
- Coverage: auth, users/roles, master data, sales orders, order import, inventory, planning, production, quality, shipping, billing

## Local Development (Docker)

| Service | Port | Credentials |
|---------|------|-------------|
| PostgreSQL | 5433 | nkc / nkc_dev_password |
