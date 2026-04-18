// ─── Inventory Domain ─────────────────────────────────────────

export type StockType = 'raw-material' | 'wip' | 'finished-good';

export interface InventoryItem {
  id: string;
  itemId: string;
  itemCode: string;
  warehouseId: string;
  binLocationId?: string;
  stockType: StockType;
  lotId?: string;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  unitOfMeasure: string;
}

export type TransactionType = 'receive' | 'issue' | 'transfer' | 'adjust' | 'reserve' | 'unreserve';

export interface StockTransaction {
  id: string;
  itemId: string;
  warehouseId: string;
  transactionType: TransactionType;
  quantity: number;
  referenceType?: string;
  referenceId?: string;
  performedBy: string;
  performedAt: string;
  notes?: string;
}

export interface Warehouse {
  id: string;
  siteId: string;
  code: string;
  name: string;
  type: 'raw-material' | 'wip' | 'finished-good' | 'general';
  status: 'active' | 'inactive';
}

export interface BinLocation {
  id: string;
  warehouseId: string;
  code: string;
  zone?: string;
  row?: string;
  shelf?: string;
}

export interface InventoryReservation {
  id: string;
  itemId: string;
  warehouseId: string;
  quantity: number;
  referenceType: 'sales-order' | 'work-order';
  referenceId: string;
  status: 'active' | 'released' | 'cancelled';
  createdAt: string;
}

export interface Lot {
  id: string;
  lotNumber: string;
  itemId: string;
  supplierId?: string;
  receivedDate: string;
  expiryDate?: string;
  quantity: number;
}
