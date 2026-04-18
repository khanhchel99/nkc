import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { apiHandler, json, NotFoundError, BadRequestError } from '@/lib/api-helpers';

export const GET = apiHandler(async (request: NextRequest, context) => {
  const user = getAuthUser(request);
  const { id } = context!.params;

  const warehouse = await prisma.warehouses.findFirst({
    where: { id, tenant_id: user.tenantId },
    include: { bin_locations: true, stock_balances: true },
  });

  if (!warehouse) throw new NotFoundError('Warehouse not found');
  return json(warehouse);
});

export const PATCH = apiHandler(async (request: NextRequest, context) => {
  const user = getAuthUser(request);
  const { id } = context!.params;
  const body = await request.json();

  const existing = await prisma.warehouses.findFirst({
    where: { id, tenant_id: user.tenantId },
  });
  if (!existing) throw new NotFoundError('Warehouse not found');

  if (!body.warehouseName && !body.status && !body.siteId) {
    throw new BadRequestError('At least one field to update is required');
  }

  const warehouse = await prisma.warehouses.update({
    where: { id },
    data: {
      ...(body.warehouseName && { warehouse_name: body.warehouseName }),
      ...(body.status && { status: body.status }),
      ...(body.siteId !== undefined && { site_id: body.siteId }),
    },
    include: { bin_locations: true },
  });

  return json(warehouse);
});
