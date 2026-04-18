import { NextRequest } from 'next/server';
import { createHash } from 'crypto';
import { prisma } from '@/lib/prisma';
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
  await prisma.refresh_sessions.updateMany({
    where: { refresh_token_hash: tokenHash, revoked_at: null },
    data: { revoked_at: new Date() },
  });

  return json({ success: true });
});
