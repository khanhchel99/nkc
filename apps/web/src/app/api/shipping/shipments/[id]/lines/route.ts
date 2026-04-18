import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, requirePermissions } from '@/lib/auth';
import { apiHandler, json, BadRequestError, NotFoundError } from '@/lib/api-helpers';

/**
 * GET /api/shipping/shipments/[id]/lines
 * List shipment lines.
 */
export const GET = apiHandler(async (request: NextRequest, context) => {
  const user = getAuthUser(request);
  requirePermissions(user, 'shipping.read');
  const { id } = context!.params;

  const shipment = await prisma.shipments.findUnique({ where: { id } });
  if (!shipment || shipment.tenant_id !== user.tenantId) {
    throw new NotFoundError('Shipment not found');
  }

  const lines = await prisma.shipment_lines.findMany({
    where: { shipment_id: id, tenant_id: user.tenantId },
    orderBy: { created_at: 'asc' },
  });

  return json({ data: lines });
});

/**
 * POST /api/shipping/shipments/[id]/lines
 * Add lines to a shipment. Only allowed in draft/planned status.
 */
export const POST = apiHandler(async (request: NextRequest, context) => {
  const user = getAuthUser(request);
  requirePermissions(user, 'shipping.create');
  const { id } = context!.params;
  const body = await request.json();

  const shipment = await prisma.shipments.findUnique({ where: { id } });
  if (!shipment || shipment.tenant_id !== user.tenantId) {
    throw new NotFoundError('Shipment not found');
  }
  if (!['draft', 'planned'].includes(shipment.status)) {
    throw new BadRequestError('Can only add lines to draft or planned shipments');
  }

  if (!Array.isArray(body.lines) || body.lines.length === 0) {
    throw new BadRequestError('lines array is required');
  }

  const created = await prisma.$transaction(
    body.lines.map((line: { salesOrderLineId: string; packingUnitId?: string; shipQty: number }) => {
      if (!line.salesOrderLineId || !line.shipQty || line.shipQty <= 0) {
        throw new BadRequestError('Each line requires salesOrderLineId and shipQty > 0');
      }
      return prisma.shipment_lines.create({
        data: {
          tenant_id: user.tenantId,
          shipment_id: id,
          sales_order_line_id: line.salesOrderLineId,
          packing_unit_id: line.packingUnitId || null,
          ship_qty: line.shipQty,
        },
      });
    }),
  );

  return json({ data: created }, 201);
});
