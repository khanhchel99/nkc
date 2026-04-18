import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { generateOrderNumber } from '@nkc/utils';
import { apiHandler, json, getSearchParams, BadRequestError } from '@/lib/api-helpers';
import { Prisma } from '@nkc/database';

const VALID_TYPES = ['receive', 'issue', 'transfer', 'adjustment', 'reserve', 'unreserve'] as const;

export const GET = apiHandler(async (request: NextRequest) => {
  const user = getAuthUser(request);
  const params = getSearchParams(request);
  const page = params.getNumber('page', 1);
  const limit = params.getNumber('limit', 20);
  const skip = (page - 1) * limit;
  const itemId = params.get('itemId');
  const warehouseId = params.get('warehouseId');
  const type = params.get('type');

  const where = {
    tenant_id: user.tenantId,
    ...(itemId && { item_id: itemId }),
    ...(warehouseId && { warehouse_id: warehouseId }),
    ...(type && { transaction_type: type }),
  };

  const [transactions, total] = await Promise.all([
    prisma.stock_transactions.findMany({
      where,
      skip,
      take: limit,
      orderBy: { created_at: 'desc' },
    }),
    prisma.stock_transactions.count({ where }),
  ]);

  return json({ data: transactions, total, page, limit, totalPages: Math.ceil(total / limit) });
});

export const POST = apiHandler(async (request: NextRequest) => {
  const user = getAuthUser(request);
  const body = await request.json();

  const txType = body.transactionType as string;
  if (!txType || !VALID_TYPES.includes(txType as typeof VALID_TYPES[number])) {
    throw new BadRequestError(`transactionType must be one of: ${VALID_TYPES.join(', ')}`);
  }
  if (!body.warehouseId || !body.itemId || !body.quantity || !body.uomCode) {
    throw new BadRequestError('warehouseId, itemId, quantity, and uomCode are required');
  }
  if (body.quantity <= 0) {
    throw new BadRequestError('quantity must be positive');
  }

  const count = await prisma.stock_transactions.count({ where: { tenant_id: user.tenantId } });
  const transactionNo = generateOrderNumber('TX', count + 1);

  const qty = new Prisma.Decimal(body.quantity);

  // Determine stock balance changes based on transaction type
  const result = await prisma.$transaction(async (tx) => {
    // Create the transaction record
    const stockTx = await tx.stock_transactions.create({
      data: {
        tenant_id: user.tenantId,
        transaction_no: transactionNo,
        transaction_type: txType,
        warehouse_id: body.warehouseId,
        bin_location_id: body.binLocationId,
        item_id: body.itemId,
        lot_id: body.lotId,
        quantity: qty,
        uom_code: body.uomCode,
        ref_type: body.refType,
        ref_id: body.refId,
        reason: body.reason,
        created_by: user.userId,
      },
    });

    // Update stock balance
    await upsertStockBalance(tx, {
      tenantId: user.tenantId,
      warehouseId: body.warehouseId,
      binLocationId: body.binLocationId,
      itemId: body.itemId,
      lotId: body.lotId,
      uomCode: body.uomCode,
      transactionType: txType,
      quantity: qty,
    });

    // For transfers, also create the receiving side
    if (txType === 'transfer') {
      if (!body.toWarehouseId) {
        throw new BadRequestError('toWarehouseId is required for transfer transactions');
      }

      const recvTxNo = generateOrderNumber('TX', count + 2);
      await tx.stock_transactions.create({
        data: {
          tenant_id: user.tenantId,
          transaction_no: recvTxNo,
          transaction_type: 'receive',
          warehouse_id: body.toWarehouseId,
          bin_location_id: body.toBinLocationId,
          item_id: body.itemId,
          lot_id: body.lotId,
          quantity: qty,
          uom_code: body.uomCode,
          ref_type: 'transfer',
          ref_id: stockTx.id,
          reason: body.reason,
          created_by: user.userId,
        },
      });

      await upsertStockBalance(tx, {
        tenantId: user.tenantId,
        warehouseId: body.toWarehouseId,
        binLocationId: body.toBinLocationId,
        itemId: body.itemId,
        lotId: body.lotId,
        uomCode: body.uomCode,
        transactionType: 'receive',
        quantity: qty,
      });
    }

    return stockTx;
  });

  return json(result, 201);
});

interface BalanceUpdateParams {
  tenantId: string;
  warehouseId: string;
  binLocationId?: string;
  itemId: string;
  lotId?: string;
  uomCode: string;
  transactionType: string;
  quantity: Prisma.Decimal;
}

async function upsertStockBalance(
  tx: Prisma.TransactionClient,
  params: BalanceUpdateParams,
) {
  // Find existing balance
  const existing = await tx.stock_balances.findFirst({
    where: {
      tenant_id: params.tenantId,
      warehouse_id: params.warehouseId,
      bin_location_id: params.binLocationId ?? null,
      item_id: params.itemId,
      lot_id: params.lotId ?? null,
    },
  });

  // Calculate delta for on_hand_qty and reserved_qty
  let onHandDelta = new Prisma.Decimal(0);
  let reservedDelta = new Prisma.Decimal(0);

  switch (params.transactionType) {
    case 'receive':
      onHandDelta = params.quantity;
      break;
    case 'issue':
    case 'transfer':
      onHandDelta = params.quantity.negated();
      break;
    case 'adjustment':
      onHandDelta = params.quantity; // positive = add, caller sends negative qty for removal
      break;
    case 'reserve':
      reservedDelta = params.quantity;
      break;
    case 'unreserve':
      reservedDelta = params.quantity.negated();
      break;
  }

  if (existing) {
    const newOnHand = existing.on_hand_qty.add(onHandDelta);
    const newReserved = existing.reserved_qty.add(reservedDelta);

    await tx.stock_balances.update({
      where: { id: existing.id },
      data: {
        on_hand_qty: newOnHand,
        reserved_qty: newReserved,
      },
    });
  } else {
    await tx.stock_balances.create({
      data: {
        tenant_id: params.tenantId,
        warehouse_id: params.warehouseId,
        bin_location_id: params.binLocationId,
        item_id: params.itemId,
        lot_id: params.lotId,
        on_hand_qty: onHandDelta.greaterThan(0) ? onHandDelta : new Prisma.Decimal(0),
        reserved_qty: reservedDelta.greaterThan(0) ? reservedDelta : new Prisma.Decimal(0),
        uom_code: params.uomCode,
      },
    });
  }
}
