import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiHandler, json, NotFoundError } from '@/lib/api-helpers';

export const GET = apiHandler(async (
  _request: NextRequest,
  context,
) => {
  const { id } = context!.params;

  const job = await prisma.order_import_jobs.findUnique({
    where: { id },
    include: { order_validation_errors: true },
  });

  if (!job) throw new NotFoundError('Import job not found');
  return json(job);
});
