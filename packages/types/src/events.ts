// ─── Domain Events ────────────────────────────────────────────

export interface DomainEvent<T = unknown> {
  eventId: string;
  eventName: string;
  aggregateId: string;
  aggregateType: string;
  occurredAt: string;
  tenantId: string;
  payload: T;
}

// Event names
export const EventNames = {
  ORDER_IMPORTED: 'order.imported',
  ORDER_CONFIRMED: 'order.confirmed',
  ORDER_REVISED: 'order.revised',
  PLAN_GENERATED: 'plan.generated',
  MATERIAL_SHORTAGE_DETECTED: 'material.shortage-detected',
  WORK_ORDER_RELEASED: 'work-order.released',
  PRODUCTION_STEP_STARTED: 'production.step-started',
  PRODUCTION_STEP_COMPLETED: 'production.step-completed',
  QC_FAILED: 'qc.failed',
  QC_PASSED: 'qc.passed',
  PACKING_COMPLETED: 'packing.completed',
  SHIPMENT_LOCKED: 'shipment.locked',
  SHIPMENT_SHIPPED: 'shipment.shipped',
  INVOICE_CREATED: 'invoice.created',
  PAYMENT_RECEIVED: 'payment.received',
} as const;

export type EventName = (typeof EventNames)[keyof typeof EventNames];
