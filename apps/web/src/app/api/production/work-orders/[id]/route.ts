import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { apiHandler, json, NotFoundError } from '@/lib/api-helpers';

/**
 * GET /api/production/work-orders/[id]
 * Get work order detail with steps, executions, scrap/downtime logs.
 */
export const GET = apiHandler(async (request: NextRequest, context) => {
  const user = getAuthUser(request);
  const { id } = context!.params;

  const wo = await prisma.work_orders.findUnique({
    where: { id },
    include: {
      work_order_steps: {
        orderBy: { step_no: 'asc' },
        include: {
          work_order_executions: { orderBy: { started_at: 'desc' } },
          scrap_logs: { orderBy: { created_at: 'desc' } },
          downtime_logs: { orderBy: { start_at: 'desc' } },
        },
      },
    },
  });

  if (!wo || wo.tenant_id !== user.tenantId) {
    throw new NotFoundError('Work order not found');
  }

  // Look up product name
  const product = await prisma.products.findUnique({
    where: { id: wo.product_id },
    select: { product_name: true, product_code: true },
  });

  return json({
    id: wo.id,
    workOrderId: wo.id,
    wo_number: wo.work_order_no,
    woNumber: wo.work_order_no,
    productId: wo.product_id,
    productName: product?.product_name ?? wo.product_id,
    productCode: product?.product_code,
    status: wo.status,
    priority: wo.priority,
    planned_qty: Number(wo.planned_qty),
    completed_qty: Number(wo.completed_qty),
    scrapped_qty: Number(wo.scrapped_qty),
    plannedStartAt: wo.planned_start_at,
    plannedEndAt: wo.planned_end_at,
    actualStartAt: wo.actual_start_at,
    actualEndAt: wo.actual_end_at,
    work_order_steps: wo.work_order_steps.map((s) => ({
      id: s.id,
      step_no: s.step_no,
      stepNo: s.step_no,
      step_name: s.step_name,
      operation_name: s.step_name, // alias for mobile app compatibility
      stepCode: s.step_code,
      status: s.status,
      planned_qty: Number(s.planned_qty),
      completed_qty: Number(s.completed_qty),
      scrapped_qty: Number(s.scrapped_qty),
      plannedStartAt: s.planned_start_at,
      plannedEndAt: s.planned_end_at,
      actualStartAt: s.actual_start_at,
      actualEndAt: s.actual_end_at,
      work_order_executions: s.work_order_executions,
      scrap_logs: s.scrap_logs,
      downtime_logs: s.downtime_logs,
    })),
  });
});

/**
 * PATCH /api/production/work-orders/[id]
 * Update work order status or priority.
 */
export const PATCH = apiHandler(async (request: NextRequest, context) => {
  const user = getAuthUser(request);
  const { id } = context!.params;
  const body = await request.json();

  const wo = await prisma.work_orders.findUnique({ where: { id } });
  if (!wo || wo.tenant_id !== user.tenantId) {
    throw new NotFoundError('Work order not found');
  }

  const data: Record<string, unknown> = { updated_by: user.userId };
  if (body.status) data.status = body.status;
  if (body.priority) data.priority = body.priority;

  const updated = await prisma.work_orders.update({
    where: { id },
    data,
    include: { work_order_steps: { orderBy: { step_no: 'asc' } } },
  });

  return json(updated);
});
