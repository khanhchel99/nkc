import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, requirePermissions } from '@/lib/auth';
import { apiHandler, json, getSearchParams, BadRequestError } from '@/lib/api-helpers';

const VALID_CONTAINER_TYPES = ['20GP', '40GP', '40HQ', 'LCL'];

/**
 * GET /api/shipping/containers
 * List containers with optional filters.
 */
export const GET = apiHandler(async (request: NextRequest) => {
  const user = getAuthUser(request);
  requirePermissions(user, 'shipping.read');
  const params = getSearchParams(request);
  const page = params.getNumber('page', 1);
  const limit = params.getNumber('limit', 20);
  const skip = (page - 1) * limit;
  const status = params.get('status');
  const shipmentId = params.get('shipmentId');

  const where = {
    tenant_id: user.tenantId,
    ...(status && { status }),
    ...(shipmentId && { shipment_id: shipmentId }),
  };

  const [containers, total] = await Promise.all([
    prisma.containers.findMany({
      where,
      include: { container_allocations: true },
      skip,
      take: limit,
      orderBy: { created_at: 'desc' },
    }),
    prisma.containers.count({ where }),
  ]);

  return json({ data: containers, total, page, limit, totalPages: Math.ceil(total / limit) });
});

/**
 * POST /api/shipping/containers
 * Create a container.
 */
export const POST = apiHandler(async (request: NextRequest) => {
  const user = getAuthUser(request);
  requirePermissions(user, 'shipping.create');
  const body = await request.json();

  if (!body.containerType) throw new BadRequestError('containerType is required');
  if (!VALID_CONTAINER_TYPES.includes(body.containerType)) {
    throw new BadRequestError(`containerType must be one of: ${VALID_CONTAINER_TYPES.join(', ')}`);
  }

  const container = await prisma.containers.create({
    data: {
      tenant_id: user.tenantId,
      container_no: body.containerNo || null,
      container_type: body.containerType,
      max_cbm: body.maxCbm || null,
      max_weight_kg: body.maxWeightKg || null,
      shipment_id: body.shipmentId || null,
    },
    include: { container_allocations: true },
  });

  return json(container, 201);
});
