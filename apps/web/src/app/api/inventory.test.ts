import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createRequest, parseResponse, setupEnv, createRouteContext, uuid, TEST_TENANT_ID } from '@/__tests__/helpers';
import { Prisma } from '@nkc/database';

// --- Mock Prisma ---
const { mockTx, mockPrisma } = vi.hoisted(() => {
  const mockTx = {
    stock_transactions: { create: vi.fn() },
    stock_balances: { findFirst: vi.fn(), update: vi.fn(), create: vi.fn() },
    inventory_reservations: { create: vi.fn(), update: vi.fn() },
  };

  const mockPrisma = {
    warehouses: {
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    bin_locations: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    lots: {
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
    },
    stock_transactions: {
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
    },
    stock_balances: {
      findMany: vi.fn(),
      count: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
    },
    inventory_reservations: {
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn(async (fn: (tx: typeof mockTx) => Promise<unknown>) => fn(mockTx)),
  };

  return { mockTx, mockPrisma };
});

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));
vi.mock('@nkc/utils', () => ({
  generateOrderNumber: vi.fn((prefix: string, n: number) => `${prefix}-0000-${String(n).padStart(5, '0')}`),
}));
setupEnv();

// --- Route Imports ---
import { GET as getWarehouses, POST as createWarehouse } from '@/app/api/inventory/warehouses/route';
import { GET as getWarehouseById, PATCH as patchWarehouse } from '@/app/api/inventory/warehouses/[id]/route';
import { GET as getBins, POST as createBin } from '@/app/api/inventory/warehouses/[id]/bins/route';
import { GET as getLots, POST as createLot } from '@/app/api/inventory/lots/route';
import { GET as getTransactions, POST as createTransaction } from '@/app/api/inventory/transactions/route';
import { GET as getStockBalances } from '@/app/api/inventory/stock-balances/route';
import { GET as getReservations, POST as createReservation } from '@/app/api/inventory/reservations/route';
import { POST as releaseReservation } from '@/app/api/inventory/reservations/[id]/release/route';
import { POST as consumeReservation } from '@/app/api/inventory/reservations/[id]/consume/route';

// =============================================================================
// WAREHOUSE ROUTES
// =============================================================================
describe('Warehouse Routes', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('GET /api/inventory/warehouses', () => {
    it('should return paginated warehouses', async () => {
      const warehouses = [{ id: uuid(1), warehouse_code: 'WH-001', bin_locations: [] }];
      mockPrisma.warehouses.findMany.mockResolvedValue(warehouses);
      mockPrisma.warehouses.count.mockResolvedValue(1);

      const req = createRequest('/api/inventory/warehouses');
      const res = await getWarehouses(req);
      const { status, body } = await parseResponse(res);

      expect(status).toBe(200);
      expect(body.data).toHaveLength(1);
      expect(body.data[0].warehouse_code).toBe('WH-001');
    });

    it('should return empty list', async () => {
      mockPrisma.warehouses.findMany.mockResolvedValue([]);
      mockPrisma.warehouses.count.mockResolvedValue(0);

      const req = createRequest('/api/inventory/warehouses');
      const res = await getWarehouses(req);
      const { status, body } = await parseResponse(res);

      expect(status).toBe(200);
      expect(body.data).toEqual([]);
      expect(body.total).toBe(0);
    });
  });

  describe('POST /api/inventory/warehouses', () => {
    it('should create a warehouse', async () => {
      mockPrisma.warehouses.create.mockResolvedValue({
        id: uuid(1), warehouse_code: 'WH-NEW', warehouse_name: 'New Warehouse', bin_locations: [],
      });

      const req = createRequest('/api/inventory/warehouses', {
        method: 'POST',
        body: { warehouseCode: 'WH-NEW', warehouseName: 'New Warehouse' },
      });
      const res = await createWarehouse(req);
      const { status, body } = await parseResponse(res);

      expect(status).toBe(201);
      expect(body.warehouse_code).toBe('WH-NEW');
    });

    it('should return 400 without required fields', async () => {
      const req = createRequest('/api/inventory/warehouses', {
        method: 'POST',
        body: { warehouseCode: 'WH-001' }, // missing warehouseName
      });
      const res = await createWarehouse(req);
      const { status } = await parseResponse(res);

      expect(status).toBe(400);
    });

    it('should create with all optional fields', async () => {
      mockPrisma.warehouses.create.mockResolvedValue({
        id: uuid(1), warehouse_code: 'WH-FULL', warehouse_name: 'Full Warehouse',
        address: '123 Main St', is_active: true, bin_locations: [],
      });

      const req = createRequest('/api/inventory/warehouses', {
        method: 'POST',
        body: { warehouseCode: 'WH-FULL', warehouseName: 'Full Warehouse', address: '123 Main St' },
      });
      const res = await createWarehouse(req);
      const { status } = await parseResponse(res);

      expect(status).toBe(201);
    });
  });

  describe('GET /api/inventory/warehouses/[id]', () => {
    it('should return warehouse with bins and balances', async () => {
      mockPrisma.warehouses.findFirst.mockResolvedValue({
        id: uuid(1), warehouse_code: 'WH-001', bin_locations: [], stock_balances: [],
      });

      const req = createRequest('/api/inventory/warehouses/' + uuid(1));
      const res = await getWarehouseById(req, createRouteContext({ id: uuid(1) }));
      const { status, body } = await parseResponse(res);

      expect(status).toBe(200);
      expect(body.warehouse_code).toBe('WH-001');
    });

    it('should return 404 when not found', async () => {
      mockPrisma.warehouses.findFirst.mockResolvedValue(null);

      const req = createRequest('/api/inventory/warehouses/' + uuid(99));
      const res = await getWarehouseById(req, createRouteContext({ id: uuid(99) }));
      const { status } = await parseResponse(res);

      expect(status).toBe(404);
    });

    it('should return warehouse with populated bins and stock balances', async () => {
      mockPrisma.warehouses.findFirst.mockResolvedValue({
        id: uuid(1),
        warehouse_code: 'WH-001',
        bin_locations: [
          { id: uuid(2), bin_code: 'A1' },
          { id: uuid(3), bin_code: 'A2' },
        ],
        stock_balances: [
          { id: uuid(4), item_id: uuid(20), on_hand_qty: 100, reserved_qty: 10 },
        ],
      });

      const req = createRequest('/api/inventory/warehouses/' + uuid(1));
      const res = await getWarehouseById(req, createRouteContext({ id: uuid(1) }));
      const { status, body } = await parseResponse(res);

      expect(status).toBe(200);
      expect(body.bin_locations).toHaveLength(2);
      expect(body.stock_balances).toHaveLength(1);
    });
  });

  describe('PATCH /api/inventory/warehouses/[id]', () => {
    it('should update warehouse', async () => {
      mockPrisma.warehouses.findFirst.mockResolvedValue({ id: uuid(1), tenant_id: TEST_TENANT_ID });
      mockPrisma.warehouses.update.mockResolvedValue({
        id: uuid(1), warehouse_name: 'Updated Name', bin_locations: [],
      });

      const req = createRequest('/api/inventory/warehouses/' + uuid(1), {
        method: 'PATCH',
        body: { warehouseName: 'Updated Name' },
      });
      const res = await patchWarehouse(req, createRouteContext({ id: uuid(1) }));
      const { status, body } = await parseResponse(res);

      expect(status).toBe(200);
      expect(body.warehouse_name).toBe('Updated Name');
    });

    it('should return 400 without any update field', async () => {
      mockPrisma.warehouses.findFirst.mockResolvedValue({ id: uuid(1), tenant_id: TEST_TENANT_ID });

      const req = createRequest('/api/inventory/warehouses/' + uuid(1), {
        method: 'PATCH',
        body: {},
      });
      const res = await patchWarehouse(req, createRouteContext({ id: uuid(1) }));
      const { status } = await parseResponse(res);

      expect(status).toBe(400);
    });

    it('should return 404 for non-existent warehouse', async () => {
      mockPrisma.warehouses.findFirst.mockResolvedValue(null);

      const req = createRequest('/api/inventory/warehouses/' + uuid(99), {
        method: 'PATCH',
        body: { warehouseName: 'Does Not Exist' },
      });
      const res = await patchWarehouse(req, createRouteContext({ id: uuid(99) }));
      const { status } = await parseResponse(res);

      expect(status).toBe(404);
    });
  });
});

// =============================================================================
// BIN ROUTES
// =============================================================================
describe('Bin Routes', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('GET /api/inventory/warehouses/[id]/bins', () => {
    it('should return bins for a warehouse', async () => {
      mockPrisma.warehouses.findFirst.mockResolvedValue({ id: uuid(1) });
      mockPrisma.bin_locations.findMany.mockResolvedValue([
        { id: uuid(2), bin_code: 'BIN-A1', warehouse_id: uuid(1) },
      ]);

      const req = createRequest('/api/inventory/warehouses/' + uuid(1) + '/bins');
      const res = await getBins(req, createRouteContext({ id: uuid(1) }));
      const { status, body } = await parseResponse(res);

      expect(status).toBe(200);
      expect(body.data).toHaveLength(1);
      expect(body.data[0].bin_code).toBe('BIN-A1');
    });

    it('should return 404 if warehouse not found', async () => {
      mockPrisma.warehouses.findFirst.mockResolvedValue(null);

      const req = createRequest('/api/inventory/warehouses/' + uuid(99) + '/bins');
      const res = await getBins(req, createRouteContext({ id: uuid(99) }));
      const { status } = await parseResponse(res);

      expect(status).toBe(404);
    });
  });

  describe('POST /api/inventory/warehouses/[id]/bins', () => {
    it('should create a bin in a warehouse', async () => {
      mockPrisma.warehouses.findFirst.mockResolvedValue({ id: uuid(1) });
      mockPrisma.bin_locations.create.mockResolvedValue({
        id: uuid(2), bin_code: 'BIN-B1', warehouse_id: uuid(1),
      });

      const req = createRequest('/api/inventory/warehouses/' + uuid(1) + '/bins', {
        method: 'POST',
        body: { binCode: 'BIN-B1' },
      });
      const res = await createBin(req, createRouteContext({ id: uuid(1) }));
      const { status, body } = await parseResponse(res);

      expect(status).toBe(201);
      expect(body.bin_code).toBe('BIN-B1');
    });

    it('should return 400 without binCode', async () => {
      mockPrisma.warehouses.findFirst.mockResolvedValue({ id: uuid(1) });

      const req = createRequest('/api/inventory/warehouses/' + uuid(1) + '/bins', {
        method: 'POST',
        body: {},
      });
      const res = await createBin(req, createRouteContext({ id: uuid(1) }));
      const { status } = await parseResponse(res);

      expect(status).toBe(400);
    });
  });
});

// =============================================================================
// LOT ROUTES
// =============================================================================
describe('Lot Routes', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('GET /api/inventory/lots', () => {
    it('should return paginated lots', async () => {
      mockPrisma.lots.findMany.mockResolvedValue([{ id: uuid(1), lot_no: 'LOT-001' }]);
      mockPrisma.lots.count.mockResolvedValue(1);

      const req = createRequest('/api/inventory/lots');
      const res = await getLots(req);
      const { status, body } = await parseResponse(res);

      expect(status).toBe(200);
      expect(body.data[0].lot_no).toBe('LOT-001');
    });
  });

  describe('POST /api/inventory/lots', () => {
    it('should create a lot', async () => {
      mockPrisma.lots.create.mockResolvedValue({
        id: uuid(1), lot_no: 'LOT-NEW', item_id: uuid(10),
      });

      const req = createRequest('/api/inventory/lots', {
        method: 'POST',
        body: { itemId: uuid(10), lotNo: 'LOT-NEW' },
      });
      const res = await createLot(req);
      const { status, body } = await parseResponse(res);

      expect(status).toBe(201);
      expect(body.lot_no).toBe('LOT-NEW');
    });

    it('should return 400 without required fields', async () => {
      const req = createRequest('/api/inventory/lots', {
        method: 'POST',
        body: { itemId: uuid(10) }, // missing lotNo
      });
      const res = await createLot(req);
      const { status } = await parseResponse(res);

      expect(status).toBe(400);
    });
  });
});

// =============================================================================
// STOCK TRANSACTION ROUTES
// =============================================================================
describe('Stock Transaction Routes', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('GET /api/inventory/transactions', () => {
    it('should return paginated transactions', async () => {
      mockPrisma.stock_transactions.findMany.mockResolvedValue([
        { id: uuid(1), transaction_no: 'TX-0000-00001', transaction_type: 'receive' },
      ]);
      mockPrisma.stock_transactions.count.mockResolvedValue(1);

      const req = createRequest('/api/inventory/transactions');
      const res = await getTransactions(req);
      const { status, body } = await parseResponse(res);

      expect(status).toBe(200);
      expect(body.data[0].transaction_type).toBe('receive');
    });

    it('should return empty when no transactions', async () => {
      mockPrisma.stock_transactions.findMany.mockResolvedValue([]);
      mockPrisma.stock_transactions.count.mockResolvedValue(0);

      const req = createRequest('/api/inventory/transactions');
      const res = await getTransactions(req);
      const { status, body } = await parseResponse(res);

      expect(status).toBe(200);
      expect(body.data).toEqual([]);
    });

    it('should filter by itemId and type', async () => {
      mockPrisma.stock_transactions.findMany.mockResolvedValue([]);
      mockPrisma.stock_transactions.count.mockResolvedValue(0);

      const req = createRequest(`/api/inventory/transactions?itemId=${uuid(20)}&type=receive`);
      const res = await getTransactions(req);
      const { status } = await parseResponse(res);

      expect(status).toBe(200);
      expect(mockPrisma.stock_transactions.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            item_id: uuid(20),
            transaction_type: 'receive',
          }),
        }),
      );
    });
  });

  describe('POST /api/inventory/transactions', () => {
    it('should create a receive transaction and upsert balance', async () => {
      mockPrisma.stock_transactions.count.mockResolvedValue(0);
      mockTx.stock_transactions.create.mockResolvedValue({
        id: uuid(1), transaction_no: 'TX-0000-00001', transaction_type: 'receive',
      });
      mockTx.stock_balances.findFirst.mockResolvedValue(null);
      mockTx.stock_balances.create.mockResolvedValue({});

      const req = createRequest('/api/inventory/transactions', {
        method: 'POST',
        body: {
          transactionType: 'receive',
          warehouseId: uuid(10),
          itemId: uuid(20),
          quantity: 100,
          uomCode: 'PC',
        },
      });
      const res = await createTransaction(req);
      const { status, body } = await parseResponse(res);

      expect(status).toBe(201);
      expect(mockTx.stock_transactions.create).toHaveBeenCalled();
      expect(mockTx.stock_balances.create).toHaveBeenCalled();
    });

    it('should update existing stock balance on receive', async () => {
      mockPrisma.stock_transactions.count.mockResolvedValue(5);
      mockTx.stock_transactions.create.mockResolvedValue({
        id: uuid(1), transaction_type: 'receive',
      });
      mockTx.stock_balances.findFirst.mockResolvedValue({
        id: uuid(50),
        on_hand_qty: new Prisma.Decimal(100),
        reserved_qty: new Prisma.Decimal(0),
      });
      mockTx.stock_balances.update.mockResolvedValue({});

      const req = createRequest('/api/inventory/transactions', {
        method: 'POST',
        body: {
          transactionType: 'receive',
          warehouseId: uuid(10),
          itemId: uuid(20),
          quantity: 50,
          uomCode: 'PC',
        },
      });
      const res = await createTransaction(req);
      const { status } = await parseResponse(res);

      expect(status).toBe(201);
      expect(mockTx.stock_balances.update).toHaveBeenCalled();
    });

    it('should create an issue transaction and decrement balance', async () => {
      mockPrisma.stock_transactions.count.mockResolvedValue(0);
      mockTx.stock_transactions.create.mockResolvedValue({
        id: uuid(1), transaction_type: 'issue',
      });
      mockTx.stock_balances.findFirst.mockResolvedValue({
        id: uuid(50),
        on_hand_qty: new Prisma.Decimal(200),
        reserved_qty: new Prisma.Decimal(0),
      });
      mockTx.stock_balances.update.mockResolvedValue({});

      const req = createRequest('/api/inventory/transactions', {
        method: 'POST',
        body: {
          transactionType: 'issue',
          warehouseId: uuid(10),
          itemId: uuid(20),
          quantity: 50,
          uomCode: 'PC',
        },
      });
      const res = await createTransaction(req);
      const { status } = await parseResponse(res);

      expect(status).toBe(201);
      expect(mockTx.stock_balances.update).toHaveBeenCalled();
    });

    it('should handle adjustment transaction', async () => {
      mockPrisma.stock_transactions.count.mockResolvedValue(0);
      mockTx.stock_transactions.create.mockResolvedValue({
        id: uuid(1), transaction_type: 'adjustment',
      });
      mockTx.stock_balances.findFirst.mockResolvedValue({
        id: uuid(50),
        on_hand_qty: new Prisma.Decimal(100),
        reserved_qty: new Prisma.Decimal(0),
      });
      mockTx.stock_balances.update.mockResolvedValue({});

      const req = createRequest('/api/inventory/transactions', {
        method: 'POST',
        body: {
          transactionType: 'adjustment',
          warehouseId: uuid(10),
          itemId: uuid(20),
          quantity: 25,
          uomCode: 'PC',
          reason: 'Physical count adjustment',
        },
      });
      const res = await createTransaction(req);
      const { status } = await parseResponse(res);

      expect(status).toBe(201);
    });

    it('should handle reserve transaction (updates reserved_qty only)', async () => {
      mockPrisma.stock_transactions.count.mockResolvedValue(0);
      mockTx.stock_transactions.create.mockResolvedValue({
        id: uuid(1), transaction_type: 'reserve',
      });
      mockTx.stock_balances.findFirst.mockResolvedValue({
        id: uuid(50),
        on_hand_qty: new Prisma.Decimal(100),
        reserved_qty: new Prisma.Decimal(10),
      });
      mockTx.stock_balances.update.mockResolvedValue({});

      const req = createRequest('/api/inventory/transactions', {
        method: 'POST',
        body: {
          transactionType: 'reserve',
          warehouseId: uuid(10),
          itemId: uuid(20),
          quantity: 20,
          uomCode: 'PC',
        },
      });
      const res = await createTransaction(req);
      const { status } = await parseResponse(res);

      expect(status).toBe(201);
    });

    it('should handle unreserve transaction', async () => {
      mockPrisma.stock_transactions.count.mockResolvedValue(0);
      mockTx.stock_transactions.create.mockResolvedValue({
        id: uuid(1), transaction_type: 'unreserve',
      });
      mockTx.stock_balances.findFirst.mockResolvedValue({
        id: uuid(50),
        on_hand_qty: new Prisma.Decimal(100),
        reserved_qty: new Prisma.Decimal(30),
      });
      mockTx.stock_balances.update.mockResolvedValue({});

      const req = createRequest('/api/inventory/transactions', {
        method: 'POST',
        body: {
          transactionType: 'unreserve',
          warehouseId: uuid(10),
          itemId: uuid(20),
          quantity: 15,
          uomCode: 'PC',
        },
      });
      const res = await createTransaction(req);
      const { status } = await parseResponse(res);

      expect(status).toBe(201);
    });

    it('should create transfer with toWarehouseId', async () => {
      mockPrisma.stock_transactions.count.mockResolvedValue(0);
      mockTx.stock_transactions.create.mockResolvedValue({
        id: uuid(1), transaction_type: 'transfer',
      });
      mockTx.stock_balances.findFirst.mockResolvedValue(null);
      mockTx.stock_balances.create.mockResolvedValue({});

      const req = createRequest('/api/inventory/transactions', {
        method: 'POST',
        body: {
          transactionType: 'transfer',
          warehouseId: uuid(10),
          toWarehouseId: uuid(11),
          itemId: uuid(20),
          quantity: 30,
          uomCode: 'PC',
        },
      });
      const res = await createTransaction(req);
      const { status } = await parseResponse(res);

      expect(status).toBe(201);
      // Transfer creates 2 stock_transactions (source issue + target receive)
      expect(mockTx.stock_transactions.create).toHaveBeenCalledTimes(2);
    });

    it('should return 400 for invalid transaction type', async () => {
      const req = createRequest('/api/inventory/transactions', {
        method: 'POST',
        body: {
          transactionType: 'invalid',
          warehouseId: uuid(10),
          itemId: uuid(20),
          quantity: 10,
          uomCode: 'PC',
        },
      });
      const res = await createTransaction(req);
      const { status } = await parseResponse(res);

      expect(status).toBe(400);
    });

    it('should return 400 for missing required fields', async () => {
      const req = createRequest('/api/inventory/transactions', {
        method: 'POST',
        body: { transactionType: 'receive', warehouseId: uuid(10) },
      });
      const res = await createTransaction(req);
      const { status } = await parseResponse(res);

      expect(status).toBe(400);
    });

    it('should return 400 for non-positive quantity', async () => {
      const req = createRequest('/api/inventory/transactions', {
        method: 'POST',
        body: {
          transactionType: 'receive',
          warehouseId: uuid(10),
          itemId: uuid(20),
          quantity: -5,
          uomCode: 'PC',
        },
      });
      const res = await createTransaction(req);
      const { status } = await parseResponse(res);

      expect(status).toBe(400);
    });

    it('should return 400 for zero quantity', async () => {
      const req = createRequest('/api/inventory/transactions', {
        method: 'POST',
        body: {
          transactionType: 'receive',
          warehouseId: uuid(10),
          itemId: uuid(20),
          quantity: 0,
          uomCode: 'PC',
        },
      });
      const res = await createTransaction(req);
      const { status } = await parseResponse(res);

      expect(status).toBe(400);
    });

    it('should require toWarehouseId for transfer type', async () => {
      mockPrisma.stock_transactions.count.mockResolvedValue(0);
      mockTx.stock_transactions.create.mockResolvedValue({
        id: uuid(1), transaction_type: 'transfer',
      });
      mockTx.stock_balances.findFirst.mockResolvedValue(null);
      mockTx.stock_balances.create.mockResolvedValue({});

      const req = createRequest('/api/inventory/transactions', {
        method: 'POST',
        body: {
          transactionType: 'transfer',
          warehouseId: uuid(10),
          itemId: uuid(20),
          quantity: 10,
          uomCode: 'PC',
          // missing toWarehouseId
        },
      });
      const res = await createTransaction(req);
      const { status } = await parseResponse(res);

      expect(status).toBe(400);
    });

    it('should accept optional binLocationId and lotId', async () => {
      mockPrisma.stock_transactions.count.mockResolvedValue(0);
      mockTx.stock_transactions.create.mockResolvedValue({
        id: uuid(1), transaction_type: 'receive',
      });
      mockTx.stock_balances.findFirst.mockResolvedValue(null);
      mockTx.stock_balances.create.mockResolvedValue({});

      const req = createRequest('/api/inventory/transactions', {
        method: 'POST',
        body: {
          transactionType: 'receive',
          warehouseId: uuid(10),
          binLocationId: uuid(11),
          itemId: uuid(20),
          lotId: uuid(30),
          quantity: 50,
          uomCode: 'PC',
          refType: 'purchase_order',
          refId: uuid(40),
        },
      });
      const res = await createTransaction(req);
      const { status } = await parseResponse(res);

      expect(status).toBe(201);
    });
  });
});

// =============================================================================
// STOCK BALANCE ROUTES
// =============================================================================
describe('Stock Balance Routes', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('GET /api/inventory/stock-balances', () => {
    it('should return paginated balances', async () => {
      mockPrisma.stock_balances.findMany.mockResolvedValue([
        { id: uuid(1), item_id: uuid(20), on_hand_qty: 200, reserved_qty: 50, warehouses: {}, bin_locations: null },
      ]);
      mockPrisma.stock_balances.count.mockResolvedValue(1);

      const req = createRequest('/api/inventory/stock-balances');
      const res = await getStockBalances(req);
      const { status, body } = await parseResponse(res);

      expect(status).toBe(200);
      expect(body.data).toHaveLength(1);
      expect(body.data[0].on_hand_qty).toBe(200);
    });
  });
});

// =============================================================================
// RESERVATION ROUTES
// =============================================================================
describe('Reservation Routes', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('GET /api/inventory/reservations', () => {
    it('should return paginated reservations', async () => {
      mockPrisma.inventory_reservations.findMany.mockResolvedValue([
        { id: uuid(1), item_id: uuid(20), status: 'active', warehouses: {} },
      ]);
      mockPrisma.inventory_reservations.count.mockResolvedValue(1);

      const req = createRequest('/api/inventory/reservations');
      const res = await getReservations(req);
      const { status, body } = await parseResponse(res);

      expect(status).toBe(200);
      expect(body.data).toHaveLength(1);
    });

    it('should return empty list', async () => {
      mockPrisma.inventory_reservations.findMany.mockResolvedValue([]);
      mockPrisma.inventory_reservations.count.mockResolvedValue(0);

      const req = createRequest('/api/inventory/reservations');
      const res = await getReservations(req);
      const { status, body } = await parseResponse(res);

      expect(status).toBe(200);
      expect(body.data).toEqual([]);
    });

    it('should filter by status', async () => {
      mockPrisma.inventory_reservations.findMany.mockResolvedValue([]);
      mockPrisma.inventory_reservations.count.mockResolvedValue(0);

      const req = createRequest('/api/inventory/reservations?status=active');
      const res = await getReservations(req);

      expect(res.status).toBe(200);
      expect(mockPrisma.inventory_reservations.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'active' }),
        }),
      );
    });
  });

  describe('POST /api/inventory/reservations', () => {
    it('should create a reservation and update stock balance', async () => {
      mockTx.inventory_reservations.create.mockResolvedValue({
        id: uuid(1), item_id: uuid(20), status: 'active', warehouses: {},
      });
      mockTx.stock_balances.findFirst.mockResolvedValue({
        id: uuid(50),
        reserved_qty: new Prisma.Decimal(10),
      });
      mockTx.stock_balances.update.mockResolvedValue({});

      const req = createRequest('/api/inventory/reservations', {
        method: 'POST',
        body: {
          itemId: uuid(20),
          warehouseId: uuid(10),
          reservedQty: 50,
          uomCode: 'PC',
          refType: 'sales_order_line',
          refId: uuid(30),
        },
      });
      const res = await createReservation(req);
      const { status, body } = await parseResponse(res);

      expect(status).toBe(201);
      expect(body.status).toBe('active');
    });

    it('should accept work_order refType', async () => {
      mockTx.inventory_reservations.create.mockResolvedValue({
        id: uuid(1), status: 'active', warehouses: {},
      });
      mockTx.stock_balances.findFirst.mockResolvedValue(null);

      const req = createRequest('/api/inventory/reservations', {
        method: 'POST',
        body: {
          itemId: uuid(20),
          warehouseId: uuid(10),
          reservedQty: 30,
          uomCode: 'PC',
          refType: 'work_order',
          refId: uuid(30),
        },
      });
      const res = await createReservation(req);
      const { status } = await parseResponse(res);

      expect(status).toBe(201);
    });

    it('should accept shipment refType', async () => {
      mockTx.inventory_reservations.create.mockResolvedValue({
        id: uuid(1), status: 'active', warehouses: {},
      });
      mockTx.stock_balances.findFirst.mockResolvedValue(null);

      const req = createRequest('/api/inventory/reservations', {
        method: 'POST',
        body: {
          itemId: uuid(20),
          warehouseId: uuid(10),
          reservedQty: 10,
          uomCode: 'PC',
          refType: 'shipment',
          refId: uuid(30),
        },
      });
      const res = await createReservation(req);
      const { status } = await parseResponse(res);

      expect(status).toBe(201);
    });

    it('should return 400 for invalid refType', async () => {
      const req = createRequest('/api/inventory/reservations', {
        method: 'POST',
        body: {
          itemId: uuid(20),
          warehouseId: uuid(10),
          reservedQty: 50,
          uomCode: 'PC',
          refType: 'invalid_type',
          refId: uuid(30),
        },
      });
      const res = await createReservation(req);
      const { status } = await parseResponse(res);

      expect(status).toBe(400);
    });

    it('should return 400 for missing required fields', async () => {
      const req = createRequest('/api/inventory/reservations', {
        method: 'POST',
        body: { itemId: uuid(20) },
      });
      const res = await createReservation(req);
      const { status } = await parseResponse(res);

      expect(status).toBe(400);
    });

    it('should handle reservation when no stock balance exists', async () => {
      mockTx.inventory_reservations.create.mockResolvedValue({
        id: uuid(1), status: 'active', warehouses: {},
      });
      mockTx.stock_balances.findFirst.mockResolvedValue(null);

      const req = createRequest('/api/inventory/reservations', {
        method: 'POST',
        body: {
          itemId: uuid(20),
          warehouseId: uuid(10),
          reservedQty: 50,
          uomCode: 'PC',
          refType: 'sales_order_line',
          refId: uuid(30),
        },
      });
      const res = await createReservation(req);
      const { status } = await parseResponse(res);

      expect(status).toBe(201);
      // When no balance, no update should be called
      expect(mockTx.stock_balances.update).not.toHaveBeenCalled();
    });
  });

  describe('POST /api/inventory/reservations/[id]/release', () => {
    it('should release an active reservation', async () => {
      mockPrisma.inventory_reservations.findFirst.mockResolvedValue({
        id: uuid(1),
        status: 'active',
        tenant_id: TEST_TENANT_ID,
        warehouse_id: uuid(10),
        item_id: uuid(20),
        reserved_qty: new Prisma.Decimal(50),
      });
      mockTx.inventory_reservations.update.mockResolvedValue({
        id: uuid(1), status: 'released',
      });
      mockTx.stock_balances.findFirst.mockResolvedValue({
        id: uuid(50),
        reserved_qty: new Prisma.Decimal(100),
      });
      mockTx.stock_balances.update.mockResolvedValue({});

      const req = createRequest('/api/inventory/reservations/' + uuid(1) + '/release', { method: 'POST' });
      const res = await releaseReservation(req, createRouteContext({ id: uuid(1) }));
      const { status, body } = await parseResponse(res);

      expect(status).toBe(200);
      expect(body.status).toBe('released');
    });

    it('should return 404 for non-existent reservation', async () => {
      mockPrisma.inventory_reservations.findFirst.mockResolvedValue(null);

      const req = createRequest('/api/inventory/reservations/' + uuid(99) + '/release', { method: 'POST' });
      const res = await releaseReservation(req, createRouteContext({ id: uuid(99) }));
      const { status } = await parseResponse(res);

      expect(status).toBe(404);
    });

    it('should return 400 for already released reservation', async () => {
      mockPrisma.inventory_reservations.findFirst.mockResolvedValue({
        id: uuid(1), status: 'released', tenant_id: TEST_TENANT_ID,
      });

      const req = createRequest('/api/inventory/reservations/' + uuid(1) + '/release', { method: 'POST' });
      const res = await releaseReservation(req, createRouteContext({ id: uuid(1) }));
      const { status } = await parseResponse(res);

      expect(status).toBe(400);
    });

    it('should return 400 for consumed reservation', async () => {
      mockPrisma.inventory_reservations.findFirst.mockResolvedValue({
        id: uuid(1), status: 'consumed', tenant_id: TEST_TENANT_ID,
      });

      const req = createRequest('/api/inventory/reservations/' + uuid(1) + '/release', { method: 'POST' });
      const res = await releaseReservation(req, createRouteContext({ id: uuid(1) }));
      const { status } = await parseResponse(res);

      expect(status).toBe(400);
    });

    it('should handle release when no stock balance exists', async () => {
      mockPrisma.inventory_reservations.findFirst.mockResolvedValue({
        id: uuid(1),
        status: 'active',
        tenant_id: TEST_TENANT_ID,
        warehouse_id: uuid(10),
        item_id: uuid(20),
        reserved_qty: new Prisma.Decimal(50),
      });
      mockTx.inventory_reservations.update.mockResolvedValue({
        id: uuid(1), status: 'released',
      });
      mockTx.stock_balances.findFirst.mockResolvedValue(null);

      const req = createRequest('/api/inventory/reservations/' + uuid(1) + '/release', { method: 'POST' });
      const res = await releaseReservation(req, createRouteContext({ id: uuid(1) }));
      const { status } = await parseResponse(res);

      expect(status).toBe(200);
      expect(mockTx.stock_balances.update).not.toHaveBeenCalled();
    });
  });

  describe('POST /api/inventory/reservations/[id]/consume', () => {
    it('should consume an active reservation', async () => {
      mockPrisma.inventory_reservations.findFirst.mockResolvedValue({
        id: uuid(1),
        status: 'active',
        tenant_id: TEST_TENANT_ID,
        warehouse_id: uuid(10),
        item_id: uuid(20),
        reserved_qty: new Prisma.Decimal(30),
      });
      mockTx.inventory_reservations.update.mockResolvedValue({
        id: uuid(1), status: 'consumed',
      });
      mockTx.stock_balances.findFirst.mockResolvedValue({
        id: uuid(50),
        reserved_qty: new Prisma.Decimal(100),
        on_hand_qty: new Prisma.Decimal(200),
      });
      mockTx.stock_balances.update.mockResolvedValue({});

      const req = createRequest('/api/inventory/reservations/' + uuid(1) + '/consume', { method: 'POST' });
      const res = await consumeReservation(req, createRouteContext({ id: uuid(1) }));
      const { status, body } = await parseResponse(res);

      expect(status).toBe(200);
      expect(body.status).toBe('consumed');
    });

    it('should return 400 for non-active reservation', async () => {
      mockPrisma.inventory_reservations.findFirst.mockResolvedValue({
        id: uuid(1), status: 'consumed', tenant_id: TEST_TENANT_ID,
      });

      const req = createRequest('/api/inventory/reservations/' + uuid(1) + '/consume', { method: 'POST' });
      const res = await consumeReservation(req, createRouteContext({ id: uuid(1) }));
      const { status } = await parseResponse(res);

      expect(status).toBe(400);
    });

    it('should return 404 for non-existent reservation on consume', async () => {
      mockPrisma.inventory_reservations.findFirst.mockResolvedValue(null);

      const req = createRequest('/api/inventory/reservations/' + uuid(99) + '/consume', { method: 'POST' });
      const res = await consumeReservation(req, createRouteContext({ id: uuid(99) }));
      const { status } = await parseResponse(res);

      expect(status).toBe(404);
    });

    it('should return 400 for released reservation on consume', async () => {
      mockPrisma.inventory_reservations.findFirst.mockResolvedValue({
        id: uuid(1), status: 'released', tenant_id: TEST_TENANT_ID,
      });

      const req = createRequest('/api/inventory/reservations/' + uuid(1) + '/consume', { method: 'POST' });
      const res = await consumeReservation(req, createRouteContext({ id: uuid(1) }));
      const { status } = await parseResponse(res);

      expect(status).toBe(400);
    });
  });
});
