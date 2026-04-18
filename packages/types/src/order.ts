// ─── Order Intake Domain ───────────────────────────────────────

export type OrderImportStatus = 'pending' | 'parsing' | 'validated' | 'failed' | 'completed';

export interface OrderImportJob {
  id: string;
  tenantId: string;
  fileName: string;
  fileUrl: string;
  status: OrderImportStatus;
  totalRows?: number;
  validRows?: number;
  errorRows?: number;
  salesOrderId?: string;
  createdBy: string;
  createdAt: string;
  completedAt?: string;
}

export interface ImportedFile {
  id: string;
  importJobId: string;
  originalFileName: string;
  storagePath: string;
  mimeType: string;
  sizeBytes: number;
}

export interface ParsedOrderLine {
  id: string;
  importJobId: string;
  rowNumber: number;
  productCode: string;
  quantity: number;
  unitPrice?: number;
  requestedETD?: string;
  priority?: OrderPriority;
  note?: string;
  isValid: boolean;
  validationErrors?: string[];
}

export type OrderPriority = 'normal' | 'high' | 'urgent';

export type SalesOrderStatus = 'draft' | 'pending-review' | 'confirmed' | 'revised' | 'cancelled';

export interface SalesOrder {
  id: string;
  tenantId: string;
  orderNumber: string;
  customerId: string;
  customerCode: string;
  poNumber?: string;
  orderDate: string;
  requestedETD: string;
  currency: string;
  paymentTermDays?: number;
  status: SalesOrderStatus;
  totalAmount?: number;
  lines: SalesOrderLine[];
  revisionNumber: number;
  createdBy: string;
  createdAt: string;
  confirmedAt?: string;
  confirmedBy?: string;
}

export interface SalesOrderLine {
  id: string;
  salesOrderId: string;
  lineNumber: number;
  productId: string;
  productCode: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  requestedETD?: string;
  priority: OrderPriority;
  note?: string;
}

export interface OrderRevision {
  id: string;
  salesOrderId: string;
  revisionNumber: number;
  changeDescription: string;
  changedBy: string;
  changedAt: string;
  previousSnapshot: string; // JSON snapshot
}

export interface OrderValidationError {
  id: string;
  importJobId: string;
  rowNumber: number;
  field: string;
  message: string;
  severity: 'error' | 'warning';
}
