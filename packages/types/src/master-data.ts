// ─── Master Data Domain ────────────────────────────────────────

export interface Product {
  id: string;
  productCode: string;
  productName: string;
  category: string;
  length: number;
  width: number;
  height: number;
  mainMaterial: string;
  weightNet?: number;
  weightGross?: number;
  cbm?: number;
  status: 'active' | 'inactive';
  currentVersionId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductVersion {
  id: string;
  productId: string;
  versionNo: string;
  effectiveFrom: string;
  effectiveTo?: string;
  status: 'draft' | 'approved' | 'archived';
  notes?: string;
  createdAt: string;
}

export interface Component {
  id: string;
  productVersionId: string;
  componentCode: string;
  componentName: string;
  componentType: ComponentType;
  materialType: MaterialType;
  length?: number;
  width?: number;
  thickness?: number;
  specText?: string;
  qtyPerProduct: number;
  edgeBandingRule?: string;
  productionNote?: string;
}

export type ComponentType = 'panel' | 'frame' | 'hardware' | 'packaging' | 'assembly';
export type MaterialType = 'veneer' | 'oak' | 'mdf' | 'metal' | 'accessory' | 'other';

export interface Item {
  id: string;
  itemCode: string;
  itemName: string;
  itemType: 'raw-material' | 'component' | 'accessory' | 'packaging' | 'finished-good';
  unitOfMeasure: string;
  description?: string;
  status: 'active' | 'inactive';
}

export interface BOMHeader {
  id: string;
  productVersionId: string;
  bomCode: string;
  description?: string;
  status: 'draft' | 'approved' | 'archived';
  items: BOMItem[];
}

export interface BOMItem {
  id: string;
  bomHeaderId: string;
  itemId: string;
  quantity: number;
  unitOfMeasure: string;
  wastePercent?: number;
  notes?: string;
  sortOrder: number;
}

export interface Routing {
  id: string;
  productVersionId: string;
  routingCode: string;
  description?: string;
  status: 'draft' | 'approved' | 'archived';
  steps: RoutingStep[];
}

export interface RoutingStep {
  id: string;
  routingId: string;
  stepNo: number;
  workCenterId: string;
  operationName: string;
  setupTimeMinutes?: number;
  cycleTimeMinutes?: number;
  description?: string;
}

export interface WorkCenter {
  id: string;
  siteId: string;
  code: string;
  name: string;
  capacityPerShift?: number;
  status: 'active' | 'inactive';
}

export interface PackingSpec {
  id: string;
  productVersionId: string;
  cartonLength?: number;
  cartonWidth?: number;
  cartonHeight?: number;
  cartonCount: number;
  grossWeight?: number;
  netWeight?: number;
  cbm?: number;
  stackable: boolean;
  maxStack?: number;
  loadingRule?: string;
}

export interface Supplier {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  status: 'active' | 'inactive';
}

export interface Customer {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  contactEmail?: string;
  contactPhone?: string;
  shippingAddress?: string;
  billingAddress?: string;
  paymentTermDays?: number;
  currency?: string;
  status: 'active' | 'inactive';
}

export interface UnitOfMeasure {
  id: string;
  code: string;
  name: string;
}
