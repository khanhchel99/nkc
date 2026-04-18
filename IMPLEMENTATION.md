# NKC ERP — Implementation Tracker

> Furniture Manufacturing ERP System
> Last updated: 2026-04-11

---

## Legend

| Symbol | Meaning |
|--------|---------|
| ✅ | Done |
| 🔲 | Not started |
| 🚧 | In progress / partial |

---

## Phase 0 — Foundation ✅

| # | Task | Status | Notes |
|---|------|--------|-------|
| 0.1 | Monorepo setup (pnpm + Turborepo) | ✅ | pnpm-workspace, turbo.json |
| 0.2 | Shared `@nkc/types` | ✅ | 9 domain type files |
| 0.3 | Shared `@nkc/validation` | ✅ | Zod schemas for identity, master, order |
| 0.4 | Shared `@nkc/config` | ✅ | App config, JWT config |
| 0.5 | Shared `@nkc/utils` | ✅ | generateId, paginate, formatCurrency, etc. |
| 0.6 | Docker Compose (PostgreSQL) | ✅ | Port 5433, auto-applies schema + seed |
| 0.7 | GitHub Actions CI | ✅ | lint, type-check, test, build |
| 0.8 | Database schema (`infra/schema.sql`) | ✅ | 11 PG schemas, 56 tables |
| 0.9 | Database seed (`infra/seed.sql`) | ✅ | Tenant, users, roles, products, etc. |

---

## Phase 1 — Core API + Auth ✅

| # | Task | Status | Notes |
|---|------|--------|-------|
| 1.1 | Shared `@nkc/database` (Prisma multiSchema) | ✅ | 56 introspected models, snake_case |
| 1.2 | JWT auth middleware (`middleware.ts`) | ✅ | Protects all `/api/*` except login/refresh |
| 1.3 | Auth helpers (`lib/auth.ts`) | ✅ | signToken, verifyToken, getAuthUser, requirePermissions |
| 1.4 | API error handling (`lib/api-helpers.ts`) | ✅ | apiHandler wrapper, typed errors |
| 1.5 | Auth routes: login, refresh, logout | ✅ | `/api/auth/*` |
| 1.6 | Users routes: list, create, get by ID | ✅ | `/api/users`, `/api/users/[id]` |
| 1.7 | Roles routes: list, create, assign permissions | ✅ | `/api/roles`, `/api/roles/[id]/permissions` |
| 1.8 | Products routes: CRUD + versions, BOM, routing | ✅ | `/api/products/**` |
| 1.9 | Items, customers, suppliers routes | ✅ | `/api/items`, `/api/customers`, `/api/suppliers` |
| 1.10 | Sales orders: CRUD, confirm, revise | ✅ | `/api/sales-orders/**` |
| 1.11 | Order import: Excel upload + job status | ✅ | `/api/order-import/**` |

---

## Phase 2 — Planning & Inventory ✅

| # | Task | Status | Notes |
|---|------|--------|-------|
| 2.1 | MRP: BOM explosion → material requirement lines | ✅ | `POST /api/planning/mrp` — explodes BOM per SO line |
| 2.2 | MRP: check stock → calculate shortage | ✅ | Cross-queries inventory.stock_balances, computes shortage_qty |
| 2.3 | Production planning: generate plan from SO | ✅ | `POST /api/planning/production-plans` |
| 2.4 | Production planning: work-center capacity check | ✅ | ETD risk levels (low/medium/high) based on capacity |
| 2.5 | Warehouses + bin locations CRUD | ✅ | `/api/inventory/warehouses/**` |
| 2.6 | Lots management | ✅ | `/api/inventory/lots` |
| 2.7 | Stock transactions (receive, issue, transfer, adjust) | ✅ | `/api/inventory/transactions` |
| 2.8 | Stock balance auto-update on transaction | ✅ | Upsert in $transaction, transfer creates 2 txns |
| 2.9 | Inventory reservations (reserve / release / consume) | ✅ | `/api/inventory/reservations/**` |
| 2.10 | Manual order creation (code-based lookups) | ✅ | `POST /api/sales-orders/manual` |

---

## Phase 3 — Production & Quality ✅

| # | Task | Status | Notes |
|---|------|--------|-------|
| 3.1 | Work order generation from production plan | ✅ | `POST /api/production/work-orders` — creates WO per SO line with routing steps |
| 3.2 | Work order step progression (per routing) | ✅ | `PATCH /api/production/work-orders/[id]/steps/[stepId]` — state machine transitions |
| 3.3 | Execution logging (start/stop/pause) | ✅ | `GET/POST /api/production/work-orders/[id]/steps/[stepId]/executions` |
| 3.4 | Scrap logging | ✅ | `GET/POST /api/production/work-orders/[id]/steps/[stepId]/scrap` — updates step + WO qty |
| 3.5 | Downtime logging | ✅ | `GET/POST /api/production/work-orders/[id]/steps/[stepId]/downtime` |
| 3.6 | Material issuance to work order | ✅ | `GET/POST /api/production/work-orders/[id]/materials` — issue txn + balance update |
| 3.7 | QC plan + checklist setup | ✅ | `GET/POST /api/quality/plans`, `GET/PATCH /api/quality/plans/[id]` |
| 3.8 | QC inspection creation & result recording | ✅ | `GET/POST /api/quality/inspections`, `GET/PATCH /api/quality/inspections/[id]` |
| 3.9 | Defect logging + disposition | ✅ | `GET/POST /api/quality/inspections/[id]/defects` — auto-increments failed_qty |

---

## Phase 4 — Shipping & Billing 🔲

| # | Task | Status | Notes |
|---|------|--------|-------|
| 4.1 | Packing unit creation from completed WO | 🔲 | `/api/shipping/packing-units` |
| 4.2 | Shipment CRUD | 🔲 | `/api/shipping/shipments` |
| 4.3 | Container allocation + CBM calculator | 🔲 | |
| 4.4 | Shipment locking + status flow | 🔲 | draft→planned→locked→shipped |
| 4.5 | Invoice generation from shipment | 🔲 | `/api/billing/invoices` |
| 4.6 | Payment receipt recording | 🔲 | |
| 4.7 | Invoice status flow | 🔲 | draft→issued→partially_paid→paid |

---

## Phase 5 — Web UI ✅

| # | Task | Status | Notes |
|---|------|--------|-------|
| 5.1 | Auth: login page → JWT flow → protected routes | ✅ | Zustand store + API client with auto-refresh |
| 5.2 | Layout: sidebar nav, breadcrumbs, user menu | ✅ | Vietnamese sidebar, mobile responsive |
| 5.3 | Dashboard: live stats | ✅ | 6 KPI cards, auto-refresh 30s |
| 5.4 | Master Data: products list + detail + BOM editor | ✅ | Product CRUD + BOM/Routing views |
| 5.5 | Master Data: items / customers / suppliers CRUD | ✅ | Full CRUD with Vietnamese labels |
| 5.6 | Orders: import wizard (upload → validate → confirm) | ✅ | Excel upload + manual create |
| 5.7 | Orders: sales order list + detail + revision history | ✅ | List/detail/confirm flow |
| 5.8 | Planning: MRP view + production plan | ✅ | Tabbed MRP + plans view |
| 5.9 | Inventory: stock balance view, transactions list | ✅ | Tabbed balances + transactions |
| 5.10 | Production: work order board | ✅ | List + detail with step progression |
| 5.11 | Quality: inspection list + result entry form | ✅ | Inspections + defects + detail |
| 5.12 | Shipping: shipment list + container loader | 🔲 | Phase 4 dependency |
| 5.13 | Billing: invoice list + payment recording | 🔲 | Phase 4 dependency |

---

## Phase 6 — Mobile App 🔲

| # | Task | Status | Notes |
|---|------|--------|-------|
| 6.1 | Auth: login → token storage | 🔲 | |
| 6.2 | Work order scanner (QR/barcode) | 🔲 | |
| 6.3 | Step execution: start/stop/log scrap | 🔲 | |
| 6.4 | QC inspection entry (with photo capture) | 🔲 | |
| 6.5 | Warehouse receive / pick / transfer | 🔲 | |

---

## Cross-Cutting Concerns

| # | Task | Status | Notes |
|---|------|--------|-------|
| X.1 | Audit log middleware | 🔲 | Write to `platform.audit_logs` |
| X.2 | Request logging / correlation-id | 🔲 | |
| X.3 | Rate limiting per tenant | 🔲 | |
| X.4 | Unit + integration test setup | 🔲 | |
| X.5 | E2E test setup | 🔲 | |
