import { NextRequest } from 'next/server';
import bcrypt from 'bcrypt';
import { randomUUID, createHash } from 'crypto';
import { prisma } from '@/lib/prisma';
import { signToken, JwtPayload } from '@/lib/auth';
import { apiHandler, json, ApiError } from '@/lib/api-helpers';

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function extractUserRolesAndPermissions(user: {
  user_roles: Array<{
    roles: {
      code: string;
      role_permissions: Array<{ permissions: { code: string } }>;
    };
  }>;
}) {
  const roles = user.user_roles.map((ur) => ur.roles.code);
  const permissions = [
    ...new Set(
      user.user_roles.flatMap((ur) =>
        ur.roles.role_permissions.map((rp) => rp.permissions.code),
      ),
    ),
  ];
  return { roles, permissions };
}

export const POST = apiHandler(async (request: NextRequest) => {
  const body = await request.json();
  const { tenantId, email, password } = body;

  if (!tenantId || !email || !password) {
    throw new ApiError('tenantId, email, and password are required', 400);
  }

  const user = await prisma.users.findUnique({
    where: { tenant_id_email: { tenant_id: tenantId, email } },
    include: {
      user_roles: {
        include: {
          roles: {
            include: { role_permissions: { include: { permissions: true } } },
          },
        },
      },
    },
  });

  if (!user || user.status !== 'active') {
    throw new ApiError('Invalid credentials', 401);
  }

  const passwordValid = await bcrypt.compare(password, user.password_hash);
  if (!passwordValid) {
    throw new ApiError('Invalid credentials', 401);
  }

  const { roles, permissions } = extractUserRolesAndPermissions(user);

  const payload: Omit<JwtPayload, 'iat' | 'exp'> = {
    sub: user.id,
    email: user.email,
    tenantId: user.tenant_id,
    roles,
    permissions,
  };

  const accessToken = signToken(payload);
  const refreshToken = randomUUID();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await prisma.refresh_sessions.create({
    data: {
      user_id: user.id,
      refresh_token_hash: hashToken(refreshToken),
      device_name: request.headers.get('x-device-name') || 'web',
      platform: request.headers.get('x-platform') || undefined,
      ip_address: request.headers.get('x-forwarded-for') || undefined,
      expires_at: expiresAt,
    },
  });

  await prisma.users.update({
    where: { id: user.id },
    data: { last_login_at: new Date() },
  });

  return json({
    accessToken,
    refreshToken,
    expiresIn: 900,
    user: {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      tenantId: user.tenant_id,
      roles,
      permissions,
    },
  });
});
