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
  const itemId = params.get('itemId');

  const where = {
    tenant_id: user.tenantId,
    ...(itemId && { item_id: itemId }),
  };

  const [lots, total] = await Promise.all([
    prisma.lots.findMany({ where, skip, take: limit, orderBy: { created_at: 'desc' } }),
    prisma.lots.count({ where }),
  ]);

  return json({ data: lots, total, page, limit, totalPages: Math.ceil(total / limit) });
});

export const POST = apiHandler(async (request: NextRequest) => {
  const user = getAuthUser(request);
  const body = await request.json();

  if (!body.itemId || !body.lotNo) {
    throw new BadRequestError('itemId and lotNo are required');
  }

  const lot = await prisma.lots.create({
    data: {
      tenant_id: user.tenantId,
      item_id: body.itemId,
      lot_no: body.lotNo,
      received_date: body.receivedDate ? new Date(body.receivedDate) : undefined,
      expiry_date: body.expiryDate ? new Date(body.expiryDate) : undefined,
      supplier_id: body.supplierId,
      metadata: body.metadata ?? {},
    },
  });

  return json(lot, 201);
});
