// ─── Planning Domain ──────────────────────────────────────────

export type PlanStatus = 'draft' | 'approved' | 'in-progress' | 'completed' | 'cancelled';

export interface MaterialRequirementPlan {
  id: string;
  salesOrderId: string;
  tenantId: string;
  status: PlanStatus;
  lines: MaterialRequirementLine[];
  createdAt: string;
  approvedAt?: string;
  approvedBy?: string;
}

export interface MaterialRequirementLine {
  id: string;
  planId: string;
  itemId: string;
  itemCode: string;
  itemName: string;
  requiredQty: number;
  availableQty: number;
  reservedQty: number;
  shortageQty: number;
  unitOfMeasure: string;
}

export interface ProductionPlan {
  id: string;
  salesOrderId: string;
  tenantId: string;
  status: PlanStatus;
  lines: ProductionPlanLine[];
  createdAt: string;
  approvedAt?: string;
}

export interface ProductionPlanLine {
  id: string;
  planId: string;
  productId: string;
  productCode: string;
  quantity: number;
  routingId: string;
  plannedStartDate: string;
  plannedEndDate: string;
  priority: number;
}

export interface CapacitySnapshot {
  id: string;
  workCenterId: string;
  date: string;
  availableMinutes: number;
  allocatedMinutes: number;
  remainingMinutes: number;
}

export interface SchedulingRun {
  id: string;
  tenantId: string;
  triggeredBy: string;
  startedAt: string;
  completedAt?: string;
  status: 'running' | 'completed' | 'failed';
  salesOrderIds: string[];
}

export interface ETDRisk {
  id: string;
  salesOrderLineId: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  reason: string;
  estimatedDelay?: number; // days
}
