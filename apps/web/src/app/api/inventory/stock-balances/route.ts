import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { apiHandler, json, getSearchParams } from '@/lib/api-helpers';

export const GET = apiHandler(async (request: NextRequest) => {
  const user = getAuthUser(request);
  const params = getSearchParams(request);
  const page = params.getNumber('page', 1);
  const limit = params.getNumber('limit', 50);
  const skip = (page - 1) * limit;
  const itemId = params.get('itemId');
  const warehouseId = params.get('warehouseId');

  const where = {
    tenant_id: user.tenantId,
    ...(itemId && { item_id: itemId }),
    ...(warehouseId && { warehouse_id: warehouseId }),
  };

  const [balances, total] = await Promise.all([
    prisma.stock_balances.findMany({
      where,
      include: { warehouses: true, bin_locations: true },
      skip,
      take: limit,
      orderBy: { updated_at: 'desc' },
    }),
    prisma.stock_balances.count({ where }),
  ]);

  // Resolve item names with a single secondary query
  const itemIds = [...new Set(balances.map((b) => b.item_id))];
  const items = itemIds.length
    ? await prisma.items.findMany({
        where: { id: { in: itemIds } },
        select: { id: true, item_name: true, item_code: true },
      })
    : [];
  const itemMap = new Map(items.map((i) => [i.id, i]));

  const data = balances.map((b) => {
    const item = itemMap.get(b.item_id);
    return {
      // camelCase (web)
      id: b.id,
      itemId: b.item_id,
      itemName: item?.item_name ?? b.item_id,
      itemCode: item?.item_code,
      warehouseId: b.warehouse_id,
      warehouseName: b.warehouses.warehouse_name,
      binCode: b.bin_locations?.bin_code ?? null,
      lotId: b.lot_id,
      lotNumber: b.lot_id,
      quantityOnHand: Number(b.on_hand_qty),
      quantityReserved: Number(b.reserved_qty),
      quantityAvailable: Number(b.available_qty),
      unit: b.uom_code,
      updatedAt: b.updated_at,
      // snake_case aliases (mobile compatibility)
      item_id: b.item_id,
      warehouse_id: b.warehouse_id,
      bin_location: b.bin_locations?.bin_code ?? null,
      qty_on_hand: Number(b.on_hand_qty),
      qty_reserved: Number(b.reserved_qty),
      qty_available: Number(b.available_qty),
      items: {
        item_code: item?.item_code ?? '',
        item_name: item?.item_name ?? b.item_id,
        uom: b.uom_code,
      },
      warehouses: {
        wh_code: b.warehouses.warehouse_code ?? '',
        wh_name: b.warehouses.warehouse_name,
      },
    };
  });

  return json({ data, total, page, limit, totalPages: Math.ceil(total / limit), pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } });
});
