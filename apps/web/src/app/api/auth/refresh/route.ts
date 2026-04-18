import { NextRequest } from 'next/server';
import { randomUUID, createHash } from 'crypto';
import { prisma } from '@/lib/prisma';
import { signToken, JwtPayload } from '@/lib/auth';
import { apiHandler, json, ApiError } from '@/lib/api-helpers';

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export const POST = apiHandler(async (request: NextRequest) => {
  const { refreshToken } = await request.json();
  if (!refreshToken) {
    throw new ApiError('refreshToken is required', 400);
  }

  const tokenHash = hashToken(refreshToken);

  const session = await prisma.refresh_sessions.findFirst({
    where: {
      refresh_token_hash: tokenHash,
      expires_at: { gt: new Date() },
      revoked_at: null,
    },
    include: {
      users: {
        include: {
          user_roles: {
            include: {
              roles: {
                include: { role_permissions: { include: { permissions: true } } },
              },
            },
          },
        },
      },
    },
  });

  if (!session || session.users.status !== 'active') {
    throw new ApiError('Invalid or expired refresh token', 401);
  }

  // Rotate: revoke old, issue new
  const newRefreshToken = randomUUID();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await prisma.$transaction([
    prisma.refresh_sessions.update({
      where: { id: session.id },
      data: { revoked_at: new Date() },
    }),
    prisma.refresh_sessions.create({
      data: {
        user_id: session.user_id,
        refresh_token_hash: hashToken(newRefreshToken),
        device_name: session.device_name,
        platform: session.platform,
        ip_address: session.ip_address,
        expires_at: expiresAt,
      },
    }),
  ]);

  const roles = session.users.user_roles.map((ur) => ur.roles.code);
  const permissions = [
    ...new Set(
      session.users.user_roles.flatMap((ur) =>
        ur.roles.role_permissions.map((rp) => rp.permissions.code),
      ),
    ),
  ];

  const payload: Omit<JwtPayload, 'iat' | 'exp'> = {
    sub: session.users.id,
    email: session.users.email,
    tenantId: session.users.tenant_id,
    roles,
    permissions,
  };

  return json({
    accessToken: signToken(payload),
    refreshToken: newRefreshToken,
    expiresIn: 900,
  });
});
