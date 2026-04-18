import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { generateOrderNumber } from '@nkc/utils';
import { Prisma } from '@nkc/database';
import { apiHandler, json, NotFoundError, BadRequestError } from '@/lib/api-helpers';

/**
 * GET /api/production/work-orders/[id]/materials
 * List material issuances (stock_transactions with ref_type='work_order') for a WO.
 */
export const GET = apiHandler(async (request: NextRequest, context) => {
  const user = getAuthUser(request);
  const { id: workOrderId } = context!.params;

  const wo = await prisma.work_orders.findUnique({ where: { id: workOrderId } });
  if (!wo || wo.tenant_id !== user.tenantId) {
    throw new NotFoundError('Work order not found');
  }

  const transactions = await prisma.stock_transactions.findMany({
    where: {
      tenant_id: user.tenantId,
      ref_type: 'work_order',
      ref_id: workOrderId,
    },
    orderBy: { created_at: 'desc' },
  });

  return json({ data: transactions });
});

/**
 * POST /api/production/work-orders/[id]/materials
 * Issue materials from inventory to a work order.
 * Creates an 'issue' stock transaction and updates stock balance.
 */
export const POST = apiHandler(async (request: NextRequest, context) => {
  const user = getAuthUser(request);
  const { id: workOrderId } = context!.params;
  const body = await request.json();

  const wo = await prisma.work_orders.findUnique({ where: { id: workOrderId } });
  if (!wo || wo.tenant_id !== user.tenantId) {
    throw new NotFoundError('Work order not found');
  }
  if (wo.status === 'completed' || wo.status === 'cancelled') {
    throw new BadRequestError(`Cannot issue materials to a ${wo.status} work order`);
  }

  if (!body.warehouseId || !body.itemId || !body.quantity || !body.uomCode) {
    throw new BadRequestError('warehouseId, itemId, quantity, and uomCode are required');
  }
  if (body.quantity <= 0) {
    throw new BadRequestError('quantity must be positive');
  }

  const qty = new Prisma.Decimal(body.quantity);

  const result = await prisma.$transaction(async (tx) => {
    // Count for numbering
    const count = await tx.stock_transactions.count({ where: { tenant_id: user.tenantId } });
    const transactionNo = generateOrderNumber('TX', count + 1);

    // Create issue transaction
    const stockTx = await tx.stock_transactions.create({
      data: {
        tenant_id: user.tenantId,
        transaction_no: transactionNo,
        transaction_type: 'issue',
        warehouse_id: body.warehouseId,
        bin_location_id: body.binLocationId,
        item_id: body.itemId,
        lot_id: body.lotId,
        quantity: qty,
        uom_code: body.uomCode,
        ref_type: 'work_order',
        ref_id: workOrderId,
        reason: body.reason || `Material issuance to WO ${wo.work_order_no}`,
        created_by: user.userId,
      },
    });

    // Update stock balance (decrement on_hand_qty)
    await tx.stock_balances.updateMany({
      where: {
        tenant_id: user.tenantId,
        warehouse_id: body.warehouseId,
        item_id: body.itemId,
      },
      data: {
        on_hand_qty: { decrement: qty },
      },
    });

    return stockTx;
  });

  return json(result, 201);
});
