import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, requirePermissions } from '@/lib/auth';
import { generateOrderNumber } from '@nkc/utils';
import { apiHandler, json, getSearchParams, BadRequestError } from '@/lib/api-helpers';

/**
 * GET /api/shipping/packing-units
 * List packing units with optional filters.
 */
export const GET = apiHandler(async (request: NextRequest) => {
  const user = getAuthUser(request);
  requirePermissions(user, 'shipping.read');
  const params = getSearchParams(request);
  const page = params.getNumber('page', 1);
  const limit = params.getNumber('limit', 20);
  const skip = (page - 1) * limit;
  const status = params.get('status');
  const salesOrderLineId = params.get('salesOrderLineId');

  const where = {
    tenant_id: user.tenantId,
    ...(status && { status }),
    ...(salesOrderLineId && { sales_order_line_id: salesOrderLineId }),
  };

  const [units, total] = await Promise.all([
    prisma.packing_units.findMany({
      where,
      skip,
      take: limit,
      orderBy: { created_at: 'desc' },
    }),
    prisma.packing_units.count({ where }),
  ]);

  return json({ data: units, total, page, limit, totalPages: Math.ceil(total / limit) });
});

/**
 * POST /api/shipping/packing-units
 * Create a packing unit.
 */
export const POST = apiHandler(async (request: NextRequest) => {
  const user = getAuthUser(request);
  requirePermissions(user, 'shipping.create');
  const body = await request.json();

  if (!body.salesOrderLineId) throw new BadRequestError('salesOrderLineId is required');
  if (!body.productId) throw new BadRequestError('productId is required');
  if (!body.quantity || body.quantity <= 0) throw new BadRequestError('quantity must be > 0');

  const count = await prisma.packing_units.count({ where: { tenant_id: user.tenantId } });
  const packingUnitNo = generateOrderNumber('PU', count + 1);

  const unit = await prisma.packing_units.create({
    data: {
      tenant_id: user.tenantId,
      packing_unit_no: packingUnitNo,
      sales_order_line_id: body.salesOrderLineId,
      product_id: body.productId,
      product_version_id: body.productVersionId || null,
      quantity: body.quantity,
      carton_no: body.cartonNo || null,
      pallet_no: body.palletNo || null,
      length_mm: body.lengthMm || null,
      width_mm: body.widthMm || null,
      height_mm: body.heightMm || null,
      gross_weight_kg: body.grossWeightKg || null,
      cbm: body.cbm || null,
    },
  });

  return json(unit, 201);
});
