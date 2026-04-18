import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, requirePermissions } from '@/lib/auth';
import { apiHandler, json, BadRequestError, NotFoundError } from '@/lib/api-helpers';

/**
 * GET /api/shipping/containers/[id]
 */
export const GET = apiHandler(async (request: NextRequest, context) => {
  const user = getAuthUser(request);
  requirePermissions(user, 'shipping.read');
  const { id } = context!.params;

  const container = await prisma.containers.findUnique({
    where: { id },
    include: {
      container_allocations: { orderBy: { allocation_seq: 'asc' } },
      shipments: true,
    },
  });

  if (!container || container.tenant_id !== user.tenantId) {
    throw new NotFoundError('Container not found');
  }

  return json(container);
});

/**
 * PATCH /api/shipping/containers/[id]
 * Update container status or assign to shipment.
 */
export const PATCH = apiHandler(async (request: NextRequest, context) => {
  const user = getAuthUser(request);
  requirePermissions(user, 'shipping.update');
  const { id } = context!.params;
  const body = await request.json();

  const container = await prisma.containers.findUnique({ where: { id } });
  if (!container || container.tenant_id !== user.tenantId) {
    throw new NotFoundError('Container not found');
  }

  if (body.status) {
    const VALID_STATUSES = ['open', 'locked', 'shipped'];
    if (!VALID_STATUSES.includes(body.status)) {
      throw new BadRequestError(`Invalid status: ${body.status}`);
    }
  }

  const updated = await prisma.containers.update({
    where: { id },
    data: {
      ...(body.status && { status: body.status }),
      ...(body.containerNo !== undefined && { container_no: body.containerNo }),
      ...(body.shipmentId !== undefined && { shipment_id: body.shipmentId || null }),
    },
    include: { container_allocations: true },
  });

  return json(updated);
});
