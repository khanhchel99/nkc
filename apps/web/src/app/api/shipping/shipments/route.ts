import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, requirePermissions } from '@/lib/auth';
import { generateOrderNumber } from '@nkc/utils';
import { apiHandler, json, getSearchParams, BadRequestError, NotFoundError } from '@/lib/api-helpers';

const VALID_PRIORITIES = ['low', 'normal', 'high', 'urgent'];
const VALID_TYPES = ['sea', 'air', 'land'];

/**
 * GET /api/shipping/shipments
 * List shipments with optional filters.
 */
export const GET = apiHandler(async (request: NextRequest) => {
  const user = getAuthUser(request);
  requirePermissions(user, 'shipping.read');
  const params = getSearchParams(request);
  const page = params.getNumber('page', 1);
  const limit = params.getNumber('limit', 20);
  const skip = (page - 1) * limit;
  const status = params.get('status');
  const customerId = params.get('customerId');

  const where = {
    tenant_id: user.tenantId,
    ...(status && { status }),
    ...(customerId && { customer_id: customerId }),
  };

  const [shipments, total] = await Promise.all([
    prisma.shipments.findMany({
      where,
      include: {
        shipment_lines: true,
        containers: true,
      },
      skip,
      take: limit,
      orderBy: { created_at: 'desc' },
    }),
    prisma.shipments.count({ where }),
  ]);

  return json({ data: shipments, total, page, limit, totalPages: Math.ceil(total / limit) });
});

/**
 * POST /api/shipping/shipments
 * Create a new shipment.
 */
export const POST = apiHandler(async (request: NextRequest) => {
  const user = getAuthUser(request);
  requirePermissions(user, 'shipping.create');
  const body = await request.json();

  if (!body.customerId) throw new BadRequestError('customerId is required');
  if (body.priority && !VALID_PRIORITIES.includes(body.priority)) {
    throw new BadRequestError(`priority must be one of: ${VALID_PRIORITIES.join(', ')}`);
  }
  if (body.shipmentType && !VALID_TYPES.includes(body.shipmentType)) {
    throw new BadRequestError(`shipmentType must be one of: ${VALID_TYPES.join(', ')}`);
  }

  // Verify customer exists
  const customer = await prisma.customers.findFirst({
    where: { id: body.customerId, tenant_id: user.tenantId },
  });
  if (!customer) throw new NotFoundError('Customer not found');

  const count = await prisma.shipments.count({ where: { tenant_id: user.tenantId } });
  const shipmentNo = generateOrderNumber('SH', count + 1);

  const shipment = await prisma.shipments.create({
    data: {
      tenant_id: user.tenantId,
      shipment_no: shipmentNo,
      customer_id: body.customerId,
      etd: body.etd ? new Date(body.etd) : null,
      eta: body.eta ? new Date(body.eta) : null,
      priority: body.priority || 'normal',
      shipment_type: body.shipmentType || 'sea',
      notes: body.notes || null,
      created_by: user.userId,
      updated_by: user.userId,
    },
    include: { shipment_lines: true, containers: true },
  });

  return json(shipment, 201);
});
