import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { apiHandler, json, NotFoundError, BadRequestError } from '@/lib/api-helpers';

export const POST = apiHandler(async (request: NextRequest, context) => {
  const user = getAuthUser(request);
  const { id } = context!.params;

  const reservation = await prisma.inventory_reservations.findFirst({
    where: { id, tenant_id: user.tenantId },
  });

  if (!reservation) throw new NotFoundError('Reservation not found');
  if (reservation.status !== 'active') {
    throw new BadRequestError(`Cannot release reservation with status "${reservation.status}"`);
  }

  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.inventory_reservations.update({
      where: { id },
      data: { status: 'released', released_at: new Date() },
    });

    // Decrease reserved_qty on stock balance
    const balance = await tx.stock_balances.findFirst({
      where: {
        tenant_id: user.tenantId,
        warehouse_id: reservation.warehouse_id,
        item_id: reservation.item_id,
      },
    });

    if (balance) {
      await tx.stock_balances.update({
        where: { id: balance.id },
        data: { reserved_qty: balance.reserved_qty.sub(reservation.reserved_qty) },
      });
    }

    return updated;
  });

  return json(result);
});
