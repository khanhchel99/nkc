import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, requirePermissions } from '@/lib/auth';
import { apiHandler, json, NotFoundError, BadRequestError } from '@/lib/api-helpers';

const VALID_STATUSES = ['draft', 'planned', 'locked', 'shipped', 'delivered', 'cancelled'];
const VALID_TRANSITIONS: Record<string, string[]> = {
  draft: ['planned', 'cancelled'],
  planned: ['locked', 'cancelled'],
  locked: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
};

/**
 * GET /api/shipping/shipments/[id]
 */
export const GET = apiHandler(async (request: NextRequest, context) => {
  const user = getAuthUser(request);
  requirePermissions(user, 'shipping.read');
  const { id } = context!.params;

  const shipment = await prisma.shipments.findUnique({
    where: { id },
    include: {
      shipment_lines: true,
      containers: {
        include: { container_allocations: true },
      },
    },
  });

  if (!shipment || shipment.tenant_id !== user.tenantId) {
    throw new NotFoundError('Shipment not found');
  }

  return json(shipment);
});

/**
 * PATCH /api/shipping/shipments/[id]
 * Update shipment status, dates, or notes.
 */
export const PATCH = apiHandler(async (request: NextRequest, context) => {
  const user = getAuthUser(request);
  requirePermissions(user, 'shipping.update');
  const { id } = context!.params;
  const body = await request.json();

  const shipment = await prisma.shipments.findUnique({ where: { id } });
  if (!shipment || shipment.tenant_id !== user.tenantId) {
    throw new NotFoundError('Shipment not found');
  }

  if (body.status) {
    if (!VALID_STATUSES.includes(body.status)) {
      throw new BadRequestError(`Invalid status: ${body.status}`);
    }
    const allowed = VALID_TRANSITIONS[shipment.status] || [];
    if (!allowed.includes(body.status)) {
      throw new BadRequestError(
        `Cannot transition from '${shipment.status}' to '${body.status}'`,
      );
    }
  }

  const updated = await prisma.shipments.update({
    where: { id },
    data: {
      ...(body.status && { status: body.status }),
      ...(body.etd !== undefined && { etd: body.etd ? new Date(body.etd) : null }),
      ...(body.eta !== undefined && { eta: body.eta ? new Date(body.eta) : null }),
      ...(body.notes !== undefined && { notes: body.notes }),
      ...(body.priority && { priority: body.priority }),
      updated_by: user.userId,
    },
    include: { shipment_lines: true, containers: true },
  });

  return json(updated);
});
