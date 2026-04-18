import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { Prisma } from '@nkc/database';
import { apiHandler, json, getSearchParams, NotFoundError, BadRequestError } from '@/lib/api-helpers';

/**
 * GET /api/production/work-orders/[id]/steps/[stepId]/scrap
 * List scrap logs for a work order step.
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
    prisma.scrap_logs.findMany({ where, skip, take: limit, orderBy: { created_at: 'desc' } }),
    prisma.scrap_logs.count({ where }),
  ]);

  return json({ data: logs, total, page, limit, totalPages: Math.ceil(total / limit) });
});

/**
 * POST /api/production/work-orders/[id]/steps/[stepId]/scrap
 * Record a scrap entry for a work order step.
 */
export const POST = apiHandler(async (request: NextRequest, context) => {
  const user = getAuthUser(request);
  const { id: workOrderId, stepId } = context!.params;
  const body = await request.json();

  const step = await prisma.work_order_steps.findUnique({ where: { id: stepId } });
  if (!step || step.work_order_id !== workOrderId || step.tenant_id !== user.tenantId) {
    throw new NotFoundError('Work order step not found');
  }

  if (!body.quantity || body.quantity <= 0) {
    throw new BadRequestError('quantity must be a positive number');
  }
  if (!body.scrapReason) {
    throw new BadRequestError('scrapReason is required');
  }

  const qty = new Prisma.Decimal(body.quantity);

  const log = await prisma.scrap_logs.create({
    data: {
      tenant_id: user.tenantId,
      work_order_step_id: stepId,
      quantity: qty,
      scrap_reason: body.scrapReason,
      defect_code: body.defectCode,
      notes: body.notes,
      created_by: user.userId,
    },
  });

  // Update step scrapped_qty
  await prisma.work_order_steps.update({
    where: { id: stepId },
    data: { scrapped_qty: { increment: qty } },
  });

  // Update WO scrapped_qty
  await prisma.work_orders.update({
    where: { id: workOrderId },
    data: { scrapped_qty: { increment: qty }, updated_by: user.userId },
  });

  return json(log, 201);
});
