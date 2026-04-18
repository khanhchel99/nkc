import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { apiHandler, json, NotFoundError, BadRequestError } from '@/lib/api-helpers';

export const GET = apiHandler(async (request: NextRequest, context) => {
  const user = getAuthUser(request);
  const { id } = context!.params;

  const warehouse = await prisma.warehouses.findFirst({
    where: { id, tenant_id: user.tenantId },
  });
  if (!warehouse) throw new NotFoundError('Warehouse not found');

  const bins = await prisma.bin_locations.findMany({
    where: { warehouse_id: id, tenant_id: user.tenantId },
    orderBy: { bin_code: 'asc' },
  });

  return json({ data: bins });
});

export const POST = apiHandler(async (request: NextRequest, context) => {
  const user = getAuthUser(request);
  const { id } = context!.params;
  const body = await request.json();

  const warehouse = await prisma.warehouses.findFirst({
    where: { id, tenant_id: user.tenantId },
  });
  if (!warehouse) throw new NotFoundError('Warehouse not found');

  if (!body.binCode) throw new BadRequestError('binCode is required');

  const bin = await prisma.bin_locations.create({
    data: {
      tenant_id: user.tenantId,
      warehouse_id: id,
      bin_code: body.binCode,
      bin_name: body.binName,
      status: body.status ?? 'active',
    },
  });

  return json(bin, 201);
});
