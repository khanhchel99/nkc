// ─── Billing Domain ───────────────────────────────────────────

export type InvoiceStatus =
  | 'draft'
  | 'issued'
  | 'partially_paid'
  | 'paid'
  | 'void';

export interface Invoice {
  id: string;
  tenantId: string;
  invoiceNo: string;
  customerId: string;
  salesOrderId?: string;
  shipmentId?: string;
  invoiceDate: string;
  dueDate?: string;
  currencyCode: string;
  totalAmount: number;
  paidAmount: number;
  status: InvoiceStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  lines?: InvoiceLine[];
}

export interface InvoiceLine {
  id: string;
  invoiceId: string;
  lineNo: number;
  salesOrderLineId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  lineAmount: number;
}

export interface PaymentReceipt {
  id: string;
  tenantId: string;
  receiptNo: string;
  invoiceId: string;
  paymentDate: string;
  amount: number;
  paymentMethod?: string;
  referenceNo?: string;
  notes?: string;
  createdAt: string;
}
