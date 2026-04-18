import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createRequest, parseResponse, setupEnv, createRouteContext, uuid, TEST_TENANT_ID, TEST_USER_ID } from '@/__tests__/helpers';

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    order_import_jobs: {
      create: vi.fn(),
      update: vi.fn(),
      findUnique: vi.fn(),
    },
    order_validation_errors: {
      createMany: vi.fn(),
    },
  },
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));
setupEnv();

import { GET as getJobById } from '@/app/api/order-import/jobs/[id]/route';

// =============================================================================
// ORDER IMPORT JOB
// =============================================================================
describe('Order Import Job Routes', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('GET /api/order-import/jobs/[id]', () => {
    it('should return job detail with validation errors', async () => {
      mockPrisma.order_import_jobs.findUnique.mockResolvedValue({
        id: uuid(1),
        status: 'validated',
        source_type: 'excel',
        total_rows: 10,
        valid_rows: 8,
        error_rows: 2,
        order_validation_errors: [
          { row_no: 3, field_name: 'quantity', error_message: 'Must be positive' },
          { row_no: 7, field_name: 'productCode', error_message: 'Not found' },
        ],
      });

      const req = createRequest('/api/order-import/jobs/' + uuid(1));
      const res = await getJobById(req, createRouteContext({ id: uuid(1) }));
      const { status, body } = await parseResponse(res);

      expect(status).toBe(200);
      expect(body.status).toBe('validated');
      expect(body.total_rows).toBe(10);
      expect(body.order_validation_errors).toHaveLength(2);
    });

    it('should return 404 for non-existent job', async () => {
      mockPrisma.order_import_jobs.findUnique.mockResolvedValue(null);

      const req = createRequest('/api/order-import/jobs/' + uuid(99));
      const res = await getJobById(req, createRouteContext({ id: uuid(99) }));
      const { status } = await parseResponse(res);

      expect(status).toBe(404);
    });

    it('should return job with zero validation errors', async () => {
      mockPrisma.order_import_jobs.findUnique.mockResolvedValue({
        id: uuid(1),
        status: 'validated',
        source_type: 'excel',
        total_rows: 5,
        valid_rows: 5,
        error_rows: 0,
        order_validation_errors: [],
      });

      const req = createRequest('/api/order-import/jobs/' + uuid(1));
      const res = await getJobById(req, createRouteContext({ id: uuid(1) }));
      const { status, body } = await parseResponse(res);

      expect(status).toBe(200);
      expect(body.valid_rows).toBe(5);
      expect(body.error_rows).toBe(0);
      expect(body.order_validation_errors).toEqual([]);
    });

    it('should return job with pending status', async () => {
      mockPrisma.order_import_jobs.findUnique.mockResolvedValue({
        id: uuid(1),
        status: 'pending',
        source_type: 'excel',
        total_rows: 0,
        valid_rows: 0,
        error_rows: 0,
        order_validation_errors: [],
      });

      const req = createRequest('/api/order-import/jobs/' + uuid(1));
      const res = await getJobById(req, createRouteContext({ id: uuid(1) }));
      const { status, body } = await parseResponse(res);

      expect(status).toBe(200);
      expect(body.status).toBe('pending');
    });

    it('should return job with completed/imported status', async () => {
      mockPrisma.order_import_jobs.findUnique.mockResolvedValue({
        id: uuid(1),
        status: 'imported',
        source_type: 'excel',
        total_rows: 50,
        valid_rows: 50,
        error_rows: 0,
        imported_order_ids: [uuid(10), uuid(11), uuid(12)],
        order_validation_errors: [],
      });

      const req = createRequest('/api/order-import/jobs/' + uuid(1));
      const res = await getJobById(req, createRouteContext({ id: uuid(1) }));
      const { status, body } = await parseResponse(res);

      expect(status).toBe(200);
      expect(body.status).toBe('imported');
      expect(body.total_rows).toBe(50);
    });

    it('should handle DB error gracefully', async () => {
      mockPrisma.order_import_jobs.findUnique.mockRejectedValue(new Error('Connection lost'));

      const req = createRequest('/api/order-import/jobs/' + uuid(1));
      const res = await getJobById(req, createRouteContext({ id: uuid(1) }));
      const { status } = await parseResponse(res);

      expect(status).toBe(500);
    });
  });
});
