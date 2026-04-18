-- =============================================================================
-- NKC Furniture Manufacturing ERP — Database Schema
-- PostgreSQL 16+
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE SCHEMA IF NOT EXISTS platform;
CREATE SCHEMA IF NOT EXISTS iam;
CREATE SCHEMA IF NOT EXISTS master;
CREATE SCHEMA IF NOT EXISTS orders;
CREATE SCHEMA IF NOT EXISTS planning;
CREATE SCHEMA IF NOT EXISTS inventory;
CREATE SCHEMA IF NOT EXISTS production;
CREATE SCHEMA IF NOT EXISTS quality;
CREATE SCHEMA IF NOT EXISTS shipping;
CREATE SCHEMA IF NOT EXISTS billing;
CREATE SCHEMA IF NOT EXISTS docs;

-- =============================================================================
-- SHARED: updated_at trigger function
-- =============================================================================

CREATE OR REPLACE FUNCTION platform.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =========================================================
-- 1) PLATFORM
-- =========================================================

CREATE TABLE platform.outbox_events (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  aggregate_type text       NOT NULL,
  aggregate_id  uuid        NOT NULL,
  event_name    text        NOT NULL,
  payload       jsonb       NOT NULL,
  status        text        NOT NULL DEFAULT 'pending'
                            CHECK (status IN ('pending', 'published', 'failed')),
  occurred_at   timestamptz NOT NULL DEFAULT now(),
  published_at  timestamptz,
  retry_count   integer     NOT NULL DEFAULT 0
);

CREATE INDEX idx_outbox_status_occurred
  ON platform.outbox_events(status, occurred_at)
  WHERE status = 'pending';

CREATE TABLE platform.audit_logs (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id  uuid,
  actor_email    text,
  action         text        NOT NULL,
  entity_type    text        NOT NULL,
  entity_id      uuid        NOT NULL,
  before_data    jsonb,
  after_data     jsonb,
  ip_address     text,
  user_agent     text,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_entity
  ON platform.audit_logs(entity_type, entity_id, created_at DESC);

CREATE INDEX idx_audit_actor
  ON platform.audit_logs(actor_user_id, created_at DESC);

-- =========================================================
-- 2) IAM
-- =========================================================

CREATE TABLE iam.tenants (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  code       text        NOT NULL UNIQUE,
  name       text        NOT NULL,
  status     text        NOT NULL DEFAULT 'active'
                         CHECK (status IN ('active', 'inactive')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_tenants_updated_at BEFORE UPDATE ON iam.tenants
  FOR EACH ROW EXECUTE FUNCTION platform.set_updated_at();

CREATE TABLE iam.sites (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  uuid        NOT NULL REFERENCES iam.tenants(id),
  code       text        NOT NULL,
  name       text        NOT NULL,
  site_type  text        NOT NULL CHECK (site_type IN ('factory', 'warehouse', 'office')),
  address    text,
  status     text        NOT NULL DEFAULT 'active'
                         CHECK (status IN ('active', 'inactive')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, code)
);

CREATE INDEX idx_sites_tenant ON iam.sites(tenant_id);

CREATE TRIGGER trg_sites_updated_at BEFORE UPDATE ON iam.sites
  FOR EACH ROW EXECUTE FUNCTION platform.set_updated_at();

CREATE TABLE iam.users (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     uuid        NOT NULL REFERENCES iam.tenants(id),
  email         text        NOT NULL,
  full_name     text        NOT NULL,
  password_hash text        NOT NULL,
  phone         text,
  status        text        NOT NULL DEFAULT 'active'
                            CHECK (status IN ('active', 'inactive', 'locked')),
  last_login_at timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, email)
);

CREATE INDEX idx_users_tenant_status ON iam.users(tenant_id, status);

CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON iam.users
  FOR EACH ROW EXECUTE FUNCTION platform.set_updated_at();

CREATE TABLE iam.roles (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  uuid        NOT NULL REFERENCES iam.tenants(id),
  code       text        NOT NULL,
  name       text        NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, code)
);

CREATE INDEX idx_roles_tenant ON iam.roles(tenant_id);

CREATE TRIGGER trg_roles_updated_at BEFORE UPDATE ON iam.roles
  FOR EACH ROW EXECUTE FUNCTION platform.set_updated_at();

CREATE TABLE iam.permissions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code        text NOT NULL UNIQUE,
  description text
);

CREATE TABLE iam.role_permissions (
  role_id       uuid NOT NULL REFERENCES iam.roles(id) ON DELETE CASCADE,
  permission_id uuid NOT NULL REFERENCES iam.permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

CREATE INDEX idx_role_permissions_permission ON iam.role_permissions(permission_id);

-- FIX: site_id is nullable → surrogate PK + partial unique indexes
CREATE TABLE iam.user_roles (
  id      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES iam.users(id) ON DELETE CASCADE,
  role_id uuid NOT NULL REFERENCES iam.roles(id) ON DELETE CASCADE,
  site_id uuid REFERENCES iam.sites(id)
);

-- Site-scoped role: one assignment per (user, role, site)
CREATE UNIQUE INDEX uq_user_roles_scoped
  ON iam.user_roles(user_id, role_id, site_id)
  WHERE site_id IS NOT NULL;

-- Global role: one assignment per (user, role) when no site
CREATE UNIQUE INDEX uq_user_roles_global
  ON iam.user_roles(user_id, role_id)
  WHERE site_id IS NULL;

CREATE INDEX idx_user_roles_user   ON iam.user_roles(user_id);
CREATE INDEX idx_user_roles_role   ON iam.user_roles(role_id);

CREATE TABLE iam.refresh_sessions (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            uuid        NOT NULL REFERENCES iam.users(id) ON DELETE CASCADE,
  refresh_token_hash text        NOT NULL,
  device_name        text,
  platform           text,
  ip_address         text,
  expires_at         timestamptz NOT NULL,
  revoked_at         timestamptz,
  created_at         timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_refresh_sessions_user ON iam.refresh_sessions(user_id);

-- =========================================================
-- 3) MASTER DATA
-- =========================================================

CREATE TABLE master.uoms (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  uuid        NOT NULL,  -- no FK: cross-service boundary
  code       text        NOT NULL,
  name       text        NOT NULL,
  category   text        NOT NULL CHECK (category IN ('count', 'length', 'area', 'volume', 'weight', 'time')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, code)
);

CREATE TRIGGER trg_uoms_updated_at BEFORE UPDATE ON master.uoms
  FOR EACH ROW EXECUTE FUNCTION platform.set_updated_at();

CREATE TABLE master.customers (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     uuid        NOT NULL,
  customer_code text        NOT NULL,
  customer_name text        NOT NULL,
  email         text,
  phone         text,
  address       text,
  payment_term  text,
  currency_code text        DEFAULT 'USD',
  status        text        NOT NULL DEFAULT 'active'
                            CHECK (status IN ('active', 'inactive')),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, customer_code)
);

CREATE INDEX idx_customers_tenant_status ON master.customers(tenant_id, status);

CREATE TRIGGER trg_customers_updated_at BEFORE UPDATE ON master.customers
  FOR EACH ROW EXECUTE FUNCTION platform.set_updated_at();

CREATE TABLE master.suppliers (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     uuid        NOT NULL,
  supplier_code text        NOT NULL,
  supplier_name text        NOT NULL,
  email         text,
  phone         text,
  address       text,
  lead_time_days integer    DEFAULT 0,
  currency_code text        DEFAULT 'USD',
  status        text        NOT NULL DEFAULT 'active'
                            CHECK (status IN ('active', 'inactive')),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, supplier_code)
);

CREATE INDEX idx_suppliers_tenant_status ON master.suppliers(tenant_id, status);

CREATE TRIGGER trg_suppliers_updated_at BEFORE UPDATE ON master.suppliers
  FOR EACH ROW EXECUTE FUNCTION platform.set_updated_at();

CREATE TABLE master.work_centers (
  id                       uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                uuid        NOT NULL,
  site_id                  uuid,       -- no FK: cross-service boundary (references iam.sites)
  code                     text        NOT NULL,
  name                     text        NOT NULL,
  work_center_type         text        NOT NULL CHECK (
    work_center_type IN ('cutting', 'cnc', 'sanding', 'painting', 'assembly', 'qc', 'packing', 'other')
  ),
  capacity_minutes_per_day integer,
  status                   text        NOT NULL DEFAULT 'active'
                                       CHECK (status IN ('active', 'inactive')),
  created_at               timestamptz NOT NULL DEFAULT now(),
  updated_at               timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, code)
);

CREATE INDEX idx_work_centers_site ON master.work_centers(site_id);

CREATE TRIGGER trg_work_centers_updated_at BEFORE UPDATE ON master.work_centers
  FOR EACH ROW EXECUTE FUNCTION platform.set_updated_at();

CREATE TABLE master.products (
  id                    uuid           PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             uuid           NOT NULL,
  product_code          text           NOT NULL,
  product_name          text           NOT NULL,
  category              text           NOT NULL,
  product_type          text           NOT NULL DEFAULT 'standard'
                                       CHECK (product_type IN ('standard', 'variant', 'custom', 'one_off')),
  length_mm             numeric(12,2),
  width_mm              numeric(12,2),
  height_mm             numeric(12,2),
  main_material         text,
  unit_of_measure_code  text           NOT NULL DEFAULT 'PCS',
  weight_net_kg         numeric(12,3),
  weight_gross_kg       numeric(12,3),
  cbm                   numeric(12,4),
  status                text           NOT NULL DEFAULT 'active'
                                       CHECK (status IN ('active', 'inactive')),
  current_version_id    uuid,
  metadata              jsonb          NOT NULL DEFAULT '{}'::jsonb,
  created_at            timestamptz    NOT NULL DEFAULT now(),
  updated_at            timestamptz    NOT NULL DEFAULT now(),
  created_by            uuid,
  updated_by            uuid,
  UNIQUE (tenant_id, product_code)
);

CREATE INDEX idx_products_tenant_category ON master.products(tenant_id, category);
CREATE INDEX idx_products_tenant_status   ON master.products(tenant_id, status);

CREATE TRIGGER trg_products_updated_at BEFORE UPDATE ON master.products
  FOR EACH ROW EXECUTE FUNCTION platform.set_updated_at();

CREATE TABLE master.product_versions (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      uuid        NOT NULL,
  product_id     uuid        NOT NULL REFERENCES master.products(id) ON DELETE CASCADE,
  version_no     text        NOT NULL,
  effective_from date        NOT NULL,
  effective_to   date,
  status         text        NOT NULL DEFAULT 'draft'
                             CHECK (status IN ('draft', 'approved', 'archived')),
  change_reason  text,
  notes          text,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  created_by     uuid,
  updated_by     uuid,
  UNIQUE (product_id, version_no)
);

CREATE INDEX idx_product_versions_product ON master.product_versions(product_id);

ALTER TABLE master.products
  ADD CONSTRAINT fk_products_current_version
  FOREIGN KEY (current_version_id)
  REFERENCES master.product_versions(id);

CREATE TRIGGER trg_product_versions_updated_at BEFORE UPDATE ON master.product_versions
  FOR EACH ROW EXECUTE FUNCTION platform.set_updated_at();

CREATE TABLE master.items (
  id             uuid           PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      uuid           NOT NULL,
  item_code      text           NOT NULL,
  item_name      text           NOT NULL,
  item_type      text           NOT NULL CHECK (
    item_type IN ('raw_material', 'accessory', 'packaging', 'semi_finished', 'consumable')
  ),
  material_type  text           CHECK (
    material_type IN ('veneer', 'solid_wood', 'mdf', 'plywood', 'metal', 'paint', 'glue', 'foam', 'carton', 'other')
  ),
  default_uom_code text        NOT NULL,
  length_mm      numeric(12,2),
  width_mm       numeric(12,2),
  thickness_mm   numeric(12,2),
  spec_text      text,
  standard_cost  numeric(18,4),
  supplier_id    uuid,          -- no FK: may reference master.suppliers cross-query
  lead_time_days integer        DEFAULT 0,
  min_stock_qty  numeric(18,4),
  max_stock_qty  numeric(18,4),
  status         text           NOT NULL DEFAULT 'active'
                                CHECK (status IN ('active', 'inactive')),
  metadata       jsonb          NOT NULL DEFAULT '{}'::jsonb,
  created_at     timestamptz    NOT NULL DEFAULT now(),
  updated_at     timestamptz    NOT NULL DEFAULT now(),
  created_by     uuid,
  updated_by     uuid,
  UNIQUE (tenant_id, item_code)
);

CREATE INDEX idx_items_tenant_type ON master.items(tenant_id, item_type);
CREATE INDEX idx_items_supplier    ON master.items(supplier_id) WHERE supplier_id IS NOT NULL;

CREATE TRIGGER trg_items_updated_at BEFORE UPDATE ON master.items
  FOR EACH ROW EXECUTE FUNCTION platform.set_updated_at();

CREATE TABLE master.bom_headers (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id          uuid        NOT NULL,
  product_version_id uuid        NOT NULL REFERENCES master.product_versions(id) ON DELETE CASCADE,
  bom_code           text        NOT NULL,
  status             text        NOT NULL DEFAULT 'draft'
                                 CHECK (status IN ('draft', 'approved', 'archived')),
  notes              text,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now(),
  created_by         uuid,
  updated_by         uuid,
  UNIQUE (product_version_id, bom_code)
);

CREATE INDEX idx_bom_headers_version ON master.bom_headers(product_version_id);

CREATE TRIGGER trg_bom_headers_updated_at BEFORE UPDATE ON master.bom_headers
  FOR EACH ROW EXECUTE FUNCTION platform.set_updated_at();

CREATE TABLE master.bom_items (
  id                    uuid           PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             uuid           NOT NULL,
  bom_header_id         uuid           NOT NULL REFERENCES master.bom_headers(id) ON DELETE CASCADE,
  parent_component_code text,
  line_no               integer        NOT NULL,
  component_code        text           NOT NULL,
  component_name        text           NOT NULL,
  component_type        text           NOT NULL CHECK (
    component_type IN ('panel', 'frame', 'hardware', 'packaging', 'assembly', 'material')
  ),
  item_id               uuid,
  material_type         text,
  qty_per_product       numeric(18,4)  NOT NULL,
  uom_code              text           NOT NULL,
  length_mm             numeric(12,2),
  width_mm              numeric(12,2),
  thickness_mm          numeric(12,2),
  edge_banding_rule     text,
  scrap_percent         numeric(8,4)   NOT NULL DEFAULT 0,
  is_optional           boolean        NOT NULL DEFAULT false,
  production_note       text,
  metadata              jsonb          NOT NULL DEFAULT '{}'::jsonb,
  created_at            timestamptz    NOT NULL DEFAULT now(),
  updated_at            timestamptz    NOT NULL DEFAULT now(),
  UNIQUE (bom_header_id, line_no)
);

CREATE INDEX idx_bom_items_header_type ON master.bom_items(bom_header_id, component_type);
CREATE INDEX idx_bom_items_item        ON master.bom_items(item_id) WHERE item_id IS NOT NULL;
CREATE INDEX idx_bom_items_parent      ON master.bom_items(bom_header_id, parent_component_code)
  WHERE parent_component_code IS NOT NULL;

CREATE TRIGGER trg_bom_items_updated_at BEFORE UPDATE ON master.bom_items
  FOR EACH ROW EXECUTE FUNCTION platform.set_updated_at();

CREATE TABLE master.routings (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id          uuid        NOT NULL,
  product_version_id uuid        NOT NULL REFERENCES master.product_versions(id) ON DELETE CASCADE,
  routing_code       text        NOT NULL,
  status             text        NOT NULL DEFAULT 'draft'
                                 CHECK (status IN ('draft', 'approved', 'archived')),
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now(),
  UNIQUE (product_version_id, routing_code)
);

CREATE INDEX idx_routings_version ON master.routings(product_version_id);

CREATE TRIGGER trg_routings_updated_at BEFORE UPDATE ON master.routings
  FOR EACH ROW EXECUTE FUNCTION platform.set_updated_at();

CREATE TABLE master.routing_steps (
  id               uuid           PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        uuid           NOT NULL,
  routing_id       uuid           NOT NULL REFERENCES master.routings(id) ON DELETE CASCADE,
  step_no          integer        NOT NULL,
  step_code        text           NOT NULL,
  step_name        text           NOT NULL,
  work_center_id   uuid,
  standard_minutes numeric(12,2)  NOT NULL DEFAULT 0,
  queue_minutes    numeric(12,2)  NOT NULL DEFAULT 0,
  is_qc_required   boolean        NOT NULL DEFAULT false,
  is_mandatory     boolean        NOT NULL DEFAULT true,
  notes            text,
  created_at       timestamptz    NOT NULL DEFAULT now(),
  updated_at       timestamptz    NOT NULL DEFAULT now(),
  UNIQUE (routing_id, step_no)
);

CREATE INDEX idx_routing_steps_routing     ON master.routing_steps(routing_id);
CREATE INDEX idx_routing_steps_work_center ON master.routing_steps(work_center_id)
  WHERE work_center_id IS NOT NULL;

CREATE TRIGGER trg_routing_steps_updated_at BEFORE UPDATE ON master.routing_steps
  FOR EACH ROW EXECUTE FUNCTION platform.set_updated_at();

CREATE TABLE master.packing_specs (
  id                 uuid           PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id          uuid           NOT NULL,
  product_version_id uuid           NOT NULL REFERENCES master.product_versions(id) ON DELETE CASCADE,
  carton_count       integer        NOT NULL DEFAULT 1,
  carton_length_mm   numeric(12,2),
  carton_width_mm    numeric(12,2),
  carton_height_mm   numeric(12,2),
  net_weight_kg      numeric(12,3),
  gross_weight_kg    numeric(12,3),
  cbm                numeric(12,4),
  is_stackable       boolean        NOT NULL DEFAULT true,
  max_stack          integer,
  loading_rule       text,
  notes              text,
  created_at         timestamptz    NOT NULL DEFAULT now(),
  updated_at         timestamptz    NOT NULL DEFAULT now(),
  UNIQUE (product_version_id)
);

CREATE TRIGGER trg_packing_specs_updated_at BEFORE UPDATE ON master.packing_specs
  FOR EACH ROW EXECUTE FUNCTION platform.set_updated_at();

-- =========================================================
-- 4) ORDERS
-- =========================================================

CREATE TABLE orders.order_import_jobs (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid        NOT NULL,
  source_type     text        NOT NULL CHECK (source_type IN ('upload', 'email', 'api')),
  source_ref      text,
  file_document_id uuid,      -- no FK: references docs.documents cross-schema
  status          text        NOT NULL CHECK (
    status IN ('uploaded', 'parsing', 'validated', 'failed', 'draft_created', 'confirmed')
  ),
  total_rows      integer     DEFAULT 0,
  valid_rows      integer     DEFAULT 0,
  error_rows      integer     DEFAULT 0,
  error_summary   jsonb       NOT NULL DEFAULT '{}'::jsonb,
  started_at      timestamptz,
  finished_at     timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  created_by      uuid,
  updated_by      uuid
);

CREATE INDEX idx_import_jobs_tenant_status ON orders.order_import_jobs(tenant_id, status);

CREATE TRIGGER trg_import_jobs_updated_at BEFORE UPDATE ON orders.order_import_jobs
  FOR EACH ROW EXECUTE FUNCTION platform.set_updated_at();

CREATE TABLE orders.sales_orders (
  id              uuid           PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid           NOT NULL,
  order_no        text           NOT NULL,
  customer_id     uuid           NOT NULL,  -- no FK: references master.customers cross-schema
  po_number       text,
  currency_code   text           NOT NULL DEFAULT 'USD',
  order_date      date           NOT NULL,
  requested_etd   date,
  priority        text           NOT NULL DEFAULT 'normal'
                                 CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  payment_term    text,
  status          text           NOT NULL DEFAULT 'draft' CHECK (
    status IN ('draft', 'confirmed', 'in_planning', 'in_production',
               'ready_to_ship', 'partially_shipped', 'shipped', 'closed', 'cancelled')
  ),
  revision_no     integer        NOT NULL DEFAULT 0,
  total_amount    numeric(18,2)  NOT NULL DEFAULT 0,
  notes           text,
  import_job_id   uuid,
  created_at      timestamptz    NOT NULL DEFAULT now(),
  updated_at      timestamptz    NOT NULL DEFAULT now(),
  created_by      uuid,
  updated_by      uuid,
  UNIQUE (tenant_id, order_no)
);

CREATE INDEX idx_sales_orders_tenant_status    ON orders.sales_orders(tenant_id, status);
CREATE INDEX idx_sales_orders_customer_status  ON orders.sales_orders(customer_id, status);
CREATE INDEX idx_sales_orders_etd              ON orders.sales_orders(requested_etd)
  WHERE status NOT IN ('shipped', 'closed', 'cancelled');

CREATE TRIGGER trg_sales_orders_updated_at BEFORE UPDATE ON orders.sales_orders
  FOR EACH ROW EXECUTE FUNCTION platform.set_updated_at();

CREATE TABLE orders.sales_order_lines (
  id                 uuid           PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id          uuid           NOT NULL,
  sales_order_id     uuid           NOT NULL REFERENCES orders.sales_orders(id) ON DELETE CASCADE,
  line_no            integer        NOT NULL,
  product_id         uuid           NOT NULL,  -- no FK: references master.products cross-schema
  product_version_id uuid,
  product_code       text           NOT NULL,
  product_name       text           NOT NULL,
  quantity           numeric(18,4)  NOT NULL,
  unit_price         numeric(18,4)  NOT NULL DEFAULT 0,
  requested_etd      date,
  priority           text           NOT NULL DEFAULT 'normal'
                                    CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  custom_spec        jsonb          NOT NULL DEFAULT '{}'::jsonb,
  status             text           NOT NULL DEFAULT 'open' CHECK (
    status IN ('open', 'planned', 'in_production', 'ready_to_ship',
               'partially_shipped', 'shipped', 'cancelled')
  ),
  notes              text,
  created_at         timestamptz    NOT NULL DEFAULT now(),
  updated_at         timestamptz    NOT NULL DEFAULT now(),
  UNIQUE (sales_order_id, line_no)
);

CREATE INDEX idx_sol_order    ON orders.sales_order_lines(sales_order_id);
CREATE INDEX idx_sol_product  ON orders.sales_order_lines(product_id);

CREATE TRIGGER trg_sol_updated_at BEFORE UPDATE ON orders.sales_order_lines
  FOR EACH ROW EXECUTE FUNCTION platform.set_updated_at();

CREATE TABLE orders.order_revisions (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid        NOT NULL,
  sales_order_id  uuid        NOT NULL REFERENCES orders.sales_orders(id) ON DELETE CASCADE,
  revision_no     integer     NOT NULL,
  change_reason   text,
  snapshot        jsonb       NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  created_by      uuid,
  UNIQUE (sales_order_id, revision_no)
);

CREATE INDEX idx_order_revisions_order ON orders.order_revisions(sales_order_id);

CREATE TABLE orders.order_validation_errors (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     uuid        NOT NULL,
  import_job_id uuid        NOT NULL REFERENCES orders.order_import_jobs(id) ON DELETE CASCADE,
  row_no        integer     NOT NULL,
  field_name    text,
  error_code    text        NOT NULL,
  error_message text        NOT NULL,
  raw_value     text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_validation_errors_job ON orders.order_validation_errors(import_job_id, row_no);

-- =========================================================
-- 5) PLANNING
-- =========================================================

CREATE TABLE planning.material_requirement_plans (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid        NOT NULL,
  sales_order_id  uuid        NOT NULL,  -- no FK: references orders.sales_orders
  plan_no         text        NOT NULL,
  status          text        NOT NULL DEFAULT 'draft'
                              CHECK (status IN ('draft', 'approved', 'archived')),
  planning_date   date        NOT NULL,
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  created_by      uuid,
  updated_by      uuid,
  UNIQUE (tenant_id, plan_no)
);

CREATE INDEX idx_mrp_sales_order ON planning.material_requirement_plans(sales_order_id);

CREATE TRIGGER trg_mrp_updated_at BEFORE UPDATE ON planning.material_requirement_plans
  FOR EACH ROW EXECUTE FUNCTION platform.set_updated_at();

CREATE TABLE planning.material_requirement_lines (
  id                          uuid           PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                   uuid           NOT NULL,
  material_requirement_plan_id uuid          NOT NULL REFERENCES planning.material_requirement_plans(id) ON DELETE CASCADE,
  sales_order_line_id         uuid           NOT NULL,  -- no FK: references orders.sales_order_lines
  item_id                     uuid           NOT NULL,  -- no FK: references master.items
  item_code                   text           NOT NULL,
  item_name                   text           NOT NULL,
  gross_required_qty          numeric(18,4)  NOT NULL DEFAULT 0,
  available_qty               numeric(18,4)  NOT NULL DEFAULT 0,
  reserved_qty                numeric(18,4)  NOT NULL DEFAULT 0,
  shortage_qty                numeric(18,4)  NOT NULL DEFAULT 0,
  uom_code                    text           NOT NULL,
  supplier_id                 uuid,
  need_by_date                date,
  created_at                  timestamptz    NOT NULL DEFAULT now(),
  UNIQUE (material_requirement_plan_id, sales_order_line_id, item_id)
);

CREATE INDEX idx_mrp_lines_plan    ON planning.material_requirement_lines(material_requirement_plan_id);
CREATE INDEX idx_mrp_lines_item    ON planning.material_requirement_lines(item_id, need_by_date);

CREATE TABLE planning.production_plans (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid        NOT NULL,
  sales_order_id  uuid        NOT NULL,
  plan_no         text        NOT NULL,
  status          text        NOT NULL DEFAULT 'draft'
                              CHECK (status IN ('draft', 'approved', 'released', 'completed', 'cancelled')),
  start_date      date,
  end_date        date,
  etd_risk_level  text        DEFAULT 'low'
                              CHECK (etd_risk_level IN ('low', 'medium', 'high')),
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  created_by      uuid,
  updated_by      uuid,
  UNIQUE (tenant_id, plan_no)
);

CREATE INDEX idx_prod_plans_order ON planning.production_plans(sales_order_id);

CREATE TRIGGER trg_prod_plans_updated_at BEFORE UPDATE ON planning.production_plans
  FOR EACH ROW EXECUTE FUNCTION platform.set_updated_at();

CREATE TABLE planning.production_plan_lines (
  id                  uuid           PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           uuid           NOT NULL,
  production_plan_id  uuid           NOT NULL REFERENCES planning.production_plans(id) ON DELETE CASCADE,
  sales_order_line_id uuid           NOT NULL,
  routing_step_id     uuid,
  work_center_id      uuid,
  planned_qty         numeric(18,4)  NOT NULL,
  planned_start_at    timestamptz,
  planned_end_at      timestamptz,
  priority_seq        integer,
  status              text           NOT NULL DEFAULT 'planned'
                                     CHECK (status IN ('planned', 'released', 'in_progress', 'completed', 'cancelled')),
  created_at          timestamptz    NOT NULL DEFAULT now()
);

CREATE INDEX idx_ppl_plan        ON planning.production_plan_lines(production_plan_id);
CREATE INDEX idx_ppl_wc_time     ON planning.production_plan_lines(work_center_id, planned_start_at);

-- =========================================================
-- 6) INVENTORY
-- =========================================================

CREATE TABLE inventory.warehouses (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid        NOT NULL,
  site_id         uuid,       -- no FK: references iam.sites cross-schema
  warehouse_code  text        NOT NULL,
  warehouse_name  text        NOT NULL,
  status          text        NOT NULL DEFAULT 'active'
                              CHECK (status IN ('active', 'inactive')),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, warehouse_code)
);

CREATE INDEX idx_warehouses_site ON inventory.warehouses(site_id) WHERE site_id IS NOT NULL;

CREATE TRIGGER trg_warehouses_updated_at BEFORE UPDATE ON inventory.warehouses
  FOR EACH ROW EXECUTE FUNCTION platform.set_updated_at();

CREATE TABLE inventory.bin_locations (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    uuid        NOT NULL,
  warehouse_id uuid        NOT NULL REFERENCES inventory.warehouses(id) ON DELETE CASCADE,
  bin_code     text        NOT NULL,
  bin_name     text,
  status       text        NOT NULL DEFAULT 'active'
                           CHECK (status IN ('active', 'inactive')),
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (warehouse_id, bin_code)
);

CREATE INDEX idx_bin_locations_warehouse ON inventory.bin_locations(warehouse_id);

CREATE TABLE inventory.lots (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     uuid        NOT NULL,
  item_id       uuid        NOT NULL,  -- no FK: references master.items
  lot_no        text        NOT NULL,
  received_date date,
  expiry_date   date,
  supplier_id   uuid,
  metadata      jsonb       NOT NULL DEFAULT '{}'::jsonb,
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, item_id, lot_no)
);

CREATE INDEX idx_lots_item ON inventory.lots(item_id);

CREATE TABLE inventory.stock_balances (
  id              uuid           PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid           NOT NULL,
  warehouse_id    uuid           NOT NULL REFERENCES inventory.warehouses(id) ON DELETE CASCADE,
  bin_location_id uuid           REFERENCES inventory.bin_locations(id),
  item_id         uuid           NOT NULL,
  lot_id          uuid,
  on_hand_qty     numeric(18,4)  NOT NULL DEFAULT 0,
  reserved_qty    numeric(18,4)  NOT NULL DEFAULT 0,
  available_qty   numeric(18,4)  NOT NULL GENERATED ALWAYS AS (on_hand_qty - reserved_qty) STORED,
  uom_code        text           NOT NULL,
  updated_at      timestamptz    NOT NULL DEFAULT now()
);

-- FIX: partial unique indexes for nullable bin_location_id / lot_id
-- All four combos of (null, null), (null, set), (set, null), (set, set):
CREATE UNIQUE INDEX uq_stock_bal_full
  ON inventory.stock_balances(warehouse_id, bin_location_id, item_id, lot_id)
  WHERE bin_location_id IS NOT NULL AND lot_id IS NOT NULL;

CREATE UNIQUE INDEX uq_stock_bal_no_lot
  ON inventory.stock_balances(warehouse_id, bin_location_id, item_id)
  WHERE bin_location_id IS NOT NULL AND lot_id IS NULL;

CREATE UNIQUE INDEX uq_stock_bal_no_bin
  ON inventory.stock_balances(warehouse_id, item_id, lot_id)
  WHERE bin_location_id IS NULL AND lot_id IS NOT NULL;

CREATE UNIQUE INDEX uq_stock_bal_no_bin_no_lot
  ON inventory.stock_balances(warehouse_id, item_id)
  WHERE bin_location_id IS NULL AND lot_id IS NULL;

CREATE INDEX idx_stock_balances_item ON inventory.stock_balances(item_id, warehouse_id);

CREATE TABLE inventory.stock_transactions (
  id               uuid           PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        uuid           NOT NULL,
  transaction_no   text           NOT NULL,
  transaction_type text           NOT NULL CHECK (
    transaction_type IN ('receive', 'issue', 'transfer', 'adjustment', 'reserve', 'unreserve')
  ),
  warehouse_id     uuid           NOT NULL REFERENCES inventory.warehouses(id),
  bin_location_id  uuid           REFERENCES inventory.bin_locations(id),
  item_id          uuid           NOT NULL,
  lot_id           uuid,
  quantity         numeric(18,4)  NOT NULL,
  uom_code         text           NOT NULL,
  ref_type         text,
  ref_id           uuid,
  reason           text,
  created_at       timestamptz    NOT NULL DEFAULT now(),
  created_by       uuid,
  UNIQUE (tenant_id, transaction_no)
);

CREATE INDEX idx_stock_tx_item_created ON inventory.stock_transactions(item_id, created_at DESC);
CREATE INDEX idx_stock_tx_ref          ON inventory.stock_transactions(ref_type, ref_id)
  WHERE ref_type IS NOT NULL;

CREATE TABLE inventory.inventory_reservations (
  id            uuid           PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     uuid           NOT NULL,
  item_id       uuid           NOT NULL,
  warehouse_id  uuid           NOT NULL REFERENCES inventory.warehouses(id),
  ref_type      text           NOT NULL CHECK (ref_type IN ('sales_order_line', 'work_order', 'shipment')),
  ref_id        uuid           NOT NULL,
  reserved_qty  numeric(18,4)  NOT NULL,
  uom_code      text           NOT NULL,
  status        text           NOT NULL DEFAULT 'active'
                               CHECK (status IN ('active', 'released', 'consumed')),
  created_at    timestamptz    NOT NULL DEFAULT now(),
  released_at   timestamptz
);

CREATE INDEX idx_inv_res_ref  ON inventory.inventory_reservations(ref_type, ref_id);
CREATE INDEX idx_inv_res_item ON inventory.inventory_reservations(item_id, warehouse_id)
  WHERE status = 'active';

-- =========================================================
-- 7) PRODUCTION
-- =========================================================

CREATE TABLE production.work_orders (
  id                  uuid           PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           uuid           NOT NULL,
  work_order_no       text           NOT NULL,
  sales_order_id      uuid           NOT NULL,  -- no FK: references orders.sales_orders
  sales_order_line_id uuid           NOT NULL,
  production_plan_id  uuid,
  product_id          uuid           NOT NULL,
  product_version_id  uuid,
  routing_id          uuid,
  planned_qty         numeric(18,4)  NOT NULL,
  completed_qty       numeric(18,4)  NOT NULL DEFAULT 0,
  scrapped_qty        numeric(18,4)  NOT NULL DEFAULT 0,
  planned_start_at    timestamptz,
  planned_end_at      timestamptz,
  actual_start_at     timestamptz,
  actual_end_at       timestamptz,
  status              text           NOT NULL DEFAULT 'released' CHECK (
    status IN ('released', 'in_progress', 'paused', 'completed', 'cancelled')
  ),
  priority            text           NOT NULL DEFAULT 'normal'
                                     CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  created_at          timestamptz    NOT NULL DEFAULT now(),
  updated_at          timestamptz    NOT NULL DEFAULT now(),
  created_by          uuid,
  updated_by          uuid,
  UNIQUE (tenant_id, work_order_no)
);

CREATE INDEX idx_wo_status_time    ON production.work_orders(status, planned_start_at);
CREATE INDEX idx_wo_sales_order    ON production.work_orders(sales_order_id);
CREATE INDEX idx_wo_tenant_status  ON production.work_orders(tenant_id, status);

CREATE TRIGGER trg_work_orders_updated_at BEFORE UPDATE ON production.work_orders
  FOR EACH ROW EXECUTE FUNCTION platform.set_updated_at();

CREATE TABLE production.work_order_steps (
  id               uuid           PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        uuid           NOT NULL,
  work_order_id    uuid           NOT NULL REFERENCES production.work_orders(id) ON DELETE CASCADE,
  routing_step_id  uuid,
  step_no          integer        NOT NULL,
  step_code        text           NOT NULL,
  step_name        text           NOT NULL,
  work_center_id   uuid,
  planned_qty      numeric(18,4)  NOT NULL,
  completed_qty    numeric(18,4)  NOT NULL DEFAULT 0,
  scrapped_qty     numeric(18,4)  NOT NULL DEFAULT 0,
  planned_start_at timestamptz,
  planned_end_at   timestamptz,
  actual_start_at  timestamptz,
  actual_end_at    timestamptz,
  status           text           NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'ready', 'in_progress', 'paused', 'completed', 'skipped', 'cancelled')
  ),
  is_qc_required   boolean        NOT NULL DEFAULT false,
  created_at       timestamptz    NOT NULL DEFAULT now(),
  updated_at       timestamptz    NOT NULL DEFAULT now(),
  UNIQUE (work_order_id, step_no)
);

CREATE INDEX idx_wos_order     ON production.work_order_steps(work_order_id);
CREATE INDEX idx_wos_wc_status ON production.work_order_steps(work_center_id, status);

CREATE TRIGGER trg_wos_updated_at BEFORE UPDATE ON production.work_order_steps
  FOR EACH ROW EXECUTE FUNCTION platform.set_updated_at();

CREATE TABLE production.work_order_executions (
  id                  uuid           PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           uuid           NOT NULL,
  work_order_step_id  uuid           NOT NULL REFERENCES production.work_order_steps(id) ON DELETE CASCADE,
  operator_user_id    uuid,
  team_code           text,
  started_at          timestamptz    NOT NULL,
  ended_at            timestamptz,
  input_qty           numeric(18,4),
  output_qty          numeric(18,4),
  scrap_qty           numeric(18,4)  DEFAULT 0,
  pause_reason        text,
  notes               text,
  created_at          timestamptz    NOT NULL DEFAULT now()
);

CREATE INDEX idx_woe_step ON production.work_order_executions(work_order_step_id);

CREATE TABLE production.scrap_logs (
  id                 uuid           PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id          uuid           NOT NULL,
  work_order_step_id uuid           NOT NULL REFERENCES production.work_order_steps(id) ON DELETE CASCADE,
  quantity           numeric(18,4)  NOT NULL,
  scrap_reason       text           NOT NULL,
  defect_code        text,
  notes              text,
  created_at         timestamptz    NOT NULL DEFAULT now(),
  created_by         uuid
);

CREATE INDEX idx_scrap_logs_step ON production.scrap_logs(work_order_step_id);

CREATE TABLE production.downtime_logs (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id          uuid        NOT NULL,
  work_order_step_id uuid        NOT NULL REFERENCES production.work_order_steps(id) ON DELETE CASCADE,
  work_center_id     uuid,
  start_at           timestamptz NOT NULL,
  end_at             timestamptz,
  downtime_reason    text        NOT NULL,
  notes              text,
  created_at         timestamptz NOT NULL DEFAULT now(),
  created_by         uuid
);

CREATE INDEX idx_downtime_step ON production.downtime_logs(work_order_step_id);
CREATE INDEX idx_downtime_wc   ON production.downtime_logs(work_center_id)
  WHERE work_center_id IS NOT NULL;

-- =========================================================
-- 8) QUALITY
-- =========================================================

CREATE TABLE quality.qc_plans (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id          uuid        NOT NULL,
  product_version_id uuid,
  routing_step_id    uuid,
  qc_plan_code       text        NOT NULL,
  qc_plan_name       text        NOT NULL,
  qc_type            text        NOT NULL CHECK (qc_type IN ('incoming', 'in_process', 'final')),
  status             text        NOT NULL DEFAULT 'active'
                                 CHECK (status IN ('active', 'inactive')),
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, qc_plan_code)
);

CREATE TRIGGER trg_qc_plans_updated_at BEFORE UPDATE ON quality.qc_plans
  FOR EACH ROW EXECUTE FUNCTION platform.set_updated_at();

CREATE TABLE quality.qc_checklist_items (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      uuid        NOT NULL,
  qc_plan_id     uuid        NOT NULL REFERENCES quality.qc_plans(id) ON DELETE CASCADE,
  line_no        integer     NOT NULL,
  item_name      text        NOT NULL,
  check_method   text,
  expected_value text,
  is_required    boolean     NOT NULL DEFAULT true,
  created_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (qc_plan_id, line_no)
);

CREATE INDEX idx_qc_checklist_plan ON quality.qc_checklist_items(qc_plan_id);

CREATE TABLE quality.qc_inspections (
  id                uuid           PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         uuid           NOT NULL,
  qc_plan_id        uuid           NOT NULL REFERENCES quality.qc_plans(id),
  inspection_no     text           NOT NULL,
  ref_type          text           NOT NULL CHECK (ref_type IN ('incoming_receipt', 'work_order_step', 'shipment')),
  ref_id            uuid           NOT NULL,
  inspected_qty     numeric(18,4)  NOT NULL,
  passed_qty        numeric(18,4)  NOT NULL DEFAULT 0,
  failed_qty        numeric(18,4)  NOT NULL DEFAULT 0,
  result            text           NOT NULL CHECK (result IN ('pending', 'passed', 'failed', 'partial')),
  notes             text,
  inspected_at      timestamptz,
  inspector_user_id uuid,
  created_at        timestamptz    NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, inspection_no)
);

CREATE INDEX idx_qc_inspections_ref  ON quality.qc_inspections(ref_type, ref_id);
CREATE INDEX idx_qc_inspections_plan ON quality.qc_inspections(qc_plan_id);

CREATE TABLE quality.qc_defects (
  id                uuid           PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         uuid           NOT NULL,
  qc_inspection_id  uuid           NOT NULL REFERENCES quality.qc_inspections(id) ON DELETE CASCADE,
  defect_code       text,
  defect_name       text           NOT NULL,
  severity          text           NOT NULL CHECK (severity IN ('minor', 'major', 'critical')),
  defect_qty        numeric(18,4)  NOT NULL DEFAULT 0,
  disposition       text           NOT NULL CHECK (disposition IN ('rework', 'scrap', 'use_as_is', 'hold')),
  notes             text,
  created_at        timestamptz    NOT NULL DEFAULT now()
);

CREATE INDEX idx_qc_defects_inspection ON quality.qc_defects(qc_inspection_id);

-- =========================================================
-- 9) SHIPPING
-- =========================================================

CREATE TABLE shipping.packing_units (
  id                 uuid           PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id          uuid           NOT NULL,
  packing_unit_no    text           NOT NULL,
  sales_order_line_id uuid          NOT NULL,  -- no FK: references orders.sales_order_lines
  product_id         uuid           NOT NULL,
  product_version_id uuid,
  quantity           numeric(18,4)  NOT NULL,
  carton_no          text,
  pallet_no          text,
  length_mm          numeric(12,2),
  width_mm           numeric(12,2),
  height_mm          numeric(12,2),
  gross_weight_kg    numeric(12,3),
  cbm                numeric(12,4),
  status             text           NOT NULL DEFAULT 'packed'
                                    CHECK (status IN ('packed', 'allocated', 'shipped')),
  created_at         timestamptz    NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, packing_unit_no)
);

CREATE INDEX idx_packing_units_sol ON shipping.packing_units(sales_order_line_id);

CREATE TABLE shipping.shipments (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     uuid        NOT NULL,
  shipment_no   text        NOT NULL,
  customer_id   uuid        NOT NULL,
  etd           date,
  eta           date,
  priority      text        NOT NULL DEFAULT 'normal'
                            CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  shipment_type text        NOT NULL DEFAULT 'sea'
                            CHECK (shipment_type IN ('sea', 'air', 'land')),
  status        text        NOT NULL DEFAULT 'draft' CHECK (
    status IN ('draft', 'planned', 'locked', 'shipped', 'delivered', 'cancelled')
  ),
  notes         text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  created_by    uuid,
  updated_by    uuid,
  UNIQUE (tenant_id, shipment_no)
);

CREATE INDEX idx_shipments_customer_status ON shipping.shipments(customer_id, status);
CREATE INDEX idx_shipments_etd             ON shipping.shipments(etd)
  WHERE status NOT IN ('shipped', 'delivered', 'cancelled');

CREATE TRIGGER trg_shipments_updated_at BEFORE UPDATE ON shipping.shipments
  FOR EACH ROW EXECUTE FUNCTION platform.set_updated_at();

CREATE TABLE shipping.shipment_lines (
  id                  uuid           PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           uuid           NOT NULL,
  shipment_id         uuid           NOT NULL REFERENCES shipping.shipments(id) ON DELETE CASCADE,
  sales_order_line_id uuid           NOT NULL,
  packing_unit_id     uuid,
  ship_qty            numeric(18,4)  NOT NULL,
  status              text           NOT NULL DEFAULT 'allocated'
                                     CHECK (status IN ('allocated', 'loaded', 'shipped')),
  created_at          timestamptz    NOT NULL DEFAULT now()
);

CREATE INDEX idx_shipment_lines_shipment  ON shipping.shipment_lines(shipment_id);
CREATE INDEX idx_shipment_lines_sol       ON shipping.shipment_lines(sales_order_line_id);

CREATE TABLE shipping.containers (
  id              uuid           PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid           NOT NULL,
  container_no    text,
  container_type  text           NOT NULL CHECK (container_type IN ('20GP', '40GP', '40HQ', 'LCL')),
  max_cbm         numeric(12,4),
  max_weight_kg   numeric(12,3),
  status          text           NOT NULL DEFAULT 'open'
                                 CHECK (status IN ('open', 'locked', 'shipped')),
  shipment_id     uuid           REFERENCES shipping.shipments(id) ON DELETE SET NULL,
  created_at      timestamptz    NOT NULL DEFAULT now()
);

CREATE INDEX idx_containers_shipment ON shipping.containers(shipment_id)
  WHERE shipment_id IS NOT NULL;

CREATE TABLE shipping.container_allocations (
  id                   uuid           PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id            uuid           NOT NULL,
  container_id         uuid           NOT NULL REFERENCES shipping.containers(id) ON DELETE CASCADE,
  packing_unit_id      uuid           NOT NULL REFERENCES shipping.packing_units(id) ON DELETE CASCADE,
  allocation_seq       integer,
  allocated_cbm        numeric(12,4),
  allocated_weight_kg  numeric(12,3),
  created_at           timestamptz    NOT NULL DEFAULT now(),
  UNIQUE (container_id, packing_unit_id)
);

CREATE INDEX idx_container_alloc_container ON shipping.container_allocations(container_id, allocation_seq);

-- =========================================================
-- 10) BILLING
-- =========================================================

CREATE TABLE billing.invoices (
  id            uuid           PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     uuid           NOT NULL,
  invoice_no    text           NOT NULL,
  customer_id   uuid           NOT NULL,
  sales_order_id uuid,
  shipment_id   uuid,
  invoice_date  date           NOT NULL,
  due_date      date,
  currency_code text           NOT NULL DEFAULT 'USD',
  total_amount  numeric(18,2)  NOT NULL DEFAULT 0,
  paid_amount   numeric(18,2)  NOT NULL DEFAULT 0,
  status        text           NOT NULL DEFAULT 'draft' CHECK (
    status IN ('draft', 'issued', 'partially_paid', 'paid', 'void')
  ),
  notes         text,
  created_at    timestamptz    NOT NULL DEFAULT now(),
  updated_at    timestamptz    NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, invoice_no)
);

CREATE INDEX idx_invoices_customer_status ON billing.invoices(customer_id, status);

CREATE TRIGGER trg_invoices_updated_at BEFORE UPDATE ON billing.invoices
  FOR EACH ROW EXECUTE FUNCTION platform.set_updated_at();

CREATE TABLE billing.invoice_lines (
  id                  uuid           PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           uuid           NOT NULL,
  invoice_id          uuid           NOT NULL REFERENCES billing.invoices(id) ON DELETE CASCADE,
  line_no             integer        NOT NULL,
  sales_order_line_id uuid,
  description         text           NOT NULL,
  quantity            numeric(18,4)  NOT NULL,
  unit_price          numeric(18,4)  NOT NULL,
  line_amount         numeric(18,2)  NOT NULL,
  created_at          timestamptz    NOT NULL DEFAULT now(),
  UNIQUE (invoice_id, line_no)
);

CREATE INDEX idx_invoice_lines_invoice ON billing.invoice_lines(invoice_id);

CREATE TABLE billing.payment_receipts (
  id             uuid           PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      uuid           NOT NULL,
  receipt_no     text           NOT NULL,
  invoice_id     uuid           NOT NULL REFERENCES billing.invoices(id) ON DELETE CASCADE,
  payment_date   date           NOT NULL,
  amount         numeric(18,2)  NOT NULL,
  payment_method text,
  reference_no   text,
  notes          text,
  created_at     timestamptz    NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, receipt_no)
);

CREATE INDEX idx_payment_receipts_invoice ON billing.payment_receipts(invoice_id);

-- =========================================================
-- 11) DOCS
-- =========================================================

CREATE TABLE docs.documents (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid        NOT NULL,
  storage_key text        NOT NULL,
  file_name   text        NOT NULL,
  mime_type   text,
  file_size   bigint,
  checksum    text,
  category    text        NOT NULL CHECK (
    category IN ('order_import', 'product_image', 'spec_sheet', 'qc_photo', 'shipment_doc', 'other')
  ),
  uploaded_by uuid,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_docs_tenant_category ON docs.documents(tenant_id, category);

CREATE TABLE docs.document_links (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid        NOT NULL,
  document_id uuid        NOT NULL REFERENCES docs.documents(id) ON DELETE CASCADE,
  ref_type    text        NOT NULL CHECK (
    ref_type IN ('product', 'product_version', 'sales_order', 'sales_order_line', 'qc_inspection', 'shipment')
  ),
  ref_id      uuid        NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_doc_links_ref ON docs.document_links(ref_type, ref_id);
CREATE INDEX idx_doc_links_doc ON docs.document_links(document_id);
