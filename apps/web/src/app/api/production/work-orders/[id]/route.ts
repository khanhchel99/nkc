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

  return json(wo);
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
