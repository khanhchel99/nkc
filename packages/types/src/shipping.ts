// ─── Shipping Domain ──────────────────────────────────────────

export type ShipmentStatus =
  | 'draft'
  | 'planned'
  | 'locked'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export type ShipmentPriority = 'low' | 'normal' | 'high' | 'urgent';
export type ShipmentType = 'sea' | 'air' | 'land';
export type PackingUnitStatus = 'packed' | 'allocated' | 'shipped';
export type ContainerType = '20GP' | '40GP' | '40HQ' | 'LCL';
export type ContainerStatus = 'open' | 'locked' | 'shipped';

export interface Shipment {
  id: string;
  tenantId: string;
  shipmentNo: string;
  customerId: string;
  etd?: string;
  eta?: string;
  priority: ShipmentPriority;
  shipmentType: ShipmentType;
  status: ShipmentStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ShipmentLine {
  id: string;
  shipmentId: string;
  salesOrderLineId: string;
  packingUnitId?: string;
  shipQty: number;
  status: string;
}

export interface PackingUnit {
  id: string;
  tenantId: string;
  packingUnitNo: string;
  salesOrderLineId: string;
  productId: string;
  productVersionId?: string;
  quantity: number;
  cartonNo?: string;
  palletNo?: string;
  lengthMm?: number;
  widthMm?: number;
  heightMm?: number;
  grossWeightKg?: number;
  cbm?: number;
  status: PackingUnitStatus;
}

export interface Container {
  id: string;
  tenantId: string;
  containerNo?: string;
  containerType: ContainerType;
  maxCbm?: number;
  maxWeightKg?: number;
  status: ContainerStatus;
  shipmentId?: string;
}

export interface ContainerAllocation {
  id: string;
  containerId: string;
  packingUnitId: string;
  allocationSeq?: number;
  allocatedCbm?: number;
  allocatedWeightKg?: number;
}
