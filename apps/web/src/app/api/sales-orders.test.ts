import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createRequest, parseResponse, setupEnv, createRouteContext, uuid, TEST_TENANT_ID, TEST_USER_ID } from '@/__tests__/helpers';

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    sales_orders: {
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    customers: {
      findUnique: vi.fn(),
    },
    products: {
      findMany: vi.fn(),
    },
    order_revisions: {
      create: vi.fn(),
    },
  },
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));
vi.mock('@nkc/utils', () => ({
  generateOrderNumber: vi.fn((prefix: string, n: number) => `${prefix}-0000-${String(n).padStart(5, '0')}`),
}));
setupEnv();

import { GET as getSalesOrders, POST as createSalesOrder } from '@/app/api/sales-orders/route';
import { GET as getSalesOrderById } from '@/app/api/sales-orders/[id]/route';
import { POST as confirmOrder } from '@/app/api/sales-orders/[id]/confirm/route';
import { POST as reviseOrder } from '@/app/api/sales-orders/[id]/revise/route';
import { POST as createManualOrder } from '@/app/api/sales-orders/manual/route';

describe('Sales Orders Routes', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('GET /api/sales-orders', () => {
    it('should return paginated orders', async () => {
      const orders = [
        { id: uuid(1), order_no: 'SO-2604-00001', status: 'draft', sales_order_lines: [] },
      ];
      mockPrisma.sales_orders.findMany.mockResolvedValue(orders);
      mockPrisma.sales_orders.count.mockResolvedValue(1);

      const req = createRequest('/api/sales-orders');
      const res = await getSalesOrders(req);
      const { status, body } = await parseResponse(res);

      expect(status).toBe(200);
      expect(body.data).toHaveLength(1);
      expect(body.data[0].order_no).toBe('SO-2604-00001');
    });

    it('should return empty when no orders exist', async () => {
      mockPrisma.sales_orders.findMany.mockResolvedValue([]);
      mockPrisma.sales_orders.count.mockResolvedValue(0);

      const req = createRequest('/api/sales-orders');
      const res = await getSalesOrders(req);
      const { status, body } = await parseResponse(res);

      expect(status).toBe(200);
      expect(body.data).toEqual([]);
      expect(body.total).toBe(0);
    });

    it('should respect pagination parameters', async () => {
      mockPrisma.sales_orders.findMany.mockResolvedValue([]);
      mockPrisma.sales_orders.count.mockResolvedValue(100);

      const req = createRequest('/api/sales-orders?page=3&limit=10');
      const res = await getSalesOrders(req);
      const { body } = await parseResponse(res);

      expect(body.page).toBe(3);
      expect(body.limit).toBe(10);
      expect(body.totalPages).toBe(10);
      expect(mockPrisma.sales_orders.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 20, take: 10 }),
      );
    });
  });

  describe('POST /api/sales-orders', () => {
    it('should create an order with lines', async () => {
      mockPrisma.sales_orders.count.mockResolvedValue(5);
      mockPrisma.sales_orders.create.mockResolvedValue({
        id: uuid(1),
        order_no: 'SO-2604-00006',
        total_amount: 5000,
        sales_order_lines: [
          { id: uuid(2), product_code: 'DIN-001', quantity: 10, unit_price: 500 },
        ],
      });

      const req = createRequest('/api/sales-orders', {
        method: 'POST',
        body: {
          customerId: uuid(10),
          orderDate: '2026-04-01',
          lines: [
            { productId: uuid(20), productCode: 'DIN-001', productName: 'Dining Table', quantity: 10, unitPrice: 500 },
          ],
        },
      });

      const res = await createSalesOrder(req);
      const { status, body } = await parseResponse(res);

      expect(status).toBe(201);
      expect(body.total_amount).toBe(5000);
      expect(body.sales_order_lines).toHaveLength(1);
    });

    it('should create order with multiple lines and calculate total', async () => {
      mockPrisma.sales_orders.count.mockResolvedValue(0);
      mockPrisma.sales_orders.create.mockResolvedValue({
        id: uuid(1),
        order_no: 'SO-2604-00001',
        total_amount: 15000,
        sales_order_lines: [
          { id: uuid(2), product_code: 'DIN-001', quantity: 10, unit_price: 500 },
          { id: uuid(3), product_code: 'CHR-001', quantity: 20, unit_price: 500 },
        ],
      });

      const req = createRequest('/api/sales-orders', {
        method: 'POST',
        body: {
          customerId: uuid(10),
          orderDate: '2026-04-01',
          lines: [
            { productId: uuid(20), productCode: 'DIN-001', productName: 'Dining Table', quantity: 10, unitPrice: 500 },
            { productId: uuid(21), productCode: 'CHR-001', productName: 'Chair', quantity: 20, unitPrice: 500 },
          ],
        },
      });

      const res = await createSalesOrder(req);
      const { status } = await parseResponse(res);
      expect(status).toBe(201);

      // Verify totalAmount passed to create
      const createCall = mockPrisma.sales_orders.create.mock.calls[0][0];
      expect(createCall.data.total_amount).toBe(15000);
    });

    it('should create order with all optional fields', async () => {
      mockPrisma.sales_orders.count.mockResolvedValue(0);
      mockPrisma.sales_orders.create.mockResolvedValue({ id: uuid(1), sales_order_lines: [] });

      const req = createRequest('/api/sales-orders', {
        method: 'POST',
        body: {
          customerId: uuid(10),
          orderDate: '2026-04-01',
          poNumber: 'PO-EXT-12345',
          requestedETD: '2026-05-15',
          currencyCode: 'EUR',
          paymentTerm: 'NET60',
          lines: [
            {
              productId: uuid(20), productCode: 'DIN-001', productName: 'Dining Table',
              quantity: 5, unitPrice: 800, requestedETD: '2026-05-10', priority: 'high', notes: 'Urgent',
            },
          ],
        },
      });

      const res = await createSalesOrder(req);
      const { status } = await parseResponse(res);
      expect(status).toBe(201);

      const createCall = mockPrisma.sales_orders.create.mock.calls[0][0];
      expect(createCall.data.po_number).toBe('PO-EXT-12345');
      expect(createCall.data.currency_code).toBe('EUR');
      expect(createCall.data.payment_term).toBe('NET60');
    });

    it('should default currency to USD when not provided', async () => {
      mockPrisma.sales_orders.count.mockResolvedValue(0);
      mockPrisma.sales_orders.create.mockResolvedValue({ id: uuid(1), sales_order_lines: [] });

      const req = createRequest('/api/sales-orders', {
        method: 'POST',
        body: {
          customerId: uuid(10),
          orderDate: '2026-04-01',
          lines: [
            { productId: uuid(20), productCode: 'DIN-001', productName: 'Dining', quantity: 1, unitPrice: 100 },
          ],
        },
      });

      const res = await createSalesOrder(req);
      expect(res.status).toBe(201);

      const createCall = mockPrisma.sales_orders.create.mock.calls[0][0];
      expect(createCall.data.currency_code).toBe('USD');
    });
  });

  describe('GET /api/sales-orders/[id]', () => {
    it('should return order detail', async () => {
      mockPrisma.sales_orders.findUnique.mockResolvedValue({
        id: uuid(1),
        order_no: 'SO-2604-00001',
        sales_order_lines: [],
        order_revisions: [],
      });

      const req = createRequest('/api/sales-orders/' + uuid(1));
      const res = await getSalesOrderById(req, createRouteContext({ id: uuid(1) }));
      const { status, body } = await parseResponse(res);

      expect(status).toBe(200);
      expect(body.order_no).toBe('SO-2604-00001');
    });

    it('should return 404 for missing order', async () => {
      mockPrisma.sales_orders.findUnique.mockResolvedValue(null);

      const req = createRequest('/api/sales-orders/' + uuid(99));
      const res = await getSalesOrderById(req, createRouteContext({ id: uuid(99) }));
      const { status } = await parseResponse(res);

      expect(status).toBe(404);
    });

    it('should include lines and revisions in detail', async () => {
      mockPrisma.sales_orders.findUnique.mockResolvedValue({
        id: uuid(1),
        order_no: 'SO-2604-00001',
        sales_order_lines: [
          { id: uuid(2), line_no: 1, product_code: 'DIN-001', quantity: 10 },
          { id: uuid(3), line_no: 2, product_code: 'CHR-001', quantity: 20 },
        ],
        order_revisions: [
          { id: uuid(4), revision_no: 1, change_reason: 'qty change' },
        ],
      });

      const req = createRequest('/api/sales-orders/' + uuid(1));
      const res = await getSalesOrderById(req, createRouteContext({ id: uuid(1) }));
      const { status, body } = await parseResponse(res);

      expect(status).toBe(200);
      expect(body.sales_order_lines).toHaveLength(2);
      expect(body.order_revisions).toHaveLength(1);
    });
  });

  describe('POST /api/sales-orders/[id]/confirm', () => {
    it('should confirm a draft order', async () => {
      mockPrisma.sales_orders.findUnique.mockResolvedValue({
        id: uuid(1),
        status: 'draft',
        tenant_id: TEST_TENANT_ID,
      });
      mockPrisma.sales_orders.update.mockResolvedValue({
        id: uuid(1),
        status: 'confirmed',
        sales_order_lines: [],
      });

      const req = createRequest('/api/sales-orders/' + uuid(1) + '/confirm', { method: 'POST' });
      const res = await confirmOrder(req, createRouteContext({ id: uuid(1) }));
      const { status, body } = await parseResponse(res);

      expect(status).toBe(200);
      expect(body.status).toBe('confirmed');
    });

    it('should confirm a pending_review order', async () => {
      mockPrisma.sales_orders.findUnique.mockResolvedValue({
        id: uuid(1),
        status: 'pending_review',
        tenant_id: TEST_TENANT_ID,
      });
      mockPrisma.sales_orders.update.mockResolvedValue({
        id: uuid(1),
        status: 'confirmed',
        sales_order_lines: [],
      });

      const req = createRequest('/api/sales-orders/' + uuid(1) + '/confirm', { method: 'POST' });
      const res = await confirmOrder(req, createRouteContext({ id: uuid(1) }));
      const { status, body } = await parseResponse(res);

      expect(status).toBe(200);
      expect(body.status).toBe('confirmed');
    });

    it('should reject confirming an already confirmed order', async () => {
      mockPrisma.sales_orders.findUnique.mockResolvedValue({
        id: uuid(1),
        status: 'confirmed',
        tenant_id: TEST_TENANT_ID,
      });

      const req = createRequest('/api/sales-orders/' + uuid(1) + '/confirm', { method: 'POST' });
      const res = await confirmOrder(req, createRouteContext({ id: uuid(1) }));
      const { status } = await parseResponse(res);

      expect(status).toBe(400);
    });

    it('should reject confirming a revised order', async () => {
      mockPrisma.sales_orders.findUnique.mockResolvedValue({
        id: uuid(1),
        status: 'revised',
        tenant_id: TEST_TENANT_ID,
      });

      const req = createRequest('/api/sales-orders/' + uuid(1) + '/confirm', { method: 'POST' });
      const res = await confirmOrder(req, createRouteContext({ id: uuid(1) }));
      const { status } = await parseResponse(res);

      expect(status).toBe(400);
    });

    it('should return 404 for non-existent order', async () => {
      mockPrisma.sales_orders.findUnique.mockResolvedValue(null);

      const req = createRequest('/api/sales-orders/' + uuid(99) + '/confirm', { method: 'POST' });
      const res = await confirmOrder(req, createRouteContext({ id: uuid(99) }));
      const { status } = await parseResponse(res);

      expect(status).toBe(404);
    });
  });

  describe('POST /api/sales-orders/[id]/revise', () => {
    it('should revise an order and create snapshot', async () => {
      const existingOrder = {
        id: uuid(1),
        order_no: 'SO-2604-00001',
        status: 'confirmed',
        revision_no: 0,
        tenant_id: TEST_TENANT_ID,
        sales_order_lines: [],
      };
      mockPrisma.sales_orders.findUnique.mockResolvedValue(existingOrder);
      mockPrisma.order_revisions.create.mockResolvedValue({});
      mockPrisma.sales_orders.update.mockResolvedValue({
        ...existingOrder,
        status: 'revised',
        revision_no: 1,
        sales_order_lines: [],
      });

      const req = createRequest('/api/sales-orders/' + uuid(1) + '/revise', {
        method: 'POST',
        body: { changeReason: 'Customer requested quantity change' },
      });

      const res = await reviseOrder(req, createRouteContext({ id: uuid(1) }));
      const { status, body } = await parseResponse(res);

      expect(status).toBe(200);
      expect(body.revision_no).toBe(1);
      expect(mockPrisma.order_revisions.create).toHaveBeenCalled();
    });

    it('should return 404 for non-existent order', async () => {
      mockPrisma.sales_orders.findUnique.mockResolvedValue(null);

      const req = createRequest('/api/sales-orders/' + uuid(99) + '/revise', {
        method: 'POST',
        body: { changeReason: 'test' },
      });

      const res = await reviseOrder(req, createRouteContext({ id: uuid(99) }));
      const { status } = await parseResponse(res);

      expect(status).toBe(404);
    });

    it('should increment revision_no for multiple revisions', async () => {
      const existingOrder = {
        id: uuid(1),
        order_no: 'SO-2604-00001',
        status: 'confirmed',
        revision_no: 3,
        tenant_id: TEST_TENANT_ID,
        sales_order_lines: [{ id: uuid(2), line_no: 1, quantity: 10 }],
      };
      mockPrisma.sales_orders.findUnique.mockResolvedValue(existingOrder);
      mockPrisma.order_revisions.create.mockResolvedValue({});
      mockPrisma.sales_orders.update.mockResolvedValue({
        ...existingOrder,
        status: 'revised',
        revision_no: 4,
        sales_order_lines: existingOrder.sales_order_lines,
      });

      const req = createRequest('/api/sales-orders/' + uuid(1) + '/revise', {
        method: 'POST',
        body: { changeReason: 'Fourth revision — late shipping change' },
      });

      const res = await reviseOrder(req, createRouteContext({ id: uuid(1) }));
      const { status, body } = await parseResponse(res);

      expect(status).toBe(200);
      expect(body.revision_no).toBe(4);

      // Verify snapshot includes lines
      const revisionData = mockPrisma.order_revisions.create.mock.calls[0][0].data;
      expect(revisionData.revision_no).toBe(4);
      expect(revisionData.change_reason).toBe('Fourth revision — late shipping change');
    });
  });
});

describe('Manual Order Creation', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('POST /api/sales-orders/manual', () => {
    it('should create order using customer and product codes', async () => {
      mockPrisma.customers.findUnique.mockResolvedValue({
        id: uuid(10),
        customer_code: 'CUST-001',
        customer_name: 'ABC Corp',
        currency_code: 'USD',
        payment_term: 'NET30',
      });
      mockPrisma.products.findMany.mockResolvedValue([
        {
          id: uuid(20),
          product_code: 'DIN-001',
          product_name: 'Dining Table',
          current_version_id: uuid(30),
          status: 'active',
          product_versions_products_current_version_idToproduct_versions: { id: uuid(30) },
        },
      ]);
      mockPrisma.sales_orders.count.mockResolvedValue(10);
      mockPrisma.sales_orders.create.mockResolvedValue({
        id: uuid(1),
        order_no: 'SO-2604-00011',
        customer_id: uuid(10),
        total_amount: 5000,
        sales_order_lines: [
          { product_code: 'DIN-001', quantity: 10, unit_price: 500 },
        ],
      });

      const req = createRequest('/api/sales-orders/manual', {
        method: 'POST',
        body: {
          customerCode: 'CUST-001',
          lines: [
            { productCode: 'DIN-001', quantity: 10, unitPrice: 500 },
          ],
        },
      });

      const res = await createManualOrder(req);
      const { status, body } = await parseResponse(res);

      expect(status).toBe(201);
      expect(body.total_amount).toBe(5000);
    });

    it('should return 404 for unknown customer code', async () => {
      mockPrisma.customers.findUnique.mockResolvedValue(null);

      const req = createRequest('/api/sales-orders/manual', {
        method: 'POST',
        body: {
          customerCode: 'UNKNOWN',
          lines: [{ productCode: 'DIN-001', quantity: 1, unitPrice: 100 }],
        },
      });

      const res = await createManualOrder(req);
      const { status } = await parseResponse(res);

      expect(status).toBe(404);
    });

    it('should return 404 for unknown product code', async () => {
      mockPrisma.customers.findUnique.mockResolvedValue({
        id: uuid(10),
        customer_code: 'CUST-001',
        customer_name: 'ABC Corp',
      });
      mockPrisma.products.findMany.mockResolvedValue([]); // No products found

      const req = createRequest('/api/sales-orders/manual', {
        method: 'POST',
        body: {
          customerCode: 'CUST-001',
          lines: [{ productCode: 'UNKNOWN', quantity: 1, unitPrice: 100 }],
        },
      });

      const res = await createManualOrder(req);
      const { status } = await parseResponse(res);

      expect(status).toBe(404);
    });

    it('should return 400 for missing customerCode', async () => {
      const req = createRequest('/api/sales-orders/manual', {
        method: 'POST',
        body: {
          lines: [{ productCode: 'DIN-001', quantity: 1, unitPrice: 100 }],
        },
      });

      const res = await createManualOrder(req);
      const { status } = await parseResponse(res);

      expect(status).toBe(400);
    });

    it('should return 400 for empty lines array', async () => {
      const req = createRequest('/api/sales-orders/manual', {
        method: 'POST',
        body: { customerCode: 'CUST-001', lines: [] },
      });

      const res = await createManualOrder(req);
      const { status } = await parseResponse(res);

      expect(status).toBe(400);
    });

    it('should return 400 when lines is missing', async () => {
      const req = createRequest('/api/sales-orders/manual', {
        method: 'POST',
        body: { customerCode: 'CUST-001' },
      });

      const res = await createManualOrder(req);
      const { status } = await parseResponse(res);

      expect(status).toBe(400);
    });

    it('should fallback to customer currency and payment term', async () => {
      mockPrisma.customers.findUnique.mockResolvedValue({
        id: uuid(10),
        customer_code: 'CUST-001',
        customer_name: 'ABC Corp',
        currency_code: 'EUR',
        payment_term: 'NET60',
      });
      mockPrisma.products.findMany.mockResolvedValue([
        {
          id: uuid(20),
          product_code: 'DIN-001',
          product_name: 'Dining Table',
          current_version_id: uuid(30),
          status: 'active',
          product_versions_products_current_version_idToproduct_versions: { id: uuid(30) },
        },
      ]);
      mockPrisma.sales_orders.count.mockResolvedValue(0);
      mockPrisma.sales_orders.create.mockResolvedValue({
        id: uuid(1),
        currency_code: 'EUR',
        payment_term: 'NET60',
        sales_order_lines: [],
      });

      const req = createRequest('/api/sales-orders/manual', {
        method: 'POST',
        body: {
          customerCode: 'CUST-001',
          lines: [{ productCode: 'DIN-001', quantity: 1, unitPrice: 100 }],
        },
      });

      const res = await createManualOrder(req);
      expect(res.status).toBe(201);

      const createCall = mockPrisma.sales_orders.create.mock.calls[0][0];
      expect(createCall.data.currency_code).toBe('EUR');
      expect(createCall.data.payment_term).toBe('NET60');
    });

    it('should create order with multiple products', async () => {
      mockPrisma.customers.findUnique.mockResolvedValue({
        id: uuid(10),
        customer_code: 'CUST-001',
        customer_name: 'ABC Corp',
        currency_code: 'USD',
        payment_term: 'NET30',
      });
      mockPrisma.products.findMany.mockResolvedValue([
        {
          id: uuid(20), product_code: 'DIN-001', product_name: 'Dining Table',
          current_version_id: uuid(30), status: 'active',
          product_versions_products_current_version_idToproduct_versions: { id: uuid(30) },
        },
        {
          id: uuid(21), product_code: 'CHR-001', product_name: 'Chair',
          current_version_id: uuid(31), status: 'active',
          product_versions_products_current_version_idToproduct_versions: { id: uuid(31) },
        },
      ]);
      mockPrisma.sales_orders.count.mockResolvedValue(0);
      mockPrisma.sales_orders.create.mockResolvedValue({
        id: uuid(1),
        total_amount: 9000,
        sales_order_lines: [
          { product_code: 'DIN-001', quantity: 10, unit_price: 500 },
          { product_code: 'CHR-001', quantity: 20, unit_price: 200 },
        ],
      });

      const req = createRequest('/api/sales-orders/manual', {
        method: 'POST',
        body: {
          customerCode: 'CUST-001',
          lines: [
            { productCode: 'DIN-001', quantity: 10, unitPrice: 500 },
            { productCode: 'CHR-001', quantity: 20, unitPrice: 200 },
          ],
        },
      });

      const res = await createManualOrder(req);
      const { status, body } = await parseResponse(res);

      expect(status).toBe(201);
      expect(body.sales_order_lines).toHaveLength(2);

      const createCall = mockPrisma.sales_orders.create.mock.calls[0][0];
      expect(createCall.data.total_amount).toBe(9000);
    });

    it('should 404 when one of multiple products not found', async () => {
      mockPrisma.customers.findUnique.mockResolvedValue({
        id: uuid(10),
        customer_code: 'CUST-001',
        customer_name: 'ABC Corp',
      });
      // Only DIN-001 found, CHR-GHOST not found
      mockPrisma.products.findMany.mockResolvedValue([
        {
          id: uuid(20), product_code: 'DIN-001', product_name: 'Dining Table',
          current_version_id: uuid(30), status: 'active',
          product_versions_products_current_version_idToproduct_versions: { id: uuid(30) },
        },
      ]);

      const req = createRequest('/api/sales-orders/manual', {
        method: 'POST',
        body: {
          customerCode: 'CUST-001',
          lines: [
            { productCode: 'DIN-001', quantity: 10, unitPrice: 500 },
            { productCode: 'CHR-GHOST', quantity: 5, unitPrice: 200 },
          ],
        },
      });

      const res = await createManualOrder(req);
      const { status } = await parseResponse(res);

      expect(status).toBe(404);
    });

    it('should create with optional notes and poNumber', async () => {
      mockPrisma.customers.findUnique.mockResolvedValue({
        id: uuid(10),
        customer_code: 'CUST-001',
        customer_name: 'ABC Corp',
        currency_code: 'USD',
      });
      mockPrisma.products.findMany.mockResolvedValue([
        {
          id: uuid(20), product_code: 'DIN-001', product_name: 'Dining Table',
          current_version_id: uuid(30), status: 'active',
          product_versions_products_current_version_idToproduct_versions: { id: uuid(30) },
        },
      ]);
      mockPrisma.sales_orders.count.mockResolvedValue(0);
      mockPrisma.sales_orders.create.mockResolvedValue({ id: uuid(1), sales_order_lines: [] });

      const req = createRequest('/api/sales-orders/manual', {
        method: 'POST',
        body: {
          customerCode: 'CUST-001',
          poNumber: 'PO-MANUAL-001',
          notes: 'Urgent order for exhibition',
          lines: [
            { productCode: 'DIN-001', quantity: 1, unitPrice: 1000, priority: 'high', notes: 'Special finish' },
          ],
        },
      });

      const res = await createManualOrder(req);
      expect(res.status).toBe(201);

      const createCall = mockPrisma.sales_orders.create.mock.calls[0][0];
      expect(createCall.data.po_number).toBe('PO-MANUAL-001');
      expect(createCall.data.notes).toBe('Urgent order for exhibition');
    });
  });
});
