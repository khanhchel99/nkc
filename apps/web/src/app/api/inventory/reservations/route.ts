import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { apiHandler, json, getSearchParams, BadRequestError } from '@/lib/api-helpers';
import { Prisma } from '@nkc/database';

export const GET = apiHandler(async (request: NextRequest) => {
  const user = getAuthUser(request);
  const params = getSearchParams(request);
  const page = params.getNumber('page', 1);
  const limit = params.getNumber('limit', 20);
  const skip = (page - 1) * limit;
  const itemId = params.get('itemId');
  const status = params.get('status');

  const where = {
    tenant_id: user.tenantId,
    ...(itemId && { item_id: itemId }),
    ...(status && { status }),
  };

  const [reservations, total] = await Promise.all([
    prisma.inventory_reservations.findMany({
      where,
      include: { warehouses: true },
      skip,
      take: limit,
      orderBy: { created_at: 'desc' },
    }),
    prisma.inventory_reservations.count({ where }),
  ]);

  return json({ data: reservations, total, page, limit, totalPages: Math.ceil(total / limit) });
});

export const POST = apiHandler(async (request: NextRequest) => {
  const user = getAuthUser(request);
  const body = await request.json();

  if (!body.itemId || !body.warehouseId || !body.reservedQty || !body.uomCode || !body.refType || !body.refId) {
    throw new BadRequestError('itemId, warehouseId, reservedQty, uomCode, refType, and refId are required');
  }

  const validRefTypes = ['sales_order_line', 'work_order', 'shipment'];
  if (!validRefTypes.includes(body.refType)) {
    throw new BadRequestError(`refType must be one of: ${validRefTypes.join(', ')}`);
  }

  const qty = new Prisma.Decimal(body.reservedQty);

  // Create reservation and update stock balance reserved_qty in a transaction
  const reservation = await prisma.$transaction(async (tx) => {
    const res = await tx.inventory_reservations.create({
      data: {
        tenant_id: user.tenantId,
        item_id: body.itemId,
        warehouse_id: body.warehouseId,
        ref_type: body.refType,
        ref_id: body.refId,
        reserved_qty: qty,
        uom_code: body.uomCode,
      },
      include: { warehouses: true },
    });

    // Increase reserved_qty on the stock balance
    const balance = await tx.stock_balances.findFirst({
      where: {
        tenant_id: user.tenantId,
        warehouse_id: body.warehouseId,
        item_id: body.itemId,
      },
    });

    if (balance) {
      await tx.stock_balances.update({
        where: { id: balance.id },
        data: { reserved_qty: balance.reserved_qty.add(qty) },
      });
    }

    return res;
  });

  return json(reservation, 201);
});
