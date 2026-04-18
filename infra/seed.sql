-- =============================================================================
-- NKC ERP — Seed Data
-- Run after schema.sql
-- =============================================================================

DO $$
DECLARE
  v_tenant_id       uuid;
  v_site_factory    uuid;
  v_site_warehouse  uuid;
  v_role_admin      uuid;
  v_role_sales      uuid;
  v_role_planner    uuid;
  v_role_prod_mgr   uuid;
  v_role_wh_staff   uuid;
  v_role_qc         uuid;
  v_role_shipping   uuid;
  v_role_billing    uuid;
  v_admin_user_id   uuid;
  v_sales_user_id   uuid;
  v_planner_user_id uuid;
BEGIN

-- =========================================================
-- 1) Tenant
-- =========================================================
INSERT INTO iam.tenants (code, name, status)
VALUES ('NKC', 'NKC Furniture Manufacturing Co.', 'active')
RETURNING id INTO v_tenant_id;

-- =========================================================
-- 2) Sites
-- =========================================================
INSERT INTO iam.sites (tenant_id, code, name, site_type, address, status)
VALUES (v_tenant_id, 'HCM-FACTORY', 'Ho Chi Minh Factory', 'factory',
        '123 Industrial Zone, District 9, Ho Chi Minh City', 'active')
RETURNING id INTO v_site_factory;

INSERT INTO iam.sites (tenant_id, code, name, site_type, address, status)
VALUES (v_tenant_id, 'HCM-WH', 'Ho Chi Minh Warehouse', 'warehouse',
        '456 Logistics Park, District 9, Ho Chi Minh City', 'active')
RETURNING id INTO v_site_warehouse;

-- =========================================================
-- 3) Roles
-- =========================================================
INSERT INTO iam.roles (tenant_id, code, name)
VALUES (v_tenant_id, 'admin', 'System Administrator')
RETURNING id INTO v_role_admin;

INSERT INTO iam.roles (tenant_id, code, name)
VALUES (v_tenant_id, 'sales_manager', 'Sales Manager')
RETURNING id INTO v_role_sales;

INSERT INTO iam.roles (tenant_id, code, name)
VALUES (v_tenant_id, 'planner', 'Production Planner')
RETURNING id INTO v_role_planner;

INSERT INTO iam.roles (tenant_id, code, name)
VALUES (v_tenant_id, 'production_manager', 'Production Manager')
RETURNING id INTO v_role_prod_mgr;

INSERT INTO iam.roles (tenant_id, code, name)
VALUES (v_tenant_id, 'warehouse_staff', 'Warehouse Staff')
RETURNING id INTO v_role_wh_staff;

INSERT INTO iam.roles (tenant_id, code, name)
VALUES (v_tenant_id, 'qc_inspector', 'QC Inspector')
RETURNING id INTO v_role_qc;

INSERT INTO iam.roles (tenant_id, code, name)
VALUES (v_tenant_id, 'shipping_clerk', 'Shipping Clerk')
RETURNING id INTO v_role_shipping;

INSERT INTO iam.roles (tenant_id, code, name)
VALUES (v_tenant_id, 'billing_clerk', 'Billing Clerk')
RETURNING id INTO v_role_billing;

-- =========================================================
-- 4) Permissions
-- =========================================================
INSERT INTO iam.permissions (code, description) VALUES
  -- IAM
  ('iam.users.read',        'View users'),
  ('iam.users.create',      'Create users'),
  ('iam.users.update',      'Update users'),
  ('iam.users.delete',      'Delete users'),
  ('iam.roles.read',        'View roles'),
  ('iam.roles.manage',      'Manage roles and permissions'),
  -- Master Data
  ('master.products.read',   'View products'),
  ('master.products.create', 'Create products'),
  ('master.products.update', 'Update products'),
  ('master.products.delete', 'Delete products'),
  ('master.items.read',      'View items'),
  ('master.items.create',    'Create items'),
  ('master.items.update',    'Update items'),
  ('master.items.delete',    'Delete items'),
  ('master.customers.read',  'View customers'),
  ('master.customers.create','Create customers'),
  ('master.customers.update','Update customers'),
  ('master.suppliers.read',  'View suppliers'),
  ('master.suppliers.create','Create suppliers'),
  ('master.suppliers.update','Update suppliers'),
  -- Orders
  ('orders.sales.read',      'View sales orders'),
  ('orders.sales.create',    'Create sales orders'),
  ('orders.sales.update',    'Update sales orders'),
  ('orders.sales.confirm',   'Confirm sales orders'),
  ('orders.import.manage',   'Manage order imports'),
  -- Planning
  ('planning.mrp.read',      'View MRP'),
  ('planning.mrp.create',    'Create MRP'),
  ('planning.mrp.approve',   'Approve MRP'),
  ('planning.production.read',   'View production plans'),
  ('planning.production.create', 'Create production plans'),
  ('planning.production.approve','Approve production plans'),
  -- Inventory
  ('inventory.stock.read',       'View stock balances'),
  ('inventory.transactions.create','Create stock transactions'),
  ('inventory.adjustments.create','Create stock adjustments'),
  ('inventory.warehouses.manage', 'Manage warehouses'),
  -- Production
  ('production.wo.read',     'View work orders'),
  ('production.wo.create',   'Create work orders'),
  ('production.wo.execute',  'Execute work order steps'),
  ('production.wo.close',    'Close work orders'),
  -- Quality
  ('quality.plans.read',     'View QC plans'),
  ('quality.plans.manage',   'Manage QC plans'),
  ('quality.inspect.read',   'View inspections'),
  ('quality.inspect.create', 'Create inspections'),
  ('quality.inspect.record', 'Record inspection results'),
  -- Shipping
  ('shipping.shipments.read',   'View shipments'),
  ('shipping.shipments.create', 'Create shipments'),
  ('shipping.shipments.manage', 'Manage shipment lifecycle'),
  ('shipping.packing.manage',   'Manage packing units'),
  -- Billing
  ('billing.invoices.read',     'View invoices'),
  ('billing.invoices.create',   'Create invoices'),
  ('billing.invoices.manage',   'Manage invoice lifecycle'),
  ('billing.payments.record',   'Record payments'),
  -- Documents
  ('docs.upload',    'Upload documents'),
  ('docs.read',      'View documents'),
  ('docs.delete',    'Delete documents');

-- =========================================================
-- 5) Admin role gets ALL permissions
-- =========================================================
INSERT INTO iam.role_permissions (role_id, permission_id)
SELECT v_role_admin, p.id FROM iam.permissions p;

-- Sales Manager permissions
INSERT INTO iam.role_permissions (role_id, permission_id)
SELECT v_role_sales, p.id FROM iam.permissions p
WHERE p.code LIKE 'orders.%'
   OR p.code LIKE 'master.customers.%'
   OR p.code LIKE 'master.products.read'
   OR p.code LIKE 'shipping.shipments.read'
   OR p.code = 'docs.read'
   OR p.code = 'docs.upload';

-- Planner permissions
INSERT INTO iam.role_permissions (role_id, permission_id)
SELECT v_role_planner, p.id FROM iam.permissions p
WHERE p.code LIKE 'planning.%'
   OR p.code LIKE 'orders.sales.read'
   OR p.code LIKE 'master.products.read'
   OR p.code LIKE 'master.items.read'
   OR p.code LIKE 'inventory.stock.read';

-- Production Manager permissions
INSERT INTO iam.role_permissions (role_id, permission_id)
SELECT v_role_prod_mgr, p.id FROM iam.permissions p
WHERE p.code LIKE 'production.%'
   OR p.code LIKE 'planning.production.read'
   OR p.code LIKE 'inventory.stock.read'
   OR p.code LIKE 'inventory.transactions.create'
   OR p.code LIKE 'quality.inspect.read';

-- Warehouse Staff permissions
INSERT INTO iam.role_permissions (role_id, permission_id)
SELECT v_role_wh_staff, p.id FROM iam.permissions p
WHERE p.code LIKE 'inventory.%'
   OR p.code = 'docs.read';

-- QC Inspector permissions
INSERT INTO iam.role_permissions (role_id, permission_id)
SELECT v_role_qc, p.id FROM iam.permissions p
WHERE p.code LIKE 'quality.%'
   OR p.code = 'production.wo.read'
   OR p.code = 'docs.read'
   OR p.code = 'docs.upload';

-- Shipping Clerk permissions
INSERT INTO iam.role_permissions (role_id, permission_id)
SELECT v_role_shipping, p.id FROM iam.permissions p
WHERE p.code LIKE 'shipping.%'
   OR p.code = 'orders.sales.read'
   OR p.code = 'inventory.stock.read'
   OR p.code = 'docs.read'
   OR p.code = 'docs.upload';

-- Billing Clerk permissions
INSERT INTO iam.role_permissions (role_id, permission_id)
SELECT v_role_billing, p.id FROM iam.permissions p
WHERE p.code LIKE 'billing.%'
   OR p.code = 'orders.sales.read'
   OR p.code = 'shipping.shipments.read'
   OR p.code = 'docs.read';

-- =========================================================
-- 6) Users
-- =========================================================
INSERT INTO iam.users (tenant_id, email, full_name, password_hash, phone, status)
VALUES (v_tenant_id, 'admin@nkc.com', 'System Admin',
        crypt('admin123', gen_salt('bf', 10)), '+84-900-000-001', 'active')
RETURNING id INTO v_admin_user_id;

INSERT INTO iam.users (tenant_id, email, full_name, password_hash, phone, status)
VALUES (v_tenant_id, 'sales@nkc.com', 'Nguyen Van Sales',
        crypt('sales123', gen_salt('bf', 10)), '+84-900-000-002', 'active')
RETURNING id INTO v_sales_user_id;

INSERT INTO iam.users (tenant_id, email, full_name, password_hash, phone, status)
VALUES (v_tenant_id, 'planner@nkc.com', 'Tran Thi Planner',
        crypt('planner123', gen_salt('bf', 10)), '+84-900-000-003', 'active')
RETURNING id INTO v_planner_user_id;

-- =========================================================
-- 7) User → Role assignments (global)
-- =========================================================
INSERT INTO iam.user_roles (user_id, role_id, site_id) VALUES
  (v_admin_user_id,   v_role_admin,    NULL),
  (v_sales_user_id,   v_role_sales,    NULL),
  (v_planner_user_id, v_role_planner,  NULL);

-- Planner also has production read at factory site
INSERT INTO iam.user_roles (user_id, role_id, site_id) VALUES
  (v_planner_user_id, v_role_prod_mgr, v_site_factory);

-- =========================================================
-- 8) Units of Measure
-- =========================================================
INSERT INTO master.uoms (tenant_id, code, name, category) VALUES
  (v_tenant_id, 'PCS', 'Pieces',          'count'),
  (v_tenant_id, 'SET', 'Sets',            'count'),
  (v_tenant_id, 'PAIR','Pairs',           'count'),
  (v_tenant_id, 'MM',  'Millimeters',     'length'),
  (v_tenant_id, 'M',   'Meters',          'length'),
  (v_tenant_id, 'M2',  'Square Meters',   'area'),
  (v_tenant_id, 'M3',  'Cubic Meters',    'volume'),
  (v_tenant_id, 'L',   'Liters',          'volume'),
  (v_tenant_id, 'G',   'Grams',           'weight'),
  (v_tenant_id, 'KG',  'Kilograms',       'weight'),
  (v_tenant_id, 'HR',  'Hours',           'time'),
  (v_tenant_id, 'MIN', 'Minutes',         'time');

-- =========================================================
-- 9) Sample Customers
-- =========================================================
INSERT INTO master.customers (tenant_id, customer_code, customer_name, email, phone, address, payment_term, currency_code, status) VALUES
  (v_tenant_id, 'CUST-001', 'IKEA Trading',       'buyer@ikea.com',      '+46-8-000-0001', 'Delft, Netherlands',   'NET60', 'EUR', 'active'),
  (v_tenant_id, 'CUST-002', 'Ashley Furniture',    'procurement@ashley.com','+1-608-000-0001','Arcadia, WI, USA',    'NET45', 'USD', 'active'),
  (v_tenant_id, 'CUST-003', 'Muji Global',         'sourcing@muji.com',   '+81-3-000-0001',  'Tokyo, Japan',        'NET30', 'USD', 'active'),
  (v_tenant_id, 'CUST-004', 'Wayfair LLC',         'vendor@wayfair.com',  '+1-617-000-0001', 'Boston, MA, USA',     'NET30', 'USD', 'active');

-- =========================================================
-- 10) Sample Suppliers
-- =========================================================
INSERT INTO master.suppliers (tenant_id, supplier_code, supplier_name, email, phone, address, lead_time_days, currency_code, status) VALUES
  (v_tenant_id, 'SUP-001', 'Binh Duong Timber Co.',  'sales@bdtimber.vn',   '+84-274-000-001', 'Binh Duong, Vietnam',  7,  'VND', 'active'),
  (v_tenant_id, 'SUP-002', 'Dongguan Hardware Ltd.',  'info@dghardware.cn',  '+86-769-000-001', 'Dongguan, China',      14, 'USD', 'active'),
  (v_tenant_id, 'SUP-003', 'Saigon Paint & Chemical', 'order@sgpaint.vn',   '+84-28-000-0001', 'Ho Chi Minh, Vietnam', 3,  'VND', 'active'),
  (v_tenant_id, 'SUP-004', 'Viet Carton Packaging',   'sales@vietcarton.vn','+84-61-000-0001', 'Dong Nai, Vietnam',    5,  'VND', 'active');

-- =========================================================
-- 11) Sample Work Centers
-- =========================================================
INSERT INTO master.work_centers (tenant_id, site_id, code, name, work_center_type, capacity_minutes_per_day, status) VALUES
  (v_tenant_id, v_site_factory, 'WC-CUT-01',  'CNC Cutting Line 1',   'cutting',   480, 'active'),
  (v_tenant_id, v_site_factory, 'WC-CUT-02',  'Manual Cutting',       'cutting',   480, 'active'),
  (v_tenant_id, v_site_factory, 'WC-CNC-01',  'CNC Router 1',         'cnc',       480, 'active'),
  (v_tenant_id, v_site_factory, 'WC-SAND-01', 'Sanding Line 1',       'sanding',   480, 'active'),
  (v_tenant_id, v_site_factory, 'WC-PAINT-01','Paint Booth 1',        'painting',  480, 'active'),
  (v_tenant_id, v_site_factory, 'WC-PAINT-02','Paint Booth 2',        'painting',  480, 'active'),
  (v_tenant_id, v_site_factory, 'WC-ASM-01',  'Assembly Line 1',      'assembly',  480, 'active'),
  (v_tenant_id, v_site_factory, 'WC-ASM-02',  'Assembly Line 2',      'assembly',  480, 'active'),
  (v_tenant_id, v_site_factory, 'WC-QC-01',   'QC Station 1',         'qc',        480, 'active'),
  (v_tenant_id, v_site_factory, 'WC-PACK-01', 'Packing Station 1',    'packing',   480, 'active');

-- =========================================================
-- 12) Sample Warehouse + Bins
-- =========================================================
INSERT INTO inventory.warehouses (tenant_id, site_id, warehouse_code, warehouse_name, status)
VALUES (v_tenant_id, v_site_warehouse, 'WH-MAIN', 'Main Warehouse', 'active');

INSERT INTO inventory.warehouses (tenant_id, site_id, warehouse_code, warehouse_name, status)
VALUES (v_tenant_id, v_site_factory, 'WH-PROD', 'Production Floor Store', 'active');

INSERT INTO inventory.bin_locations (tenant_id, warehouse_id, bin_code, bin_name, status)
SELECT v_tenant_id, w.id, bin.code, bin.name, 'active'
FROM inventory.warehouses w
CROSS JOIN (VALUES
  ('A-01-01', 'Aisle A, Rack 1, Level 1'),
  ('A-01-02', 'Aisle A, Rack 1, Level 2'),
  ('A-02-01', 'Aisle A, Rack 2, Level 1'),
  ('B-01-01', 'Aisle B, Rack 1, Level 1'),
  ('B-01-02', 'Aisle B, Rack 1, Level 2'),
  ('RECV',    'Receiving Area'),
  ('SHIP',    'Shipping Area')
) AS bin(code, name)
WHERE w.warehouse_code = 'WH-MAIN';

-- =========================================================
-- 13) Sample Products (Furniture)
-- =========================================================
INSERT INTO master.products (tenant_id, product_code, product_name, category, product_type,
  length_mm, width_mm, height_mm, main_material, unit_of_measure_code, weight_net_kg, weight_gross_kg, cbm, status)
VALUES
  (v_tenant_id, 'TBL-DIN-001', 'Dining Table - Oak Classic',      'tables',  'standard',
   1800, 900, 750,  'solid_wood', 'PCS', 45.0, 52.0, 0.35, 'active'),
  (v_tenant_id, 'CHR-DIN-001', 'Dining Chair - Oak Classic',      'chairs',  'standard',
   450,  520, 900,  'solid_wood', 'PCS', 8.5,  10.0, 0.08, 'active'),
  (v_tenant_id, 'CAB-TV-001',  'TV Console Cabinet - Walnut',     'cabinets','standard',
   1600, 450, 550,  'veneer',     'PCS', 38.0, 45.0, 0.28, 'active'),
  (v_tenant_id, 'BED-QN-001',  'Queen Bed Frame - Modern',        'beds',    'standard',
   2100, 1600, 350, 'mdf',        'PCS', 55.0, 65.0, 0.52, 'active'),
  (v_tenant_id, 'SHF-BK-001',  'Bookshelf - 5 Tier',             'shelves', 'standard',
   800,  300, 1800, 'plywood',    'PCS', 25.0, 30.0, 0.18, 'active');

-- =========================================================
-- 14) Product Versions + BOM + Routing for TBL-DIN-001
-- =========================================================
-- (done as sub-block so we can reference product IDs)

DECLARE
  v_prod_table    uuid;
  v_prod_chair    uuid;
  v_pv_table_v1   uuid;
  v_pv_chair_v1   uuid;
  v_bom_table     uuid;
  v_routing_table uuid;
BEGIN
  SELECT id INTO v_prod_table FROM master.products WHERE product_code = 'TBL-DIN-001' AND tenant_id = v_tenant_id;
  SELECT id INTO v_prod_chair FROM master.products WHERE product_code = 'CHR-DIN-001' AND tenant_id = v_tenant_id;

  -- Product Versions
  INSERT INTO master.product_versions (tenant_id, product_id, version_no, effective_from, status, change_reason)
  VALUES (v_tenant_id, v_prod_table, 'V1.0', '2026-01-01', 'approved', 'Initial release')
  RETURNING id INTO v_pv_table_v1;

  INSERT INTO master.product_versions (tenant_id, product_id, version_no, effective_from, status, change_reason)
  VALUES (v_tenant_id, v_prod_chair, 'V1.0', '2026-01-01', 'approved', 'Initial release')
  RETURNING id INTO v_pv_chair_v1;

  -- Link current version
  UPDATE master.products SET current_version_id = v_pv_table_v1 WHERE id = v_prod_table;
  UPDATE master.products SET current_version_id = v_pv_chair_v1 WHERE id = v_prod_chair;

  -- BOM for Dining Table V1.0
  INSERT INTO master.bom_headers (tenant_id, product_version_id, bom_code, status)
  VALUES (v_tenant_id, v_pv_table_v1, 'BOM-TBL-DIN-001-V1', 'approved')
  RETURNING id INTO v_bom_table;

  INSERT INTO master.bom_items (tenant_id, bom_header_id, line_no, component_code, component_name, component_type, qty_per_product, uom_code, length_mm, width_mm, thickness_mm, scrap_percent) VALUES
    (v_tenant_id, v_bom_table, 10, 'TBL-TOP-OAK',   'Table Top - Oak Solid',     'panel',    1, 'PCS', 1800, 900, 30,  5.0),
    (v_tenant_id, v_bom_table, 20, 'TBL-LEG-OAK',   'Table Leg - Oak Turned',    'frame',    4, 'PCS', 720,  70,  70,  3.0),
    (v_tenant_id, v_bom_table, 30, 'TBL-APRON-OAK', 'Apron Rail - Oak',          'frame',    4, 'PCS', 800,  100, 25,  3.0),
    (v_tenant_id, v_bom_table, 40, 'HW-BOLT-M8',    'Connector Bolt M8x60',      'hardware', 8, 'PCS', NULL, NULL, NULL, 0),
    (v_tenant_id, v_bom_table, 50, 'HW-NUT-M8',     'T-Nut M8',                  'hardware', 8, 'PCS', NULL, NULL, NULL, 0),
    (v_tenant_id, v_bom_table, 60, 'MAT-GLUE-PU',   'PU Wood Glue',              'material', 0.25, 'KG', NULL, NULL, NULL, 10.0),
    (v_tenant_id, v_bom_table, 70, 'MAT-SAND-180',  'Sandpaper 180 Grit',        'material', 2, 'PCS', NULL, NULL, NULL, 0),
    (v_tenant_id, v_bom_table, 80, 'MAT-LACQUER',   'Clear Lacquer',             'material', 0.5, 'L',  NULL, NULL, NULL, 15.0),
    (v_tenant_id, v_bom_table, 90, 'PKG-CARTON-L',  'Carton Box - Large',        'packaging', 1, 'PCS', NULL, NULL, NULL, 0),
    (v_tenant_id, v_bom_table, 100,'PKG-FOAM-CRN',  'Foam Corner Protector',     'packaging', 8, 'PCS', NULL, NULL, NULL, 0);

  -- Routing for Dining Table V1.0
  INSERT INTO master.routings (tenant_id, product_version_id, routing_code, status)
  VALUES (v_tenant_id, v_pv_table_v1, 'RTG-TBL-DIN-001-V1', 'approved')
  RETURNING id INTO v_routing_table;

  INSERT INTO master.routing_steps (tenant_id, routing_id, step_no, step_code, step_name, work_center_id, standard_minutes, queue_minutes, is_qc_required, is_mandatory) VALUES
    (v_tenant_id, v_routing_table, 10, 'CUT',   'Cutting',          (SELECT id FROM master.work_centers WHERE code = 'WC-CUT-01' AND tenant_id = v_tenant_id), 45, 15, false, true),
    (v_tenant_id, v_routing_table, 20, 'CNC',   'CNC Shaping',      (SELECT id FROM master.work_centers WHERE code = 'WC-CNC-01' AND tenant_id = v_tenant_id), 30, 10, false, true),
    (v_tenant_id, v_routing_table, 30, 'SAND',  'Sanding',          (SELECT id FROM master.work_centers WHERE code = 'WC-SAND-01' AND tenant_id = v_tenant_id), 25, 10, false, true),
    (v_tenant_id, v_routing_table, 40, 'PAINT', 'Painting/Lacquer', (SELECT id FROM master.work_centers WHERE code = 'WC-PAINT-01' AND tenant_id = v_tenant_id), 60, 120, false, true),
    (v_tenant_id, v_routing_table, 50, 'ASM',   'Assembly',         (SELECT id FROM master.work_centers WHERE code = 'WC-ASM-01' AND tenant_id = v_tenant_id), 40, 10, false, true),
    (v_tenant_id, v_routing_table, 60, 'QC',    'Final QC',         (SELECT id FROM master.work_centers WHERE code = 'WC-QC-01' AND tenant_id = v_tenant_id), 20, 5,  true,  true),
    (v_tenant_id, v_routing_table, 70, 'PACK',  'Packing',          (SELECT id FROM master.work_centers WHERE code = 'WC-PACK-01' AND tenant_id = v_tenant_id), 15, 5,  false, true);

  -- Packing Spec for Dining Table V1.0
  INSERT INTO master.packing_specs (tenant_id, product_version_id, carton_count, carton_length_mm, carton_width_mm, carton_height_mm, net_weight_kg, gross_weight_kg, cbm, is_stackable, max_stack, loading_rule)
  VALUES (v_tenant_id, v_pv_table_v1, 2, 1860, 460, 200, 45.0, 52.0, 0.35, true, 3, 'Top carton is legs, bottom is table top. Do not stack more than 3 high.');
END;

-- =========================================================
-- 15) Sample Items (raw materials / accessories)
-- =========================================================
INSERT INTO master.items (tenant_id, item_code, item_name, item_type, material_type, default_uom_code, spec_text, standard_cost, lead_time_days, min_stock_qty, status) VALUES
  (v_tenant_id, 'RM-OAK-30',    'Oak Lumber 30mm',          'raw_material',  'solid_wood', 'M3',  '30mm thick, kiln dried, grade A',  2500.00, 14, 5.0,  'active'),
  (v_tenant_id, 'RM-OAK-25',    'Oak Lumber 25mm',          'raw_material',  'solid_wood', 'M3',  '25mm thick, kiln dried, grade A',  2200.00, 14, 3.0,  'active'),
  (v_tenant_id, 'RM-WALNUT-18', 'Walnut Veneer 0.6mm',      'raw_material',  'veneer',     'M2',  '0.6mm thickness, grade AA',        18.00,   21, 100.0,'active'),
  (v_tenant_id, 'RM-MDF-18',    'MDF Board 18mm',           'raw_material',  'mdf',        'PCS', '18mm, 2440x1220mm, E1 grade',      35.00,   7,  50.0, 'active'),
  (v_tenant_id, 'RM-PLY-15',    'Plywood 15mm',             'raw_material',  'plywood',    'PCS', '15mm, 2440x1220mm, marine grade',  42.00,   7,  30.0, 'active'),
  (v_tenant_id, 'ACC-BOLT-M8',  'Connector Bolt M8x60',     'accessory',     'metal',      'PCS', 'Zinc-plated, hex head',            0.35,    14, 500,  'active'),
  (v_tenant_id, 'ACC-TNUT-M8',  'T-Nut M8',                 'accessory',     'metal',      'PCS', 'Zinc-plated, 4-prong',             0.20,    14, 500,  'active'),
  (v_tenant_id, 'ACC-HINGE-35', 'Concealed Hinge 35mm',     'accessory',     'metal',      'PCS', '35mm cup, soft-close',             1.50,    14, 200,  'active'),
  (v_tenant_id, 'ACC-SLIDE-45', 'Drawer Slide 450mm',       'accessory',     'metal',      'PAIR','Full extension, soft-close',       8.50,    14, 100,  'active'),
  (v_tenant_id, 'CON-GLUE-PU',  'PU Wood Glue',             'consumable',    'glue',       'KG',  'Polyurethane, waterproof D4',      12.00,   3,  20.0, 'active'),
  (v_tenant_id, 'CON-SAND-180', 'Sandpaper 180 Grit',       'consumable',    NULL,         'PCS', 'Aluminum oxide, 230x280mm',        0.50,    3,  200,  'active'),
  (v_tenant_id, 'CON-LACQUER',  'Clear Lacquer - Matte',    'consumable',    'paint',      'L',   'PU lacquer, 20% sheen',            25.00,   3,  50.0, 'active'),
  (v_tenant_id, 'PKG-CTN-L',    'Carton Box Large',         'packaging',     'carton',     'PCS', '1900x500x250mm, double wall',      3.50,    5,  100,  'active'),
  (v_tenant_id, 'PKG-CTN-M',    'Carton Box Medium',        'packaging',     'carton',     'PCS', '1000x600x200mm, double wall',      2.80,    5,  100,  'active'),
  (v_tenant_id, 'PKG-FOAM-C',   'Foam Corner Protector',    'packaging',     'foam',       'PCS', 'EPE foam, 100x100x20mm',           0.15,    5,  500,  'active');

RAISE NOTICE 'Seed data inserted successfully. Tenant ID: %', v_tenant_id;

END $$;
