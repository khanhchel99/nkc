import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { generateOrderNumber } from '@nkc/utils';
import { apiHandler, json, getSearchParams, BadRequestError, NotFoundError } from '@/lib/api-helpers';

export const GET = apiHandler(async (request: NextRequest) => {
  const user = getAuthUser(request);
  const params = getSearchParams(request);
  const page = params.getNumber('page', 1);
  const limit = params.getNumber('limit', 20);
  const skip = (page - 1) * limit;
  const status = params.get('status');

  const where = {
    tenant_id: user.tenantId,
    ...(status && { status }),
  };

  const [plans, total] = await Promise.all([
    prisma.production_plans.findMany({
      where,
      include: { production_plan_lines: true },
      skip,
      take: limit,
      orderBy: { created_at: 'desc' },
    }),
    prisma.production_plans.count({ where }),
  ]);

  return json({ data: plans, total, page, limit, totalPages: Math.ceil(total / limit) });
});

/**
 * POST /api/planning/production-plans
 * Generate a production plan from a confirmed sales order.
 * Creates plan lines from SO lines × routing steps, with capacity scheduling.
 */
export const POST = apiHandler(async (request: NextRequest) => {
  const user = getAuthUser(request);
  const body = await request.json();

  if (!body.salesOrderId) throw new BadRequestError('salesOrderId is required');

  // Fetch SO with lines
  const salesOrder = await prisma.sales_orders.findFirst({
    where: { id: body.salesOrderId, tenant_id: user.tenantId },
    include: { sales_order_lines: true },
  });
  if (!salesOrder) throw new NotFoundError('Sales order not found');
  if (salesOrder.status !== 'confirmed') {
    throw new BadRequestError('Sales order must be confirmed before creating production plan');
  }

  // Build plan lines from SO lines + product routing
  const planLines: Array<{
    salesOrderLineId: string;
    routingStepId: string | null;
    workCenterId: string | null;
    plannedQty: number;
    plannedStartAt: Date | null;
    plannedEndAt: Date | null;
    prioritySeq: number;
  }> = [];

  let earliestStart: Date | null = null;
  let latestEnd: Date | null = null;
  let maxRisk: 'low' | 'medium' | 'high' = 'low';

  for (const soLine of salesOrder.sales_order_lines) {
    const product = await prisma.products.findFirst({
      where: { id: soLine.product_id, tenant_id: user.tenantId },
    });
    if (!product?.current_version_id) {
      // No version → single plan line without routing
      planLines.push({
        salesOrderLineId: soLine.id,
        routingStepId: null,
        workCenterId: null,
        plannedQty: Number(soLine.quantity),
        plannedStartAt: body.startDate ? new Date(body.startDate) : new Date(),
        plannedEndAt: soLine.requested_etd ?? salesOrder.requested_etd ?? null,
        prioritySeq: planLines.length + 1,
      });
      continue;
    }

    // Get routing for the current version
    const routing = await prisma.routings.findFirst({
      where: {
        product_version_id: product.current_version_id,
        tenant_id: user.tenantId,
        status: 'active',
      },
      include: { routing_steps: { orderBy: { step_no: 'asc' } } },
    });

    if (!routing || routing.routing_steps.length === 0) {
      planLines.push({
        salesOrderLineId: soLine.id,
        routingStepId: null,
        workCenterId: null,
        plannedQty: Number(soLine.quantity),
        plannedStartAt: body.startDate ? new Date(body.startDate) : new Date(),
        plannedEndAt: soLine.requested_etd ?? salesOrder.requested_etd ?? null,
        prioritySeq: planLines.length + 1,
      });
      continue;
    }

    // Schedule each routing step sequentially
    let stepStart = body.startDate ? new Date(body.startDate) : new Date();
    const qty = Number(soLine.quantity);

    for (const step of routing.routing_steps) {
      const totalMinutes = (Number(step.standard_minutes) + Number(step.queue_minutes)) * qty;
      const stepEnd = new Date(stepStart.getTime() + totalMinutes * 60_000);

      // Check work center capacity
      if (step.work_center_id) {
        const wc = await prisma.work_centers.findFirst({
          where: { id: step.work_center_id, tenant_id: user.tenantId },
        });
        if (wc?.capacity_minutes_per_day && totalMinutes > wc.capacity_minutes_per_day) {
          // Exceeds daily capacity → flag risk
          if (maxRisk === 'low') maxRisk = 'medium';
          if (totalMinutes > wc.capacity_minutes_per_day * 3) maxRisk = 'high';
        }
      }

      planLines.push({
        salesOrderLineId: soLine.id,
        routingStepId: step.id,
        workCenterId: step.work_center_id,
        plannedQty: qty,
        plannedStartAt: stepStart,
        plannedEndAt: stepEnd,
        prioritySeq: planLines.length + 1,
      });

      if (!earliestStart || stepStart < earliestStart) earliestStart = stepStart;
      if (!latestEnd || stepEnd > latestEnd) latestEnd = stepEnd;

      stepStart = stepEnd; // Next step starts when this one ends
    }

    // ETD risk assessment
    const etd = soLine.requested_etd ?? salesOrder.requested_etd;
    if (etd && latestEnd && latestEnd > etd) {
      maxRisk = 'high';
    }
  }

  const count = await prisma.production_plans.count({ where: { tenant_id: user.tenantId } });
  const planNo = generateOrderNumber('PP', count + 1);

  const plan = await prisma.production_plans.create({
    data: {
      tenant_id: user.tenantId,
      sales_order_id: body.salesOrderId,
      plan_no: planNo,
      status: 'draft',
      start_date: earliestStart ?? (body.startDate ? new Date(body.startDate) : new Date()),
      end_date: latestEnd,
      etd_risk_level: maxRisk,
      notes: body.notes,
      created_by: user.userId,
      production_plan_lines: {
        create: planLines.map((line) => ({
          tenant_id: user.tenantId,
          sales_order_line_id: line.salesOrderLineId,
          routing_step_id: line.routingStepId,
          work_center_id: line.workCenterId,
          planned_qty: line.plannedQty,
          planned_start_at: line.plannedStartAt,
          planned_end_at: line.plannedEndAt,
          priority_seq: line.prioritySeq,
        })),
      },
    },
    include: { production_plan_lines: true },
  });

  return json(plan, 201);
});
