import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiHandler, json, NotFoundError } from '@/lib/api-helpers';

const userSelect = {
  id: true,
  email: true,
  full_name: true,
  phone: true,
  tenant_id: true,
  status: true,
  created_at: true,
  user_roles: { include: { roles: true } },
} as const;

export const GET = apiHandler(async (
  _request: NextRequest,
  context,
) => {
  const { id } = context!.params;

  const user = await prisma.users.findUnique({
    where: { id },
    select: userSelect,
  });

  if (!user) throw new NotFoundError('User not found');
  return json(user);
});
