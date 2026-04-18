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

  return json({ data: balances, total, page, limit, totalPages: Math.ceil(total / limit) });
});
