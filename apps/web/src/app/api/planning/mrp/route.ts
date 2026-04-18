import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { generateOrderNumber } from '@nkc/utils';
import { apiHandler, json, getSearchParams, BadRequestError, NotFoundError } from '@/lib/api-helpers';
import { Prisma } from '@nkc/database';

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
    prisma.material_requirement_plans.findMany({
      where,
      include: { material_requirement_lines: true },
      skip,
      take: limit,
      orderBy: { created_at: 'desc' },
    }),
    prisma.material_requirement_plans.count({ where }),
  ]);

  return json({ data: plans, total, page, limit, totalPages: Math.ceil(total / limit) });
});

/**
 * POST /api/planning/mrp
 * Run MRP for a confirmed sales order:
 * 1. Fetch SO lines with product versions + BOMs
 * 2. Explode BOM: for each SO line × BOM item → compute gross required qty
 * 3. Check inventory stock_balances for each item
 * 4. Calculate shortage = gross_required - available - already_reserved
 * 5. Create material_requirement_plan + lines
 */
export const POST = apiHandler(async (request: NextRequest) => {
  const user = getAuthUser(request);
  const body = await request.json();

  if (!body.salesOrderId) throw new BadRequestError('salesOrderId is required');

  // Fetch the sales order with lines
  const salesOrder = await prisma.sales_orders.findFirst({
    where: { id: body.salesOrderId, tenant_id: user.tenantId },
    include: { sales_order_lines: true },
  });
  if (!salesOrder) throw new NotFoundError('Sales order not found');
  if (salesOrder.status !== 'confirmed') {
    throw new BadRequestError('Sales order must be confirmed before running MRP');
  }

  // For each SO line, find the product's current version BOM
  const mrpLines: Array<{
    salesOrderLineId: string;
    itemId: string;
    itemCode: string;
    itemName: string;
    grossRequiredQty: Prisma.Decimal;
    uomCode: string;
    supplierId: string | null;
    needByDate: Date | null;
  }> = [];

  for (const soLine of salesOrder.sales_order_lines) {
    // Get product with its current version
    const product = await prisma.products.findFirst({
      where: { id: soLine.product_id, tenant_id: user.tenantId },
    });
    if (!product?.current_version_id) continue;

    // Get BOM for the current version
    const bomHeader = await prisma.bom_headers.findFirst({
      where: {
        product_version_id: product.current_version_id,
        tenant_id: user.tenantId,
        status: 'active',
      },
      include: { bom_items: { orderBy: { line_no: 'asc' } } },
    });
    if (!bomHeader) continue;

    // Explode BOM: multiply each component qty by SO line qty
    for (const bomItem of bomHeader.bom_items) {
      if (!bomItem.item_id) continue; // Skip components without linked items

      const grossQty = bomItem.qty_per_product
        .mul(soLine.quantity)
        .mul(new Prisma.Decimal(1).add(bomItem.scrap_percent.div(100)));

      const needByDate = soLine.requested_etd
        ? soLine.requested_etd
        : salesOrder.requested_etd;

      // Check if this item already exists in mrpLines (from a different SO line for same item)
      const existingIdx = mrpLines.findIndex(
        (l) => l.salesOrderLineId === soLine.id && l.itemId === bomItem.item_id,
      );

      if (existingIdx >= 0) {
        mrpLines[existingIdx].grossRequiredQty = mrpLines[existingIdx].grossRequiredQty.add(grossQty);
      } else {
        mrpLines.push({
          salesOrderLineId: soLine.id,
          itemId: bomItem.item_id,
          itemCode: bomItem.component_code,
          itemName: bomItem.component_name,
          grossRequiredQty: grossQty,
          uomCode: bomItem.uom_code,
          supplierId: null,
          needByDate: needByDate,
        });
      }
    }
  }

  if (mrpLines.length === 0) {
    throw new BadRequestError('No BOM data found for this sales order. Ensure products have active BOMs.');
  }

  // Fetch available stock for all items in one query
  const itemIds = [...new Set(mrpLines.map((l) => l.itemId))];
  const stockBalances = await prisma.stock_balances.findMany({
    where: { tenant_id: user.tenantId, item_id: { in: itemIds } },
  });

  // Aggregate available stock per item across all warehouses
  const stockByItem = new Map<string, Prisma.Decimal>();
  for (const bal of stockBalances) {
    const current = stockByItem.get(bal.item_id) ?? new Prisma.Decimal(0);
    stockByItem.set(bal.item_id, current.add(bal.on_hand_qty.sub(bal.reserved_qty)));
  }

  // Look up default supplier for each item
  const items = await prisma.items.findMany({
    where: { id: { in: itemIds }, tenant_id: user.tenantId },
  });
  const itemSupplierMap = new Map(items.map((i) => [i.id, i.supplier_id]));

  // Create MRP plan + lines
  const count = await prisma.material_requirement_plans.count({ where: { tenant_id: user.tenantId } });
  const planNo = generateOrderNumber('MRP', count + 1);

  const mrpPlan = await prisma.material_requirement_plans.create({
    data: {
      tenant_id: user.tenantId,
      sales_order_id: body.salesOrderId,
      plan_no: planNo,
      status: 'draft',
      planning_date: new Date(),
      notes: body.notes,
      created_by: user.userId,
      material_requirement_lines: {
        create: mrpLines.map((line) => {
          const available = stockByItem.get(line.itemId) ?? new Prisma.Decimal(0);
          const shortage = Prisma.Decimal.max(
            line.grossRequiredQty.sub(available),
            new Prisma.Decimal(0),
          );

          return {
            tenant_id: user.tenantId,
            sales_order_line_id: line.salesOrderLineId,
            item_id: line.itemId,
            item_code: line.itemCode,
            item_name: line.itemName,
            gross_required_qty: line.grossRequiredQty,
            available_qty: Prisma.Decimal.max(available, new Prisma.Decimal(0)),
            reserved_qty: new Prisma.Decimal(0),
            shortage_qty: shortage,
            uom_code: line.uomCode,
            supplier_id: itemSupplierMap.get(line.itemId) ?? line.supplierId,
            need_by_date: line.needByDate,
          };
        }),
      },
    },
    include: { material_requirement_lines: true },
  });

  return json(mrpPlan, 201);
});
