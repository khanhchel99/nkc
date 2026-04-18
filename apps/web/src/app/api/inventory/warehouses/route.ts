import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { apiHandler, json, getSearchParams, BadRequestError } from '@/lib/api-helpers';

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

  const [warehouses, total] = await Promise.all([
    prisma.warehouses.findMany({
      where,
      include: { bin_locations: true },
      skip,
      take: limit,
      orderBy: { warehouse_code: 'asc' },
    }),
    prisma.warehouses.count({ where }),
  ]);

  return json({ data: warehouses, total, page, limit, totalPages: Math.ceil(total / limit) });
});

export const POST = apiHandler(async (request: NextRequest) => {
  const user = getAuthUser(request);
  const body = await request.json();

  if (!body.warehouseCode || !body.warehouseName) {
    throw new BadRequestError('warehouseCode and warehouseName are required');
  }

  const warehouse = await prisma.warehouses.create({
    data: {
      tenant_id: user.tenantId,
      site_id: body.siteId,
      warehouse_code: body.warehouseCode,
      warehouse_name: body.warehouseName,
      status: body.status ?? 'active',
    },
    include: { bin_locations: true },
  });

  return json(warehouse, 201);
});
