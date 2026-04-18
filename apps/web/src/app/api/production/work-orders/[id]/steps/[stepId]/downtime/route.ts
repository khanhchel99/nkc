import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { apiHandler, json, getSearchParams, NotFoundError, BadRequestError } from '@/lib/api-helpers';

/**
 * GET /api/production/work-orders/[id]/steps/[stepId]/downtime
 * List downtime logs for a work order step.
 */
export const GET = apiHandler(async (request: NextRequest, context) => {
  const user = getAuthUser(request);
  const { id: workOrderId, stepId } = context!.params;
  const params = getSearchParams(request);
  const page = params.getNumber('page', 1);
  const limit = params.getNumber('limit', 20);
  const skip = (page - 1) * limit;

  const step = await prisma.work_order_steps.findUnique({ where: { id: stepId } });
  if (!step || step.work_order_id !== workOrderId || step.tenant_id !== user.tenantId) {
    throw new NotFoundError('Work order step not found');
  }

  const where = { work_order_step_id: stepId, tenant_id: user.tenantId };

  const [logs, total] = await Promise.all([
    prisma.downtime_logs.findMany({ where, skip, take: limit, orderBy: { start_at: 'desc' } }),
    prisma.downtime_logs.count({ where }),
  ]);

  return json({ data: logs, total, page, limit, totalPages: Math.ceil(total / limit) });
});

/**
 * POST /api/production/work-orders/[id]/steps/[stepId]/downtime
 * Record a downtime entry for a work order step.
 */
export const POST = apiHandler(async (request: NextRequest, context) => {
  const user = getAuthUser(request);
  const { id: workOrderId, stepId } = context!.params;
  const body = await request.json();

  const step = await prisma.work_order_steps.findUnique({ where: { id: stepId } });
  if (!step || step.work_order_id !== workOrderId || step.tenant_id !== user.tenantId) {
    throw new NotFoundError('Work order step not found');
  }

  if (!body.startAt) {
    throw new BadRequestError('startAt is required');
  }
  if (!body.downtimeReason) {
    throw new BadRequestError('downtimeReason is required');
  }

  const log = await prisma.downtime_logs.create({
    data: {
      tenant_id: user.tenantId,
      work_order_step_id: stepId,
      work_center_id: step.work_center_id,
      start_at: new Date(body.startAt),
      end_at: body.endAt ? new Date(body.endAt) : null,
      downtime_reason: body.downtimeReason,
      notes: body.notes,
      created_by: user.userId,
    },
  });

  return json(log, 201);
});
