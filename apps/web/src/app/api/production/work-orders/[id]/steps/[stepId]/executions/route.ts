import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { Prisma } from '@nkc/database';
import { apiHandler, json, getSearchParams, NotFoundError, BadRequestError } from '@/lib/api-helpers';

/**
 * GET /api/production/work-orders/[id]/steps/[stepId]/executions
 * List execution logs for a work order step.
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

  const [executions, total] = await Promise.all([
    prisma.work_order_executions.findMany({
      where,
      skip,
      take: limit,
      orderBy: { started_at: 'desc' },
    }),
    prisma.work_order_executions.count({ where }),
  ]);

  return json({ data: executions, total, page, limit, totalPages: Math.ceil(total / limit) });
});

/**
 * POST /api/production/work-orders/[id]/steps/[stepId]/executions
 * Log an execution record (start, stop, pause).
 */
export const POST = apiHandler(async (request: NextRequest, context) => {
  const user = getAuthUser(request);
  const { id: workOrderId, stepId } = context!.params;
  const body = await request.json();

  const step = await prisma.work_order_steps.findUnique({ where: { id: stepId } });
  if (!step || step.work_order_id !== workOrderId || step.tenant_id !== user.tenantId) {
    throw new NotFoundError('Work order step not found');
  }

  if (!body.startedAt) {
    throw new BadRequestError('startedAt is required');
  }

  const execution = await prisma.work_order_executions.create({
    data: {
      tenant_id: user.tenantId,
      work_order_step_id: stepId,
      operator_user_id: body.operatorUserId || user.userId,
      team_code: body.teamCode,
      started_at: new Date(body.startedAt),
      ended_at: body.endedAt ? new Date(body.endedAt) : null,
      input_qty: body.inputQty ? new Prisma.Decimal(body.inputQty) : null,
      output_qty: body.outputQty ? new Prisma.Decimal(body.outputQty) : null,
      scrap_qty: body.scrapQty ? new Prisma.Decimal(body.scrapQty) : new Prisma.Decimal(0),
      pause_reason: body.pauseReason,
      notes: body.notes,
    },
  });

  // If outputQty provided, update step completed_qty
  if (body.outputQty) {
    await prisma.work_order_steps.update({
      where: { id: stepId },
      data: {
        completed_qty: { increment: new Prisma.Decimal(body.outputQty) },
      },
    });
  }

  // If scrapQty provided, update step scrapped_qty
  if (body.scrapQty && body.scrapQty > 0) {
    await prisma.work_order_steps.update({
      where: { id: stepId },
      data: {
        scrapped_qty: { increment: new Prisma.Decimal(body.scrapQty) },
      },
    });
  }

  return json(execution, 201);
});
