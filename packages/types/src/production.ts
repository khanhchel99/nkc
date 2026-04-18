// ─── Production Domain ────────────────────────────────────────

export type WorkOrderStatus =
  | 'draft'
  | 'released'
  | 'in-progress'
  | 'completed'
  | 'on-hold'
  | 'cancelled';

export interface WorkOrder {
  id: string;
  tenantId: string;
  workOrderNumber: string;
  salesOrderId: string;
  salesOrderLineId: string;
  productId: string;
  productCode: string;
  routingId: string;
  quantity: number;
  completedQuantity: number;
  scrapQuantity: number;
  status: WorkOrderStatus;
  priority: number;
  plannedStartDate: string;
  plannedEndDate: string;
  actualStartDate?: string;
  actualEndDate?: string;
  steps: WorkOrderStep[];
  createdAt: string;
}

export type StepStatus = 'pending' | 'in-progress' | 'completed' | 'skipped';

export interface WorkOrderStep {
  id: string;
  workOrderId: string;
  routingStepId: string;
  stepNo: number;
  workCenterId: string;
  operationName: string;
  status: StepStatus;
  assignedTeamId?: string;
  assignedUserId?: string;
  startedAt?: string;
  completedAt?: string;
  outputQuantity?: number;
  scrapQuantity?: number;
}

export interface WorkOrderExecution {
  id: string;
  workOrderStepId: string;
  operatorId: string;
  action: 'start' | 'pause' | 'resume' | 'complete';
  timestamp: string;
  quantity?: number;
  notes?: string;
}

export interface DowntimeLog {
  id: string;
  workOrderStepId: string;
  workCenterId: string;
  reason: string;
  startedAt: string;
  endedAt?: string;
  durationMinutes?: number;
}

export interface ScrapLog {
  id: string;
  workOrderId: string;
  workOrderStepId?: string;
  quantity: number;
  reason: string;
  reportedBy: string;
  reportedAt: string;
}

export interface ReworkLog {
  id: string;
  workOrderId: string;
  originalStepId: string;
  reworkStepId?: string;
  quantity: number;
  reason: string;
  status: 'pending' | 'in-progress' | 'completed';
  createdAt: string;
}

export interface Shift {
  id: string;
  siteId: string;
  name: string;
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
}
