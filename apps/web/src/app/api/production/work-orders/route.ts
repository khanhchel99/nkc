import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { generateOrderNumber } from '@nkc/utils';
import { apiHandler, json, getSearchParams, BadRequestError, NotFoundError } from '@/lib/api-helpers';

/**
 * GET /api/production/work-orders
 * List work orders with optional filters.
 */
export const GET = apiHandler(async (request: NextRequest) => {
  const user = getAuthUser(request);
  const params = getSearchParams(request);
  const page = params.getNumber('page', 1);
  const limit = params.getNumber('limit', 20);
  const skip = (page - 1) * limit;
  const status = params.get('status');
  const salesOrderId = params.get('salesOrderId');

  const where = {
    tenant_id: user.tenantId,
    ...(status && { status }),
    ...(salesOrderId && { sales_order_id: salesOrderId }),
  };

  const [orders, total] = await Promise.all([
    prisma.work_orders.findMany({
      where,
      include: { work_order_steps: { orderBy: { step_no: 'asc' } } },
      skip,
      take: limit,
      orderBy: { created_at: 'desc' },
    }),
    prisma.work_orders.count({ where }),
  ]);

  return json({ data: orders, total, page, limit, totalPages: Math.ceil(total / limit) });
});

/**
 * POST /api/production/work-orders
 * Generate work orders from a production plan.
 * Creates one WO per production plan line group (by sales_order_line_id),
 * with steps derived from the routing.
 */
export const POST = apiHandler(async (request: NextRequest) => {
  const user = getAuthUser(request);
  const body = await request.json();

  if (!body.productionPlanId) {
    throw new BadRequestError('productionPlanId is required');
  }

  const plan = await prisma.production_plans.findFirst({
    where: { id: body.productionPlanId, tenant_id: user.tenantId },
    include: { production_plan_lines: true },
  });
  if (!plan) throw new NotFoundError('Production plan not found');
  if (plan.status !== 'confirmed') {
    throw new BadRequestError('Production plan must be confirmed');
  }

  // Fetch the sales order for reference
  const salesOrder = await prisma.sales_orders.findFirst({
    where: { id: plan.sales_order_id, tenant_id: user.tenantId },
    include: { sales_order_lines: true },
  });
  if (!salesOrder) throw new NotFoundError('Sales order not found');

  // Group plan lines by sales_order_line_id → one WO per SO line
  const lineGroups = new Map<string, typeof plan.production_plan_lines>();
  for (const line of plan.production_plan_lines) {
    const key = line.sales_order_line_id;
    if (!lineGroups.has(key)) lineGroups.set(key, []);
    lineGroups.get(key)!.push(line);
  }

  // Pre-fetch routing steps for plan lines that reference them
  const routingStepIds = plan.production_plan_lines
    .map((l) => l.routing_step_id)
    .filter((id): id is string => id !== null);

  const routingSteps = routingStepIds.length
    ? await prisma.routing_steps.findMany({ where: { id: { in: routingStepIds } } })
    : [];
  const routingStepMap = new Map(routingSteps.map((rs) => [rs.id, rs]));

  // Count existing WOs for numbering
  const existingCount = await prisma.work_orders.count({
    where: { tenant_id: user.tenantId },
  });

  const createdOrders = [];
  let seq = existingCount;

  for (const [soLineId, planLines] of lineGroups) {
    const soLine = salesOrder.sales_order_lines.find((l) => l.id === soLineId);
    if (!soLine) continue;

    seq++;
    const workOrderNo = generateOrderNumber('WO', seq);

    // Sort plan lines by priority_seq to create ordered steps
    const sortedLines = [...planLines].sort(
      (a, b) => (a.priority_seq ?? 0) - (b.priority_seq ?? 0),
    );

    // Determine routing_id from the first routing step (if any)
    const firstRoutingStep = sortedLines[0]?.routing_step_id
      ? routingStepMap.get(sortedLines[0].routing_step_id)
      : null;

    const wo = await prisma.work_orders.create({
      data: {
        tenant_id: user.tenantId,
        work_order_no: workOrderNo,
        sales_order_id: salesOrder.id,
        sales_order_line_id: soLineId,
        production_plan_id: plan.id,
        product_id: soLine.product_id,
        product_version_id: soLine.product_version_id,
        routing_id: firstRoutingStep?.routing_id,
        planned_qty: soLine.quantity,
        planned_start_at: sortedLines[0]?.planned_start_at,
        planned_end_at: sortedLines[sortedLines.length - 1]?.planned_end_at,
        status: 'released',
        priority: body.priority || 'normal',
        created_by: user.userId,
        work_order_steps: {
          create: sortedLines.map((pl, idx) => {
            const rs = pl.routing_step_id ? routingStepMap.get(pl.routing_step_id) : null;
            return {
              tenant_id: user.tenantId,
              routing_step_id: pl.routing_step_id,
              step_no: idx + 1,
              step_code: rs?.step_code || `STEP-${idx + 1}`,
              step_name: rs?.step_name || `Step ${idx + 1}`,
              work_center_id: pl.work_center_id,
              planned_qty: soLine.quantity,
              planned_start_at: pl.planned_start_at,
              planned_end_at: pl.planned_end_at,
              status: 'pending',
              is_qc_required: rs?.is_qc_required ?? false,
            };
          }),
        },
      },
      include: { work_order_steps: { orderBy: { step_no: 'asc' } } },
    });

    createdOrders.push(wo);
  }

  return json(createdOrders, 201);
});
