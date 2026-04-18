import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Prisma } from '@nkc/database';
import { createRequest, parseResponse, setupEnv, createRouteContext, uuid, TEST_TENANT_ID, TEST_USER_ID } from '@/__tests__/helpers';

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    shipments: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    shipment_lines: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    packing_units: {
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      updateMany: vi.fn(),
    },
    containers: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    container_allocations: {
      create: vi.fn(),
      aggregate: vi.fn(),
    },
    customers: {
      findFirst: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));
vi.mock('@nkc/utils', () => ({
  generateOrderNumber: (prefix: string, seq: number) => `${prefix}-${String(seq).padStart(6, '0')}`,
}));
setupEnv();

import { GET as listShipments, POST as createShipment } from '@/app/api/shipping/shipments/route';
import { GET as getShipment, PATCH as patchShipment } from '@/app/api/shipping/shipments/[id]/route';
import { GET as listLines, POST as addLines } from '@/app/api/shipping/shipments/[id]/lines/route';
import { GET as listPackingUnits, POST as createPackingUnit } from '@/app/api/shipping/packing-units/route';
import { GET as listContainers, POST as createContainer } from '@/app/api/shipping/containers/route';
import { GET as getContainer, PATCH as patchContainer } from '@/app/api/shipping/containers/[id]/route';
import { POST as allocate } from '@/app/api/shipping/containers/[id]/allocations/route';

// ================================================================
// SHIPMENTS
// ================================================================
describe('Shipping Routes', () => {
  beforeEach(() => vi.clearAllMocks());

  // ── Shipment List ─────────────────────────────────────────────
  describe('GET /api/shipping/shipments', () => {
    it('should return paginated shipments', async () => {
      mockPrisma.shipments.findMany.mockResolvedValue([
        { id: uuid(1), shipment_no: 'SH-000001', status: 'draft', shipment_lines: [], containers: [] },
      ]);
      mockPrisma.shipments.count.mockResolvedValue(1);

      const res = await listShipments(createRequest('/api/shipping/shipments'));
      const { status, body } = await parseResponse(res);

      expect(status).toBe(200);
      expect(body.data).toHaveLength(1);
      expect(body.total).toBe(1);
    });

    it('should return empty list', async () => {
      mockPrisma.shipments.findMany.mockResolvedValue([]);
      mockPrisma.shipments.count.mockResolvedValue(0);

      const res = await listShipments(createRequest('/api/shipping/shipments'));
      const { status, body } = await parseResponse(res);

      expect(status).toBe(200);
      expect(body.data).toEqual([]);
      expect(body.total).toBe(0);
    });

    it('should filter by status', async () => {
      mockPrisma.shipments.findMany.mockResolvedValue([]);
      mockPrisma.shipments.count.mockResolvedValue(0);

      await listShipments(createRequest('/api/shipping/shipments?status=shipped'));

      expect(mockPrisma.shipments.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ status: 'shipped' }) }),
      );
    });

    it('should filter by customerId', async () => {
      mockPrisma.shipments.findMany.mockResolvedValue([]);
      mockPrisma.shipments.count.mockResolvedValue(0);

      await listShipments(createRequest(`/api/shipping/shipments?customerId=${uuid(5)}`));

      expect(mockPrisma.shipments.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ customer_id: uuid(5) }) }),
      );
    });
  });

  // ── Create Shipment ───────────────────────────────────────────
  describe('POST /api/shipping/shipments', () => {
    it('should create a shipment', async () => {
      mockPrisma.customers.findFirst.mockResolvedValue({ id: uuid(5) });
      mockPrisma.shipments.count.mockResolvedValue(0);
      mockPrisma.shipments.create.mockResolvedValue({
        id: uuid(1),
        shipment_no: 'SH-000001',
        customer_id: uuid(5),
        status: 'draft',
        priority: 'normal',
        shipment_type: 'sea',
        shipment_lines: [],
        containers: [],
      });

      const res = await createShipment(createRequest('/api/shipping/shipments', {
        method: 'POST',
        body: { customerId: uuid(5), etd: '2026-05-01', shipmentType: 'sea' },
      }));
      const { status, body } = await parseResponse(res);

      expect(status).toBe(201);
      expect(body.shipment_no).toBe('SH-000001');
    });

    it('should return 400 if customerId is missing', async () => {
      const res = await createShipment(createRequest('/api/shipping/shipments', {
        method: 'POST',
        body: {},
      }));
      expect(res.status).toBe(400);
    });

    it('should return 404 if customer not found', async () => {
      mockPrisma.customers.findFirst.mockResolvedValue(null);

      const res = await createShipment(createRequest('/api/shipping/shipments', {
        method: 'POST',
        body: { customerId: uuid(99) },
      }));
      expect(res.status).toBe(404);
    });

    it('should reject invalid priority', async () => {
      const res = await createShipment(createRequest('/api/shipping/shipments', {
        method: 'POST',
        body: { customerId: uuid(5), priority: 'xxx' },
      }));
      expect(res.status).toBe(400);
    });

    it('should reject invalid shipmentType', async () => {
      const res = await createShipment(createRequest('/api/shipping/shipments', {
        method: 'POST',
        body: { customerId: uuid(5), shipmentType: 'teleport' },
      }));
      expect(res.status).toBe(400);
    });
  });

  // ── Shipment Detail ───────────────────────────────────────────
  describe('GET /api/shipping/shipments/[id]', () => {
    it('should return shipment detail', async () => {
      mockPrisma.shipments.findUnique.mockResolvedValue({
        id: uuid(1),
        tenant_id: TEST_TENANT_ID,
        shipment_no: 'SH-000001',
        shipment_lines: [],
        containers: [],
      });

      const res = await getShipment(createRequest('/api/shipping/shipments/x'), createRouteContext({ id: uuid(1) }));
      const { status, body } = await parseResponse(res);

      expect(status).toBe(200);
      expect(body.shipment_no).toBe('SH-000001');
    });

    it('should return 404 for missing shipment', async () => {
      mockPrisma.shipments.findUnique.mockResolvedValue(null);

      const res = await getShipment(createRequest('/api/shipping/shipments/x'), createRouteContext({ id: uuid(99) }));
      expect(res.status).toBe(404);
    });

    it('should return 404 for wrong tenant', async () => {
      mockPrisma.shipments.findUnique.mockResolvedValue({
        id: uuid(1),
        tenant_id: uuid(99),
      });

      const res = await getShipment(createRequest('/api/shipping/shipments/x'), createRouteContext({ id: uuid(1) }));
      expect(res.status).toBe(404);
    });
  });

  // ── Shipment Status Transitions ───────────────────────────────
  describe('PATCH /api/shipping/shipments/[id]', () => {
    it('should transition draft → planned', async () => {
      mockPrisma.shipments.findUnique.mockResolvedValue({
        id: uuid(1), tenant_id: TEST_TENANT_ID, status: 'draft',
      });
      mockPrisma.shipments.update.mockResolvedValue({
        id: uuid(1), status: 'planned', shipment_lines: [], containers: [],
      });

      const res = await patchShipment(
        createRequest('/api/shipping/shipments/x', { method: 'PATCH', body: { status: 'planned' } }),
        createRouteContext({ id: uuid(1) }),
      );
      expect(res.status).toBe(200);
    });

    it('should reject draft → shipped (invalid transition)', async () => {
      mockPrisma.shipments.findUnique.mockResolvedValue({
        id: uuid(1), tenant_id: TEST_TENANT_ID, status: 'draft',
      });

      const res = await patchShipment(
        createRequest('/api/shipping/shipments/x', { method: 'PATCH', body: { status: 'shipped' } }),
        createRouteContext({ id: uuid(1) }),
      );
      expect(res.status).toBe(400);
    });

    it('should reject invalid status value', async () => {
      mockPrisma.shipments.findUnique.mockResolvedValue({
        id: uuid(1), tenant_id: TEST_TENANT_ID, status: 'draft',
      });

      const res = await patchShipment(
        createRequest('/api/shipping/shipments/x', { method: 'PATCH', body: { status: 'flying' } }),
        createRouteContext({ id: uuid(1) }),
      );
      expect(res.status).toBe(400);
    });

    it('should return 404 for missing shipment', async () => {
      mockPrisma.shipments.findUnique.mockResolvedValue(null);

      const res = await patchShipment(
        createRequest('/api/shipping/shipments/x', { method: 'PATCH', body: { status: 'planned' } }),
        createRouteContext({ id: uuid(99) }),
      );
      expect(res.status).toBe(404);
    });

    it('should update notes and etd without status change', async () => {
      mockPrisma.shipments.findUnique.mockResolvedValue({
        id: uuid(1), tenant_id: TEST_TENANT_ID, status: 'draft',
      });
      mockPrisma.shipments.update.mockResolvedValue({
        id: uuid(1), notes: 'updated', shipment_lines: [], containers: [],
      });

      const res = await patchShipment(
        createRequest('/api/shipping/shipments/x', {
          method: 'PATCH',
          body: { notes: 'updated', etd: '2026-06-01' },
        }),
        createRouteContext({ id: uuid(1) }),
      );
      expect(res.status).toBe(200);
    });
  });

  // ── Shipment Lines ────────────────────────────────────────────
  describe('POST /api/shipping/shipments/[id]/lines', () => {
    it('should add lines to draft shipment', async () => {
      mockPrisma.shipments.findUnique.mockResolvedValue({
        id: uuid(1), tenant_id: TEST_TENANT_ID, status: 'draft',
      });
      const line = { id: uuid(10), shipment_id: uuid(1), ship_qty: 100 };
      mockPrisma.$transaction.mockResolvedValue([line]);

      const res = await addLines(
        createRequest('/api/shipping/shipments/x/lines', {
          method: 'POST',
          body: { lines: [{ salesOrderLineId: uuid(20), shipQty: 100 }] },
        }),
        createRouteContext({ id: uuid(1) }),
      );
      const { status, body } = await parseResponse(res);

      expect(status).toBe(201);
      expect(body.data).toHaveLength(1);
    });

    it('should reject lines on locked shipment', async () => {
      mockPrisma.shipments.findUnique.mockResolvedValue({
        id: uuid(1), tenant_id: TEST_TENANT_ID, status: 'locked',
      });

      const res = await addLines(
        createRequest('/api/shipping/shipments/x/lines', {
          method: 'POST',
          body: { lines: [{ salesOrderLineId: uuid(20), shipQty: 100 }] },
        }),
        createRouteContext({ id: uuid(1) }),
      );
      expect(res.status).toBe(400);
    });

    it('should reject empty lines array', async () => {
      mockPrisma.shipments.findUnique.mockResolvedValue({
        id: uuid(1), tenant_id: TEST_TENANT_ID, status: 'draft',
      });

      const res = await addLines(
        createRequest('/api/shipping/shipments/x/lines', {
          method: 'POST',
          body: { lines: [] },
        }),
        createRouteContext({ id: uuid(1) }),
      );
      expect(res.status).toBe(400);
    });
  });

  // ── Packing Units ────────────────────────────────────────────
  describe('GET /api/shipping/packing-units', () => {
    it('should return paginated packing units', async () => {
      mockPrisma.packing_units.findMany.mockResolvedValue([
        { id: uuid(1), packing_unit_no: 'PU-000001', status: 'packed' },
      ]);
      mockPrisma.packing_units.count.mockResolvedValue(1);

      const res = await listPackingUnits(createRequest('/api/shipping/packing-units'));
      const { status, body } = await parseResponse(res);

      expect(status).toBe(200);
      expect(body.data).toHaveLength(1);
    });

    it('should filter by status and salesOrderLineId', async () => {
      mockPrisma.packing_units.findMany.mockResolvedValue([]);
      mockPrisma.packing_units.count.mockResolvedValue(0);

      await listPackingUnits(createRequest(`/api/shipping/packing-units?status=allocated&salesOrderLineId=${uuid(5)}`));

      expect(mockPrisma.packing_units.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'allocated', sales_order_line_id: uuid(5) }),
        }),
      );
    });
  });

  describe('POST /api/shipping/packing-units', () => {
    it('should create a packing unit', async () => {
      mockPrisma.packing_units.count.mockResolvedValue(0);
      mockPrisma.packing_units.create.mockResolvedValue({
        id: uuid(1), packing_unit_no: 'PU-000001', status: 'packed', quantity: 50,
      });

      const res = await createPackingUnit(createRequest('/api/shipping/packing-units', {
        method: 'POST',
        body: {
          salesOrderLineId: uuid(20),
          productId: uuid(30),
          quantity: 50,
          cartonNo: 'CTN-001',
          lengthMm: 1200,
          widthMm: 800,
          heightMm: 600,
          grossWeightKg: 45.5,
          cbm: 0.576,
        },
      }));
      const { status, body } = await parseResponse(res);

      expect(status).toBe(201);
      expect(body.packing_unit_no).toBe('PU-000001');
    });

    it('should return 400 if salesOrderLineId missing', async () => {
      const res = await createPackingUnit(createRequest('/api/shipping/packing-units', {
        method: 'POST',
        body: { productId: uuid(30), quantity: 50 },
      }));
      expect(res.status).toBe(400);
    });

    it('should return 400 if quantity is 0', async () => {
      const res = await createPackingUnit(createRequest('/api/shipping/packing-units', {
        method: 'POST',
        body: { salesOrderLineId: uuid(20), productId: uuid(30), quantity: 0 },
      }));
      expect(res.status).toBe(400);
    });
  });

  // ── Containers ────────────────────────────────────────────────
  describe('GET /api/shipping/containers', () => {
    it('should return paginated containers', async () => {
      mockPrisma.containers.findMany.mockResolvedValue([
        { id: uuid(1), container_type: '40HQ', status: 'open', container_allocations: [] },
      ]);
      mockPrisma.containers.count.mockResolvedValue(1);

      const res = await listContainers(createRequest('/api/shipping/containers'));
      const { status, body } = await parseResponse(res);

      expect(status).toBe(200);
      expect(body.data).toHaveLength(1);
    });
  });

  describe('POST /api/shipping/containers', () => {
    it('should create a container', async () => {
      mockPrisma.containers.create.mockResolvedValue({
        id: uuid(1), container_type: '40HQ', status: 'open', max_cbm: 67.5, container_allocations: [],
      });

      const res = await createContainer(createRequest('/api/shipping/containers', {
        method: 'POST',
        body: { containerType: '40HQ', maxCbm: 67.5, maxWeightKg: 26000 },
      }));
      const { status, body } = await parseResponse(res);

      expect(status).toBe(201);
      expect(body.container_type).toBe('40HQ');
    });

    it('should return 400 if containerType missing', async () => {
      const res = await createContainer(createRequest('/api/shipping/containers', {
        method: 'POST',
        body: {},
      }));
      expect(res.status).toBe(400);
    });

    it('should reject invalid containerType', async () => {
      const res = await createContainer(createRequest('/api/shipping/containers', {
        method: 'POST',
        body: { containerType: '50XX' },
      }));
      expect(res.status).toBe(400);
    });
  });

  // ── Container Detail & PATCH ──────────────────────────────────
  describe('GET /api/shipping/containers/[id]', () => {
    it('should return container detail', async () => {
      mockPrisma.containers.findUnique.mockResolvedValue({
        id: uuid(1), tenant_id: TEST_TENANT_ID, container_type: '20GP',
        container_allocations: [], shipments: null,
      });

      const res = await getContainer(
        createRequest('/api/shipping/containers/x'),
        createRouteContext({ id: uuid(1) }),
      );
      expect(res.status).toBe(200);
    });

    it('should return 404 for missing container', async () => {
      mockPrisma.containers.findUnique.mockResolvedValue(null);

      const res = await getContainer(
        createRequest('/api/shipping/containers/x'),
        createRouteContext({ id: uuid(99) }),
      );
      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /api/shipping/containers/[id]', () => {
    it('should update container status', async () => {
      mockPrisma.containers.findUnique.mockResolvedValue({
        id: uuid(1), tenant_id: TEST_TENANT_ID, status: 'open',
      });
      mockPrisma.containers.update.mockResolvedValue({
        id: uuid(1), status: 'locked', container_allocations: [],
      });

      const res = await patchContainer(
        createRequest('/api/shipping/containers/x', { method: 'PATCH', body: { status: 'locked' } }),
        createRouteContext({ id: uuid(1) }),
      );
      expect(res.status).toBe(200);
    });

    it('should reject invalid status', async () => {
      mockPrisma.containers.findUnique.mockResolvedValue({
        id: uuid(1), tenant_id: TEST_TENANT_ID, status: 'open',
      });

      const res = await patchContainer(
        createRequest('/api/shipping/containers/x', { method: 'PATCH', body: { status: 'flying' } }),
        createRouteContext({ id: uuid(1) }),
      );
      expect(res.status).toBe(400);
    });
  });

  // ── Container Allocations ─────────────────────────────────────
  describe('POST /api/shipping/containers/[id]/allocations', () => {
    it('should allocate packing units to open container', async () => {
      mockPrisma.containers.findUnique.mockResolvedValue({
        id: uuid(1), tenant_id: TEST_TENANT_ID, status: 'open',
      });
      mockPrisma.container_allocations.aggregate.mockResolvedValue({ _max: { allocation_seq: 0 } });
      const alloc = { id: uuid(100), container_id: uuid(1), packing_unit_id: uuid(10) };
      mockPrisma.$transaction.mockResolvedValue([alloc]);
      mockPrisma.packing_units.updateMany.mockResolvedValue({ count: 1 });

      const res = await allocate(
        createRequest('/api/shipping/containers/x/allocations', {
          method: 'POST',
          body: { allocations: [{ packingUnitId: uuid(10), allocatedCbm: 0.5 }] },
        }),
        createRouteContext({ id: uuid(1) }),
      );
      const { status, body } = await parseResponse(res);

      expect(status).toBe(201);
      expect(body.data).toHaveLength(1);
    });

    it('should reject allocation to locked container', async () => {
      mockPrisma.containers.findUnique.mockResolvedValue({
        id: uuid(1), tenant_id: TEST_TENANT_ID, status: 'locked',
      });

      const res = await allocate(
        createRequest('/api/shipping/containers/x/allocations', {
          method: 'POST',
          body: { allocations: [{ packingUnitId: uuid(10) }] },
        }),
        createRouteContext({ id: uuid(1) }),
      );
      expect(res.status).toBe(400);
    });

    it('should reject empty allocations array', async () => {
      mockPrisma.containers.findUnique.mockResolvedValue({
        id: uuid(1), tenant_id: TEST_TENANT_ID, status: 'open',
      });

      const res = await allocate(
        createRequest('/api/shipping/containers/x/allocations', {
          method: 'POST',
          body: { allocations: [] },
        }),
        createRouteContext({ id: uuid(1) }),
      );
      expect(res.status).toBe(400);
    });
  });
});
