
Object.defineProperty(exports, "__esModule", { value: true });

const {
  Decimal,
  objectEnumValues,
  makeStrictEnum,
  Public,
  getRuntime,
  skip
} = require('./runtime/index-browser.js')


const Prisma = {}

exports.Prisma = Prisma
exports.$Enums = {}

/**
 * Prisma Client JS version: 5.22.0
 * Query Engine version: 605197351a3c8bdd595af2d2a9bc3025bca48ea2
 */
Prisma.prismaVersion = {
  client: "5.22.0",
  engine: "605197351a3c8bdd595af2d2a9bc3025bca48ea2"
}

Prisma.PrismaClientKnownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientKnownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)};
Prisma.PrismaClientUnknownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientUnknownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientRustPanicError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientRustPanicError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientInitializationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientInitializationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientValidationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientValidationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.NotFoundError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`NotFoundError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.Decimal = Decimal

/**
 * Re-export of sql-template-tag
 */
Prisma.sql = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`sqltag is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.empty = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`empty is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.join = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`join is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.raw = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`raw is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.validator = Public.validator

/**
* Extensions
*/
Prisma.getExtensionContext = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.getExtensionContext is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.defineExtension = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.defineExtension is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}

/**
 * Shorthand utilities for JSON filtering
 */
Prisma.DbNull = objectEnumValues.instances.DbNull
Prisma.JsonNull = objectEnumValues.instances.JsonNull
Prisma.AnyNull = objectEnumValues.instances.AnyNull

Prisma.NullTypes = {
  DbNull: objectEnumValues.classes.DbNull,
  JsonNull: objectEnumValues.classes.JsonNull,
  AnyNull: objectEnumValues.classes.AnyNull
}



/**
 * Enums
 */

exports.Prisma.TransactionIsolationLevel = makeStrictEnum({
  ReadUncommitted: 'ReadUncommitted',
  ReadCommitted: 'ReadCommitted',
  RepeatableRead: 'RepeatableRead',
  Serializable: 'Serializable'
});

exports.Prisma.Invoice_linesScalarFieldEnum = {
  id: 'id',
  tenant_id: 'tenant_id',
  invoice_id: 'invoice_id',
  line_no: 'line_no',
  sales_order_line_id: 'sales_order_line_id',
  description: 'description',
  quantity: 'quantity',
  unit_price: 'unit_price',
  line_amount: 'line_amount',
  created_at: 'created_at'
};

exports.Prisma.InvoicesScalarFieldEnum = {
  id: 'id',
  tenant_id: 'tenant_id',
  invoice_no: 'invoice_no',
  customer_id: 'customer_id',
  sales_order_id: 'sales_order_id',
  shipment_id: 'shipment_id',
  invoice_date: 'invoice_date',
  due_date: 'due_date',
  currency_code: 'currency_code',
  total_amount: 'total_amount',
  paid_amount: 'paid_amount',
  status: 'status',
  notes: 'notes',
  created_at: 'created_at',
  updated_at: 'updated_at'
};

exports.Prisma.Payment_receiptsScalarFieldEnum = {
  id: 'id',
  tenant_id: 'tenant_id',
  receipt_no: 'receipt_no',
  invoice_id: 'invoice_id',
  payment_date: 'payment_date',
  amount: 'amount',
  payment_method: 'payment_method',
  reference_no: 'reference_no',
  notes: 'notes',
  created_at: 'created_at'
};

exports.Prisma.Document_linksScalarFieldEnum = {
  id: 'id',
  tenant_id: 'tenant_id',
  document_id: 'document_id',
  ref_type: 'ref_type',
  ref_id: 'ref_id',
  created_at: 'created_at'
};

exports.Prisma.DocumentsScalarFieldEnum = {
  id: 'id',
  tenant_id: 'tenant_id',
  storage_key: 'storage_key',
  file_name: 'file_name',
  mime_type: 'mime_type',
  file_size: 'file_size',
  checksum: 'checksum',
  category: 'category',
  uploaded_by: 'uploaded_by',
  created_at: 'created_at'
};

exports.Prisma.PermissionsScalarFieldEnum = {
  id: 'id',
  code: 'code',
  description: 'description'
};

exports.Prisma.Refresh_sessionsScalarFieldEnum = {
  id: 'id',
  user_id: 'user_id',
  refresh_token_hash: 'refresh_token_hash',
  device_name: 'device_name',
  platform: 'platform',
  ip_address: 'ip_address',
  expires_at: 'expires_at',
  revoked_at: 'revoked_at',
  created_at: 'created_at'
};

exports.Prisma.Role_permissionsScalarFieldEnum = {
  role_id: 'role_id',
  permission_id: 'permission_id'
};

exports.Prisma.RolesScalarFieldEnum = {
  id: 'id',
  tenant_id: 'tenant_id',
  code: 'code',
  name: 'name',
  created_at: 'created_at',
  updated_at: 'updated_at'
};

exports.Prisma.SitesScalarFieldEnum = {
  id: 'id',
  tenant_id: 'tenant_id',
  code: 'code',
  name: 'name',
  site_type: 'site_type',
  address: 'address',
  status: 'status',
  created_at: 'created_at',
  updated_at: 'updated_at'
};

exports.Prisma.TenantsScalarFieldEnum = {
  id: 'id',
  code: 'code',
  name: 'name',
  status: 'status',
  created_at: 'created_at',
  updated_at: 'updated_at'
};

exports.Prisma.User_rolesScalarFieldEnum = {
  id: 'id',
  user_id: 'user_id',
  role_id: 'role_id',
  site_id: 'site_id'
};

exports.Prisma.UsersScalarFieldEnum = {
  id: 'id',
  tenant_id: 'tenant_id',
  email: 'email',
  full_name: 'full_name',
  password_hash: 'password_hash',
  phone: 'phone',
  status: 'status',
  last_login_at: 'last_login_at',
  created_at: 'created_at',
  updated_at: 'updated_at'
};

exports.Prisma.Bin_locationsScalarFieldEnum = {
  id: 'id',
  tenant_id: 'tenant_id',
  warehouse_id: 'warehouse_id',
  bin_code: 'bin_code',
  bin_name: 'bin_name',
  status: 'status',
  created_at: 'created_at'
};

exports.Prisma.Inventory_reservationsScalarFieldEnum = {
  id: 'id',
  tenant_id: 'tenant_id',
  item_id: 'item_id',
  warehouse_id: 'warehouse_id',
  ref_type: 'ref_type',
  ref_id: 'ref_id',
  reserved_qty: 'reserved_qty',
  uom_code: 'uom_code',
  status: 'status',
  created_at: 'created_at',
  released_at: 'released_at'
};

exports.Prisma.LotsScalarFieldEnum = {
  id: 'id',
  tenant_id: 'tenant_id',
  item_id: 'item_id',
  lot_no: 'lot_no',
  received_date: 'received_date',
  expiry_date: 'expiry_date',
  supplier_id: 'supplier_id',
  metadata: 'metadata',
  created_at: 'created_at'
};

exports.Prisma.Stock_balancesScalarFieldEnum = {
  id: 'id',
  tenant_id: 'tenant_id',
  warehouse_id: 'warehouse_id',
  bin_location_id: 'bin_location_id',
  item_id: 'item_id',
  lot_id: 'lot_id',
  on_hand_qty: 'on_hand_qty',
  reserved_qty: 'reserved_qty',
  available_qty: 'available_qty',
  uom_code: 'uom_code',
  updated_at: 'updated_at'
};

exports.Prisma.Stock_transactionsScalarFieldEnum = {
  id: 'id',
  tenant_id: 'tenant_id',
  transaction_no: 'transaction_no',
  transaction_type: 'transaction_type',
  warehouse_id: 'warehouse_id',
  bin_location_id: 'bin_location_id',
  item_id: 'item_id',
  lot_id: 'lot_id',
  quantity: 'quantity',
  uom_code: 'uom_code',
  ref_type: 'ref_type',
  ref_id: 'ref_id',
  reason: 'reason',
  created_at: 'created_at',
  created_by: 'created_by'
};

exports.Prisma.WarehousesScalarFieldEnum = {
  id: 'id',
  tenant_id: 'tenant_id',
  site_id: 'site_id',
  warehouse_code: 'warehouse_code',
  warehouse_name: 'warehouse_name',
  status: 'status',
  created_at: 'created_at',
  updated_at: 'updated_at'
};

exports.Prisma.Bom_headersScalarFieldEnum = {
  id: 'id',
  tenant_id: 'tenant_id',
  product_version_id: 'product_version_id',
  bom_code: 'bom_code',
  status: 'status',
  notes: 'notes',
  created_at: 'created_at',
  updated_at: 'updated_at',
  created_by: 'created_by',
  updated_by: 'updated_by'
};

exports.Prisma.Bom_itemsScalarFieldEnum = {
  id: 'id',
  tenant_id: 'tenant_id',
  bom_header_id: 'bom_header_id',
  parent_component_code: 'parent_component_code',
  line_no: 'line_no',
  component_code: 'component_code',
  component_name: 'component_name',
  component_type: 'component_type',
  item_id: 'item_id',
  material_type: 'material_type',
  qty_per_product: 'qty_per_product',
  uom_code: 'uom_code',
  length_mm: 'length_mm',
  width_mm: 'width_mm',
  thickness_mm: 'thickness_mm',
  edge_banding_rule: 'edge_banding_rule',
  scrap_percent: 'scrap_percent',
  is_optional: 'is_optional',
  production_note: 'production_note',
  metadata: 'metadata',
  created_at: 'created_at',
  updated_at: 'updated_at'
};

exports.Prisma.CustomersScalarFieldEnum = {
  id: 'id',
  tenant_id: 'tenant_id',
  customer_code: 'customer_code',
  customer_name: 'customer_name',
  email: 'email',
  phone: 'phone',
  address: 'address',
  payment_term: 'payment_term',
  currency_code: 'currency_code',
  status: 'status',
  created_at: 'created_at',
  updated_at: 'updated_at'
};

exports.Prisma.ItemsScalarFieldEnum = {
  id: 'id',
  tenant_id: 'tenant_id',
  item_code: 'item_code',
  item_name: 'item_name',
  item_type: 'item_type',
  material_type: 'material_type',
  default_uom_code: 'default_uom_code',
  length_mm: 'length_mm',
  width_mm: 'width_mm',
  thickness_mm: 'thickness_mm',
  spec_text: 'spec_text',
  standard_cost: 'standard_cost',
  supplier_id: 'supplier_id',
  lead_time_days: 'lead_time_days',
  min_stock_qty: 'min_stock_qty',
  max_stock_qty: 'max_stock_qty',
  status: 'status',
  metadata: 'metadata',
  created_at: 'created_at',
  updated_at: 'updated_at',
  created_by: 'created_by',
  updated_by: 'updated_by'
};

exports.Prisma.Packing_specsScalarFieldEnum = {
  id: 'id',
  tenant_id: 'tenant_id',
  product_version_id: 'product_version_id',
  carton_count: 'carton_count',
  carton_length_mm: 'carton_length_mm',
  carton_width_mm: 'carton_width_mm',
  carton_height_mm: 'carton_height_mm',
  net_weight_kg: 'net_weight_kg',
  gross_weight_kg: 'gross_weight_kg',
  cbm: 'cbm',
  is_stackable: 'is_stackable',
  max_stack: 'max_stack',
  loading_rule: 'loading_rule',
  notes: 'notes',
  created_at: 'created_at',
  updated_at: 'updated_at'
};

exports.Prisma.Product_versionsScalarFieldEnum = {
  id: 'id',
  tenant_id: 'tenant_id',
  product_id: 'product_id',
  version_no: 'version_no',
  effective_from: 'effective_from',
  effective_to: 'effective_to',
  status: 'status',
  change_reason: 'change_reason',
  notes: 'notes',
  created_at: 'created_at',
  updated_at: 'updated_at',
  created_by: 'created_by',
  updated_by: 'updated_by'
};

exports.Prisma.ProductsScalarFieldEnum = {
  id: 'id',
  tenant_id: 'tenant_id',
  product_code: 'product_code',
  product_name: 'product_name',
  category: 'category',
  product_type: 'product_type',
  length_mm: 'length_mm',
  width_mm: 'width_mm',
  height_mm: 'height_mm',
  main_material: 'main_material',
  unit_of_measure_code: 'unit_of_measure_code',
  weight_net_kg: 'weight_net_kg',
  weight_gross_kg: 'weight_gross_kg',
  cbm: 'cbm',
  status: 'status',
  current_version_id: 'current_version_id',
  metadata: 'metadata',
  created_at: 'created_at',
  updated_at: 'updated_at',
  created_by: 'created_by',
  updated_by: 'updated_by'
};

exports.Prisma.Routing_stepsScalarFieldEnum = {
  id: 'id',
  tenant_id: 'tenant_id',
  routing_id: 'routing_id',
  step_no: 'step_no',
  step_code: 'step_code',
  step_name: 'step_name',
  work_center_id: 'work_center_id',
  standard_minutes: 'standard_minutes',
  queue_minutes: 'queue_minutes',
  is_qc_required: 'is_qc_required',
  is_mandatory: 'is_mandatory',
  notes: 'notes',
  created_at: 'created_at',
  updated_at: 'updated_at'
};

exports.Prisma.RoutingsScalarFieldEnum = {
  id: 'id',
  tenant_id: 'tenant_id',
  product_version_id: 'product_version_id',
  routing_code: 'routing_code',
  status: 'status',
  created_at: 'created_at',
  updated_at: 'updated_at'
};

exports.Prisma.SuppliersScalarFieldEnum = {
  id: 'id',
  tenant_id: 'tenant_id',
  supplier_code: 'supplier_code',
  supplier_name: 'supplier_name',
  email: 'email',
  phone: 'phone',
  address: 'address',
  lead_time_days: 'lead_time_days',
  currency_code: 'currency_code',
  status: 'status',
  created_at: 'created_at',
  updated_at: 'updated_at'
};

exports.Prisma.UomsScalarFieldEnum = {
  id: 'id',
  tenant_id: 'tenant_id',
  code: 'code',
  name: 'name',
  category: 'category',
  created_at: 'created_at',
  updated_at: 'updated_at'
};

exports.Prisma.Work_centersScalarFieldEnum = {
  id: 'id',
  tenant_id: 'tenant_id',
  site_id: 'site_id',
  code: 'code',
  name: 'name',
  work_center_type: 'work_center_type',
  capacity_minutes_per_day: 'capacity_minutes_per_day',
  status: 'status',
  created_at: 'created_at',
  updated_at: 'updated_at'
};

exports.Prisma.Order_import_jobsScalarFieldEnum = {
  id: 'id',
  tenant_id: 'tenant_id',
  source_type: 'source_type',
  source_ref: 'source_ref',
  file_document_id: 'file_document_id',
  status: 'status',
  total_rows: 'total_rows',
  valid_rows: 'valid_rows',
  error_rows: 'error_rows',
  error_summary: 'error_summary',
  started_at: 'started_at',
  finished_at: 'finished_at',
  created_at: 'created_at',
  updated_at: 'updated_at',
  created_by: 'created_by',
  updated_by: 'updated_by'
};

exports.Prisma.Order_revisionsScalarFieldEnum = {
  id: 'id',
  tenant_id: 'tenant_id',
  sales_order_id: 'sales_order_id',
  revision_no: 'revision_no',
  change_reason: 'change_reason',
  snapshot: 'snapshot',
  created_at: 'created_at',
  created_by: 'created_by'
};

exports.Prisma.Order_validation_errorsScalarFieldEnum = {
  id: 'id',
  tenant_id: 'tenant_id',
  import_job_id: 'import_job_id',
  row_no: 'row_no',
  field_name: 'field_name',
  error_code: 'error_code',
  error_message: 'error_message',
  raw_value: 'raw_value',
  created_at: 'created_at'
};

exports.Prisma.Sales_order_linesScalarFieldEnum = {
  id: 'id',
  tenant_id: 'tenant_id',
  sales_order_id: 'sales_order_id',
  line_no: 'line_no',
  product_id: 'product_id',
  product_version_id: 'product_version_id',
  product_code: 'product_code',
  product_name: 'product_name',
  quantity: 'quantity',
  unit_price: 'unit_price',
  requested_etd: 'requested_etd',
  priority: 'priority',
  custom_spec: 'custom_spec',
  status: 'status',
  notes: 'notes',
  created_at: 'created_at',
  updated_at: 'updated_at'
};

exports.Prisma.Sales_ordersScalarFieldEnum = {
  id: 'id',
  tenant_id: 'tenant_id',
  order_no: 'order_no',
  customer_id: 'customer_id',
  po_number: 'po_number',
  currency_code: 'currency_code',
  order_date: 'order_date',
  requested_etd: 'requested_etd',
  priority: 'priority',
  payment_term: 'payment_term',
  status: 'status',
  revision_no: 'revision_no',
  total_amount: 'total_amount',
  notes: 'notes',
  import_job_id: 'import_job_id',
  created_at: 'created_at',
  updated_at: 'updated_at',
  created_by: 'created_by',
  updated_by: 'updated_by'
};

exports.Prisma.Material_requirement_linesScalarFieldEnum = {
  id: 'id',
  tenant_id: 'tenant_id',
  material_requirement_plan_id: 'material_requirement_plan_id',
  sales_order_line_id: 'sales_order_line_id',
  item_id: 'item_id',
  item_code: 'item_code',
  item_name: 'item_name',
  gross_required_qty: 'gross_required_qty',
  available_qty: 'available_qty',
  reserved_qty: 'reserved_qty',
  shortage_qty: 'shortage_qty',
  uom_code: 'uom_code',
  supplier_id: 'supplier_id',
  need_by_date: 'need_by_date',
  created_at: 'created_at'
};

exports.Prisma.Material_requirement_plansScalarFieldEnum = {
  id: 'id',
  tenant_id: 'tenant_id',
  sales_order_id: 'sales_order_id',
  plan_no: 'plan_no',
  status: 'status',
  planning_date: 'planning_date',
  notes: 'notes',
  created_at: 'created_at',
  updated_at: 'updated_at',
  created_by: 'created_by',
  updated_by: 'updated_by'
};

exports.Prisma.Production_plan_linesScalarFieldEnum = {
  id: 'id',
  tenant_id: 'tenant_id',
  production_plan_id: 'production_plan_id',
  sales_order_line_id: 'sales_order_line_id',
  routing_step_id: 'routing_step_id',
  work_center_id: 'work_center_id',
  planned_qty: 'planned_qty',
  planned_start_at: 'planned_start_at',
  planned_end_at: 'planned_end_at',
  priority_seq: 'priority_seq',
  status: 'status',
  created_at: 'created_at'
};

exports.Prisma.Production_plansScalarFieldEnum = {
  id: 'id',
  tenant_id: 'tenant_id',
  sales_order_id: 'sales_order_id',
  plan_no: 'plan_no',
  status: 'status',
  start_date: 'start_date',
  end_date: 'end_date',
  etd_risk_level: 'etd_risk_level',
  notes: 'notes',
  created_at: 'created_at',
  updated_at: 'updated_at',
  created_by: 'created_by',
  updated_by: 'updated_by'
};

exports.Prisma.Audit_logsScalarFieldEnum = {
  id: 'id',
  actor_user_id: 'actor_user_id',
  actor_email: 'actor_email',
  action: 'action',
  entity_type: 'entity_type',
  entity_id: 'entity_id',
  before_data: 'before_data',
  after_data: 'after_data',
  ip_address: 'ip_address',
  user_agent: 'user_agent',
  created_at: 'created_at'
};

exports.Prisma.Outbox_eventsScalarFieldEnum = {
  id: 'id',
  aggregate_type: 'aggregate_type',
  aggregate_id: 'aggregate_id',
  event_name: 'event_name',
  payload: 'payload',
  status: 'status',
  occurred_at: 'occurred_at',
  published_at: 'published_at',
  retry_count: 'retry_count'
};

exports.Prisma.Downtime_logsScalarFieldEnum = {
  id: 'id',
  tenant_id: 'tenant_id',
  work_order_step_id: 'work_order_step_id',
  work_center_id: 'work_center_id',
  start_at: 'start_at',
  end_at: 'end_at',
  downtime_reason: 'downtime_reason',
  notes: 'notes',
  created_at: 'created_at',
  created_by: 'created_by'
};

exports.Prisma.Scrap_logsScalarFieldEnum = {
  id: 'id',
  tenant_id: 'tenant_id',
  work_order_step_id: 'work_order_step_id',
  quantity: 'quantity',
  scrap_reason: 'scrap_reason',
  defect_code: 'defect_code',
  notes: 'notes',
  created_at: 'created_at',
  created_by: 'created_by'
};

exports.Prisma.Work_order_executionsScalarFieldEnum = {
  id: 'id',
  tenant_id: 'tenant_id',
  work_order_step_id: 'work_order_step_id',
  operator_user_id: 'operator_user_id',
  team_code: 'team_code',
  started_at: 'started_at',
  ended_at: 'ended_at',
  input_qty: 'input_qty',
  output_qty: 'output_qty',
  scrap_qty: 'scrap_qty',
  pause_reason: 'pause_reason',
  notes: 'notes',
  created_at: 'created_at'
};

exports.Prisma.Work_order_stepsScalarFieldEnum = {
  id: 'id',
  tenant_id: 'tenant_id',
  work_order_id: 'work_order_id',
  routing_step_id: 'routing_step_id',
  step_no: 'step_no',
  step_code: 'step_code',
  step_name: 'step_name',
  work_center_id: 'work_center_id',
  planned_qty: 'planned_qty',
  completed_qty: 'completed_qty',
  scrapped_qty: 'scrapped_qty',
  planned_start_at: 'planned_start_at',
  planned_end_at: 'planned_end_at',
  actual_start_at: 'actual_start_at',
  actual_end_at: 'actual_end_at',
  status: 'status',
  is_qc_required: 'is_qc_required',
  created_at: 'created_at',
  updated_at: 'updated_at'
};

exports.Prisma.Work_ordersScalarFieldEnum = {
  id: 'id',
  tenant_id: 'tenant_id',
  work_order_no: 'work_order_no',
  sales_order_id: 'sales_order_id',
  sales_order_line_id: 'sales_order_line_id',
  production_plan_id: 'production_plan_id',
  product_id: 'product_id',
  product_version_id: 'product_version_id',
  routing_id: 'routing_id',
  planned_qty: 'planned_qty',
  completed_qty: 'completed_qty',
  scrapped_qty: 'scrapped_qty',
  planned_start_at: 'planned_start_at',
  planned_end_at: 'planned_end_at',
  actual_start_at: 'actual_start_at',
  actual_end_at: 'actual_end_at',
  status: 'status',
  priority: 'priority',
  created_at: 'created_at',
  updated_at: 'updated_at',
  created_by: 'created_by',
  updated_by: 'updated_by'
};

exports.Prisma.Qc_checklist_itemsScalarFieldEnum = {
  id: 'id',
  tenant_id: 'tenant_id',
  qc_plan_id: 'qc_plan_id',
  line_no: 'line_no',
  item_name: 'item_name',
  check_method: 'check_method',
  expected_value: 'expected_value',
  is_required: 'is_required',
  created_at: 'created_at'
};

exports.Prisma.Qc_defectsScalarFieldEnum = {
  id: 'id',
  tenant_id: 'tenant_id',
  qc_inspection_id: 'qc_inspection_id',
  defect_code: 'defect_code',
  defect_name: 'defect_name',
  severity: 'severity',
  defect_qty: 'defect_qty',
  disposition: 'disposition',
  notes: 'notes',
  created_at: 'created_at'
};

exports.Prisma.Qc_inspectionsScalarFieldEnum = {
  id: 'id',
  tenant_id: 'tenant_id',
  qc_plan_id: 'qc_plan_id',
  inspection_no: 'inspection_no',
  ref_type: 'ref_type',
  ref_id: 'ref_id',
  inspected_qty: 'inspected_qty',
  passed_qty: 'passed_qty',
  failed_qty: 'failed_qty',
  result: 'result',
  notes: 'notes',
  inspected_at: 'inspected_at',
  inspector_user_id: 'inspector_user_id',
  created_at: 'created_at'
};

exports.Prisma.Qc_plansScalarFieldEnum = {
  id: 'id',
  tenant_id: 'tenant_id',
  product_version_id: 'product_version_id',
  routing_step_id: 'routing_step_id',
  qc_plan_code: 'qc_plan_code',
  qc_plan_name: 'qc_plan_name',
  qc_type: 'qc_type',
  status: 'status',
  created_at: 'created_at',
  updated_at: 'updated_at'
};

exports.Prisma.Container_allocationsScalarFieldEnum = {
  id: 'id',
  tenant_id: 'tenant_id',
  container_id: 'container_id',
  packing_unit_id: 'packing_unit_id',
  allocation_seq: 'allocation_seq',
  allocated_cbm: 'allocated_cbm',
  allocated_weight_kg: 'allocated_weight_kg',
  created_at: 'created_at'
};

exports.Prisma.ContainersScalarFieldEnum = {
  id: 'id',
  tenant_id: 'tenant_id',
  container_no: 'container_no',
  container_type: 'container_type',
  max_cbm: 'max_cbm',
  max_weight_kg: 'max_weight_kg',
  status: 'status',
  shipment_id: 'shipment_id',
  created_at: 'created_at'
};

exports.Prisma.Packing_unitsScalarFieldEnum = {
  id: 'id',
  tenant_id: 'tenant_id',
  packing_unit_no: 'packing_unit_no',
  sales_order_line_id: 'sales_order_line_id',
  product_id: 'product_id',
  product_version_id: 'product_version_id',
  quantity: 'quantity',
  carton_no: 'carton_no',
  pallet_no: 'pallet_no',
  length_mm: 'length_mm',
  width_mm: 'width_mm',
  height_mm: 'height_mm',
  gross_weight_kg: 'gross_weight_kg',
  cbm: 'cbm',
  status: 'status',
  created_at: 'created_at'
};

exports.Prisma.Shipment_linesScalarFieldEnum = {
  id: 'id',
  tenant_id: 'tenant_id',
  shipment_id: 'shipment_id',
  sales_order_line_id: 'sales_order_line_id',
  packing_unit_id: 'packing_unit_id',
  ship_qty: 'ship_qty',
  status: 'status',
  created_at: 'created_at'
};

exports.Prisma.ShipmentsScalarFieldEnum = {
  id: 'id',
  tenant_id: 'tenant_id',
  shipment_no: 'shipment_no',
  customer_id: 'customer_id',
  etd: 'etd',
  eta: 'eta',
  priority: 'priority',
  shipment_type: 'shipment_type',
  status: 'status',
  notes: 'notes',
  created_at: 'created_at',
  updated_at: 'updated_at',
  created_by: 'created_by',
  updated_by: 'updated_by'
};

exports.Prisma.SortOrder = {
  asc: 'asc',
  desc: 'desc'
};

exports.Prisma.JsonNullValueInput = {
  JsonNull: Prisma.JsonNull
};

exports.Prisma.NullableJsonNullValueInput = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull
};

exports.Prisma.QueryMode = {
  default: 'default',
  insensitive: 'insensitive'
};

exports.Prisma.NullsOrder = {
  first: 'first',
  last: 'last'
};

exports.Prisma.JsonNullValueFilter = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull,
  AnyNull: Prisma.AnyNull
};


exports.Prisma.ModelName = {
  invoice_lines: 'invoice_lines',
  invoices: 'invoices',
  payment_receipts: 'payment_receipts',
  document_links: 'document_links',
  documents: 'documents',
  permissions: 'permissions',
  refresh_sessions: 'refresh_sessions',
  role_permissions: 'role_permissions',
  roles: 'roles',
  sites: 'sites',
  tenants: 'tenants',
  user_roles: 'user_roles',
  users: 'users',
  bin_locations: 'bin_locations',
  inventory_reservations: 'inventory_reservations',
  lots: 'lots',
  stock_balances: 'stock_balances',
  stock_transactions: 'stock_transactions',
  warehouses: 'warehouses',
  bom_headers: 'bom_headers',
  bom_items: 'bom_items',
  customers: 'customers',
  items: 'items',
  packing_specs: 'packing_specs',
  product_versions: 'product_versions',
  products: 'products',
  routing_steps: 'routing_steps',
  routings: 'routings',
  suppliers: 'suppliers',
  uoms: 'uoms',
  work_centers: 'work_centers',
  order_import_jobs: 'order_import_jobs',
  order_revisions: 'order_revisions',
  order_validation_errors: 'order_validation_errors',
  sales_order_lines: 'sales_order_lines',
  sales_orders: 'sales_orders',
  material_requirement_lines: 'material_requirement_lines',
  material_requirement_plans: 'material_requirement_plans',
  production_plan_lines: 'production_plan_lines',
  production_plans: 'production_plans',
  audit_logs: 'audit_logs',
  outbox_events: 'outbox_events',
  downtime_logs: 'downtime_logs',
  scrap_logs: 'scrap_logs',
  work_order_executions: 'work_order_executions',
  work_order_steps: 'work_order_steps',
  work_orders: 'work_orders',
  qc_checklist_items: 'qc_checklist_items',
  qc_defects: 'qc_defects',
  qc_inspections: 'qc_inspections',
  qc_plans: 'qc_plans',
  container_allocations: 'container_allocations',
  containers: 'containers',
  packing_units: 'packing_units',
  shipment_lines: 'shipment_lines',
  shipments: 'shipments'
};

/**
 * This is a stub Prisma Client that will error at runtime if called.
 */
class PrismaClient {
  constructor() {
    return new Proxy(this, {
      get(target, prop) {
        let message
        const runtime = getRuntime()
        if (runtime.isEdge) {
          message = `PrismaClient is not configured to run in ${runtime.prettyName}. In order to run Prisma Client on edge runtime, either:
- Use Prisma Accelerate: https://pris.ly/d/accelerate
- Use Driver Adapters: https://pris.ly/d/driver-adapters
`;
        } else {
          message = 'PrismaClient is unable to run in this browser environment, or has been bundled for the browser (running in `' + runtime.prettyName + '`).'
        }
        
        message += `
If this is unexpected, please open an issue: https://pris.ly/prisma-prisma-bug-report`

        throw new Error(message)
      }
    })
  }
}

exports.PrismaClient = PrismaClient

Object.assign(exports, Prisma)
