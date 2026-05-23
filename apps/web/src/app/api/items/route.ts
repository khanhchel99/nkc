import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { apiHandler, json, ConflictError, BadRequestError, getSearchParams } from '@/lib/api-helpers';

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

  const data = items.map((i) => ({
    itemId: i.id,
    sku: i.item_code,
    name: i.item_name,
    type: i.item_type,
    unit: i.default_uom_code,
    reorderPoint: i.min_stock_qty ? Number(i.min_stock_qty) : null,
    status: i.status,
  }));

  return json({ data, total, page, limit, totalPages: Math.ceil(total / limit) });
});

export const POST = apiHandler(async (request: NextRequest) => {
  const user = getAuthUser(request);
  const body = await request.json();

  // Accept both camelCase (from web UI) and snake_case fields
  const itemCode = body.sku ?? body.itemCode ?? body.item_code;
  const itemName = body.name ?? body.itemName ?? body.item_name;
  const itemType = body.type ?? body.itemType ?? body.item_type ?? 'raw_material';
  const uomCode = body.unit ?? body.defaultUomCode ?? body.default_uom_code ?? 'pcs';

  if (!itemCode || !itemName) {
    throw new BadRequestError('sku (or itemCode) and name (or itemName) are required');
  }

  const existing = await prisma.items.findUnique({
    where: { tenant_id_item_code: { tenant_id: user.tenantId, item_code: itemCode } },
  });
  if (existing) throw new ConflictError('Item code already exists');

  const item = await prisma.items.create({
    data: {
      tenant_id: user.tenantId,
      item_code: itemCode,
      item_name: itemName,
      item_type: itemType,
      default_uom_code: uomCode,
      min_stock_qty: body.reorderPoint ?? body.minStockQty ?? undefined,
      spec_text: body.description ?? body.spec_text,
    },
  });

  return json({
    itemId: item.id,
    sku: item.item_code,
    name: item.item_name,
    type: item.item_type,
    unit: item.default_uom_code,
    reorderPoint: item.min_stock_qty ? Number(item.min_stock_qty) : null,
    status: item.status,
  }, 201);
});
