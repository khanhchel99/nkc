import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { Prisma } from '@nkc/database';
import { apiHandler, json, NotFoundError, BadRequestError } from '@/lib/api-helpers';

const VALID_TRANSITIONS: Record<string, string[]> = {
  pending: ['ready', 'cancelled'],
  ready: ['in_progress', 'cancelled'],
  in_progress: ['paused', 'completed', 'cancelled'],
  paused: ['in_progress', 'cancelled'],
  completed: [],
  skipped: [],
  cancelled: [],
};

/**
 * PATCH /api/production/work-orders/[id]/steps/[stepId]
 * Progress a work order step: change status, record qty.
 */
export const PATCH = apiHandler(async (request: NextRequest, context) => {
  const user = getAuthUser(request);
  const { id: workOrderId, stepId } = context!.params;
  const body = await request.json();

  const step = await prisma.work_order_steps.findUnique({
    where: { id: stepId },
    include: { work_orders: true },
  });

  if (!step || step.work_order_id !== workOrderId || step.tenant_id !== user.tenantId) {
    throw new NotFoundError('Work order step not found');
  }

  const data: Record<string, unknown> = {};

  // Status transition
  if (body.status) {
    const allowed = VALID_TRANSITIONS[step.status] || [];
    if (!allowed.includes(body.status)) {
      throw new BadRequestError(
        `Cannot transition from '${step.status}' to '${body.status}'. Allowed: ${allowed.join(', ') || 'none'}`,
      );
    }
    data.status = body.status;

    if (body.status === 'in_progress' && !step.actual_start_at) {
      data.actual_start_at = new Date();
      // Also mark WO as in_progress if still released
      if (step.work_orders.status === 'released') {
        await prisma.work_orders.update({
          where: { id: workOrderId },
          data: { status: 'in_progress', actual_start_at: new Date(), updated_by: user.userId },
        });
      }
    }

    if (body.status === 'completed') {
      data.actual_end_at = new Date();
    }
  }

  // Quantity updates
  if (body.completedQty !== undefined) {
    data.completed_qty = new Prisma.Decimal(body.completedQty);
  }
  if (body.scrappedQty !== undefined) {
    data.scrapped_qty = new Prisma.Decimal(body.scrappedQty);
  }

  const updated = await prisma.work_order_steps.update({
    where: { id: stepId },
    data,
  });

  // Check if all steps completed → mark WO completed
  if (body.status === 'completed') {
    const allSteps = await prisma.work_order_steps.findMany({
      where: { work_order_id: workOrderId },
    });
    const allDone = allSteps.every(
      (s) => s.status === 'completed' || s.status === 'skipped' || s.status === 'cancelled',
    );
    if (allDone) {
      // Sum completed/scrapped across steps
      const totalCompleted = allSteps.reduce(
        (sum, s) => sum.add(s.completed_qty),
        new Prisma.Decimal(0),
      );
      const totalScrapped = allSteps.reduce(
        (sum, s) => sum.add(s.scrapped_qty),
        new Prisma.Decimal(0),
      );
      await prisma.work_orders.update({
        where: { id: workOrderId },
        data: {
          status: 'completed',
          actual_end_at: new Date(),
          completed_qty: totalCompleted,
          scrapped_qty: totalScrapped,
          updated_by: user.userId,
        },
      });
    }
  }

  return json(updated);
});
