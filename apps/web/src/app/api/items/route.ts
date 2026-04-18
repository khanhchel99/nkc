import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { apiHandler, json, ConflictError, getSearchParams } from '@/lib/api-helpers';

export const GET = apiHandler(async (request: NextRequest) => {
  const user = getAuthUser(request);
  const params = getSearchParams(request);
  const page = params.getNumber('page', 1);
  const limit = params.getNumber('limit', 20);
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    prisma.items.findMany({
      where: { tenant_id: user.tenantId },
      skip,
      take: limit,
      orderBy: { created_at: 'desc' },
    }),
    prisma.items.count({ where: { tenant_id: user.tenantId } }),
  ]);

  return json({ data: items, total, page, limit, totalPages: Math.ceil(total / limit) });
});

export const POST = apiHandler(async (request: NextRequest) => {
  const user = getAuthUser(request);
  const body = await request.json();

  const existing = await prisma.items.findUnique({
    where: { tenant_id_item_code: { tenant_id: user.tenantId, item_code: body.itemCode } },
  });
  if (existing) throw new ConflictError('Item code already exists');

  const item = await prisma.items.create({
    data: {
      tenant_id: user.tenantId,
      item_code: body.itemCode,
      item_name: body.itemName,
      item_type: body.itemType,
      default_uom_code: body.defaultUomCode,
      material_type: body.materialType,
      spec_text: body.description,
    },
  });

  return json(item, 201);
});
