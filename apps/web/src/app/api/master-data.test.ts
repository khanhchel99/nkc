import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createRequest, parseResponse, setupEnv, createRouteContext, uuid, TEST_TENANT_ID } from '@/__tests__/helpers';

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    items: {
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      findUnique: vi.fn(),
    },
    customers: {
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      findUnique: vi.fn(),
    },
    suppliers: {
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      findUnique: vi.fn(),
    },
    products: {
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    product_versions: {
      create: vi.fn(),
    },
    bom_headers: {
      create: vi.fn(),
    },
    routings: {
      create: vi.fn(),
    },
  },
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));
setupEnv();

import { GET as getItems, POST as createItem } from '@/app/api/items/route';
import { GET as getCustomers, POST as createCustomer } from '@/app/api/customers/route';
import { GET as getSuppliers, POST as createSupplier } from '@/app/api/suppliers/route';
import { GET as getProducts, POST as createProduct } from '@/app/api/products/route';
import { GET as getProductById } from '@/app/api/products/[id]/route';
import { POST as createVersion } from '@/app/api/products/[id]/versions/route';
import { POST as createBom } from '@/app/api/products/[id]/bom/route';
import { POST as createRouting } from '@/app/api/products/[id]/routing/route';

describe('Items Routes', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('GET /api/items', () => {
    it('should return paginated items', async () => {
      mockPrisma.items.findMany.mockResolvedValue([
        { id: uuid(1), item_code: 'RM-001', item_name: 'Plywood', tenant_id: TEST_TENANT_ID },
      ]);
      mockPrisma.items.count.mockResolvedValue(1);

      const req = createRequest('/api/items');
      const res = await getItems(req);
      const { status, body } = await parseResponse(res);

      expect(status).toBe(200);
      expect(body.data).toHaveLength(1);
      expect(body.data[0].item_code).toBe('RM-001');
    });

    it('should return empty data when no items exist', async () => {
      mockPrisma.items.findMany.mockResolvedValue([]);
      mockPrisma.items.count.mockResolvedValue(0);

      const req = createRequest('/api/items');
      const res = await getItems(req);
      const { status, body } = await parseResponse(res);

      expect(status).toBe(200);
      expect(body.data).toHaveLength(0);
      expect(body.total).toBe(0);
    });

    it('should scope items to tenant', async () => {
      mockPrisma.items.findMany.mockResolvedValue([]);
      mockPrisma.items.count.mockResolvedValue(0);

      const req = createRequest('/api/items');
      await getItems(req);

      expect(mockPrisma.items.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ tenant_id: TEST_TENANT_ID }),
        }),
      );
    });

    it('should respect pagination params', async () => {
      mockPrisma.items.findMany.mockResolvedValue([]);
      mockPrisma.items.count.mockResolvedValue(100);

      const req = createRequest('/api/items?page=2&limit=10');
      const res = await getItems(req);
      const { body } = await parseResponse(res);

      expect(body.page).toBe(2);
      expect(body.totalPages).toBe(10);
      expect(mockPrisma.items.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 10, take: 10 }),
      );
    });
  });

  describe('POST /api/items', () => {
    it('should create an item', async () => {
      mockPrisma.items.findUnique.mockResolvedValue(null);
      mockPrisma.items.create.mockResolvedValue({
        id: uuid(1),
        item_code: 'RM-NEW',
        item_name: 'New Material',
        tenant_id: TEST_TENANT_ID,
      });

      const req = createRequest('/api/items', {
        method: 'POST',
        body: {
          itemCode: 'RM-NEW',
          itemName: 'New Material',
          itemType: 'raw_material',
          defaultUomCode: 'PCS',
        },
      });

      const res = await createItem(req);
      const { status, body } = await parseResponse(res);

      expect(status).toBe(201);
      expect(body.item_code).toBe('RM-NEW');
    });

    it('should return 409 for duplicate item code', async () => {
      mockPrisma.items.findUnique.mockResolvedValue({ id: uuid(1) });

      const req = createRequest('/api/items', {
        method: 'POST',
        body: { itemCode: 'RM-001', itemName: 'Existing', itemType: 'raw_material', defaultUomCode: 'PCS' },
      });

      const res = await createItem(req);
      const { status } = await parseResponse(res);

      expect(status).toBe(409);
    });

    it('should create item with all optional fields', async () => {
      mockPrisma.items.findUnique.mockResolvedValue(null);
      mockPrisma.items.create.mockResolvedValue({
        id: uuid(1),
        item_code: 'RM-FULL',
        item_name: 'Full Item',
        item_type: 'raw_material',
        material_type: 'wood',
        description: 'Full test item',
        tenant_id: TEST_TENANT_ID,
      });

      const req = createRequest('/api/items', {
        method: 'POST',
        body: {
          itemCode: 'RM-FULL',
          itemName: 'Full Item',
          itemType: 'raw_material',
          defaultUomCode: 'PCS',
          materialType: 'wood',
          description: 'Full test item',
        },
      });

      const res = await createItem(req);
      const { status } = await parseResponse(res);

      expect(status).toBe(201);
    });

    it('should handle database error on create', async () => {
      mockPrisma.items.findUnique.mockResolvedValue(null);
      mockPrisma.items.create.mockRejectedValue(new Error('DB error'));

      const req = createRequest('/api/items', {
        method: 'POST',
        body: { itemCode: 'RM-ERR', itemName: 'Error Item', itemType: 'raw_material', defaultUomCode: 'PCS' },
      });

      const res = await createItem(req);
      const { status } = await parseResponse(res);

      expect(status).toBeGreaterThanOrEqual(400);
    });
  });
});

describe('Customers Routes', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('GET /api/customers', () => {
    it('should return paginated customers', async () => {
      mockPrisma.customers.findMany.mockResolvedValue([
        { id: uuid(1), customer_code: 'CUST-001', customer_name: 'ABC Corp' },
      ]);
      mockPrisma.customers.count.mockResolvedValue(1);

      const req = createRequest('/api/customers');
      const res = await getCustomers(req);
      const { status, body } = await parseResponse(res);

      expect(status).toBe(200);
      expect(body.data).toHaveLength(1);
    });

    it('should return empty when no customers', async () => {
      mockPrisma.customers.findMany.mockResolvedValue([]);
      mockPrisma.customers.count.mockResolvedValue(0);

      const req = createRequest('/api/customers');
      const res = await getCustomers(req);
      const { status, body } = await parseResponse(res);

      expect(status).toBe(200);
      expect(body.data).toEqual([]);
    });

    it('should paginate correctly', async () => {
      mockPrisma.customers.findMany.mockResolvedValue([]);
      mockPrisma.customers.count.mockResolvedValue(25);

      const req = createRequest('/api/customers?page=2&limit=10');
      const res = await getCustomers(req);
      const { body } = await parseResponse(res);

      expect(body.page).toBe(2);
      expect(body.totalPages).toBe(3);
    });
  });

  describe('POST /api/customers', () => {
    it('should create a customer', async () => {
      mockPrisma.customers.create.mockResolvedValue({
        id: uuid(1),
        customer_code: 'CUST-NEW',
        customer_name: 'New Customer',
      });

      const req = createRequest('/api/customers', {
        method: 'POST',
        body: { customerCode: 'CUST-NEW', customerName: 'New Customer' },
      });

      const res = await createCustomer(req);
      const { status } = await parseResponse(res);

      expect(status).toBe(201);
    });

    it('should create customer with all fields', async () => {
      mockPrisma.customers.create.mockResolvedValue({
        id: uuid(1),
        customer_code: 'CUST-FULL',
        customer_name: 'Full Customer',
        email: 'customer@example.com',
        phone: '+84-111-222-333',
        address: '123 ABC Street',
        payment_term: 'NET30',
        currency_code: 'USD',
      });

      const req = createRequest('/api/customers', {
        method: 'POST',
        body: {
          customerCode: 'CUST-FULL',
          customerName: 'Full Customer',
          email: 'customer@example.com',
          phone: '+84-111-222-333',
          address: '123 ABC Street',
          paymentTerm: 'NET30',
          currencyCode: 'USD',
        },
      });

      const res = await createCustomer(req);
      const { status } = await parseResponse(res);

      expect(status).toBe(201);
    });

    it('should return 409 for duplicate customer code', async () => {
      mockPrisma.customers.findUnique.mockResolvedValue({ id: uuid(1) });

      const req = createRequest('/api/customers', {
        method: 'POST',
        body: { customerCode: 'CUST-001', customerName: 'Dup Customer' },
      });

      const res = await createCustomer(req);
      const { status } = await parseResponse(res);

      expect(status).toBe(409);
    });
  });
});

describe('Suppliers Routes', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('GET /api/suppliers', () => {
    it('should return paginated suppliers', async () => {
      mockPrisma.suppliers.findMany.mockResolvedValue([
        { id: uuid(1), supplier_code: 'SUP-001', supplier_name: 'Wood Co' },
      ]);
      mockPrisma.suppliers.count.mockResolvedValue(1);

      const req = createRequest('/api/suppliers');
      const res = await getSuppliers(req);
      const { status, body } = await parseResponse(res);

      expect(status).toBe(200);
      expect(body.data).toHaveLength(1);
    });

    it('should return empty when no suppliers', async () => {
      mockPrisma.suppliers.findMany.mockResolvedValue([]);
      mockPrisma.suppliers.count.mockResolvedValue(0);

      const req = createRequest('/api/suppliers');
      const res = await getSuppliers(req);
      const { status, body } = await parseResponse(res);

      expect(status).toBe(200);
      expect(body.data).toEqual([]);
    });
  });

  describe('POST /api/suppliers', () => {
    it('should create a supplier', async () => {
      mockPrisma.suppliers.create.mockResolvedValue({
        id: uuid(1),
        supplier_code: 'SUP-NEW',
        supplier_name: 'New Supplier',
      });

      const req = createRequest('/api/suppliers', {
        method: 'POST',
        body: { supplierCode: 'SUP-NEW', supplierName: 'New Supplier' },
      });

      const res = await createSupplier(req);
      const { status } = await parseResponse(res);

      expect(status).toBe(201);
    });

    it('should create supplier with all fields', async () => {
      mockPrisma.suppliers.create.mockResolvedValue({
        id: uuid(1),
        supplier_code: 'SUP-FULL',
        supplier_name: 'Full Supplier',
        email: 'supplier@wood.com',
        phone: '+84-999-888-777',
        address: '456 Factory Rd',
      });

      const req = createRequest('/api/suppliers', {
        method: 'POST',
        body: {
          supplierCode: 'SUP-FULL',
          supplierName: 'Full Supplier',
          email: 'supplier@wood.com',
          phone: '+84-999-888-777',
          address: '456 Factory Rd',
        },
      });

      const res = await createSupplier(req);
      const { status } = await parseResponse(res);

      expect(status).toBe(201);
    });

    it('should return 409 for duplicate supplier code', async () => {
      mockPrisma.suppliers.findUnique.mockResolvedValue({ id: uuid(1) });

      const req = createRequest('/api/suppliers', {
        method: 'POST',
        body: { supplierCode: 'SUP-001', supplierName: 'Dup Supplier' },
      });

      const res = await createSupplier(req);
      const { status } = await parseResponse(res);

      expect(status).toBe(409);
    });
  });
});

describe('Products Routes', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('GET /api/products', () => {
    it('should return paginated products', async () => {
      mockPrisma.products.findMany.mockResolvedValue([
        { id: uuid(1), product_code: 'DIN-001', product_name: 'Dining Table' },
      ]);
      mockPrisma.products.count.mockResolvedValue(1);

      const req = createRequest('/api/products');
      const res = await getProducts(req);
      const { status, body } = await parseResponse(res);

      expect(status).toBe(200);
      expect(body.data).toHaveLength(1);
    });

    it('should return empty when no products', async () => {
      mockPrisma.products.findMany.mockResolvedValue([]);
      mockPrisma.products.count.mockResolvedValue(0);

      const req = createRequest('/api/products');
      const res = await getProducts(req);
      const { status, body } = await parseResponse(res);

      expect(status).toBe(200);
      expect(body.data).toEqual([]);
      expect(body.total).toBe(0);
    });

    it('should paginate correctly', async () => {
      mockPrisma.products.findMany.mockResolvedValue([]);
      mockPrisma.products.count.mockResolvedValue(50);

      const req = createRequest('/api/products?page=3&limit=5');
      const res = await getProducts(req);
      const { body } = await parseResponse(res);

      expect(body.page).toBe(3);
      expect(body.totalPages).toBe(10);
    });
  });

  describe('POST /api/products', () => {
    it('should create a product', async () => {
      mockPrisma.products.create.mockResolvedValue({
        id: uuid(1),
        product_code: 'DIN-NEW',
        product_name: 'New Dining Table',
        category: 'dining',
      });

      const req = createRequest('/api/products', {
        method: 'POST',
        body: { productCode: 'DIN-NEW', productName: 'New Dining Table', category: 'dining' },
      });

      const res = await createProduct(req);
      const { status } = await parseResponse(res);

      expect(status).toBe(201);
    });

    it('should create product with all dimension fields', async () => {
      mockPrisma.products.create.mockResolvedValue({
        id: uuid(1),
        product_code: 'DIN-FULL',
        product_name: 'Full Product',
        category: 'dining',
        length_mm: 1200,
        width_mm: 800,
        height_mm: 750,
        main_material: 'oak',
        weight_net_kg: 25.5,
        weight_gross_kg: 30.0,
        cbm: 0.72,
      });

      const req = createRequest('/api/products', {
        method: 'POST',
        body: {
          productCode: 'DIN-FULL',
          productName: 'Full Product',
          category: 'dining',
          lengthMm: 1200,
          widthMm: 800,
          heightMm: 750,
          mainMaterial: 'oak',
          weightNetKg: 25.5,
          weightGrossKg: 30.0,
          cbm: 0.72,
        },
      });

      const res = await createProduct(req);
      const { status } = await parseResponse(res);

      expect(status).toBe(201);
    });

    it('should return 409 for duplicate product code', async () => {
      mockPrisma.products.findUnique.mockResolvedValue({ id: uuid(1) });

      const req = createRequest('/api/products', {
        method: 'POST',
        body: { productCode: 'DIN-001', productName: 'Duplicate', category: 'dining' },
      });

      const res = await createProduct(req);
      const { status } = await parseResponse(res);

      expect(status).toBe(409);
    });
  });

  describe('GET /api/products/[id]', () => {
    it('should return product detail with versions', async () => {
      mockPrisma.products.findUnique.mockResolvedValue({
        id: uuid(1),
        product_code: 'DIN-001',
        product_name: 'Dining Table',
        product_versions_product_versions_product_idToproducts: [
          { id: uuid(2), version_no: '1.0', bom_headers: [], routings: [] },
        ],
      });

      const req = createRequest('/api/products/' + uuid(1));
      const res = await getProductById(req, createRouteContext({ id: uuid(1) }));
      const { status, body } = await parseResponse(res);

      expect(status).toBe(200);
      expect(body.product_code).toBe('DIN-001');
    });

    it('should return 404 for missing product', async () => {
      mockPrisma.products.findUnique.mockResolvedValue(null);

      const req = createRequest('/api/products/' + uuid(99));
      const res = await getProductById(req, createRouteContext({ id: uuid(99) }));
      const { status } = await parseResponse(res);

      expect(status).toBe(404);
    });

    it('should return product with no versions', async () => {
      mockPrisma.products.findUnique.mockResolvedValue({
        id: uuid(1),
        product_code: 'DIN-001',
        product_name: 'Dining Table',
        product_versions_product_versions_product_idToproducts: [],
      });

      const req = createRequest('/api/products/' + uuid(1));
      const res = await getProductById(req, createRouteContext({ id: uuid(1) }));
      const { status, body } = await parseResponse(res);

      expect(status).toBe(200);
      expect(body.product_versions_product_versions_product_idToproducts).toEqual([]);
    });

    it('should include nested BOM and routing in versions', async () => {
      mockPrisma.products.findUnique.mockResolvedValue({
        id: uuid(1),
        product_code: 'DIN-001',
        product_name: 'Dining Table',
        product_versions_product_versions_product_idToproducts: [
          {
            id: uuid(2),
            version_no: '1.0',
            bom_headers: [
              { id: uuid(3), bom_code: 'BOM-001', bom_items: [{ id: uuid(4), component_code: 'PLY-18' }] },
            ],
            routings: [
              { id: uuid(5), routing_code: 'RT-001', routing_steps: [{ id: uuid(6), step_no: 1 }] },
            ],
          },
        ],
      });

      const req = createRequest('/api/products/' + uuid(1));
      const res = await getProductById(req, createRouteContext({ id: uuid(1) }));
      const { status, body } = await parseResponse(res);

      expect(status).toBe(200);
      const versions = body.product_versions_product_versions_product_idToproducts;
      expect(versions[0].bom_headers).toHaveLength(1);
      expect(versions[0].routings).toHaveLength(1);
    });
  });

  describe('POST /api/products/[id]/versions', () => {
    it('should create a version and update current_version_id', async () => {
      mockPrisma.products.findUnique.mockResolvedValue({
        id: uuid(1),
        tenant_id: TEST_TENANT_ID,
      });
      const newVersion = { id: uuid(5), version_no: '2.0' };
      mockPrisma.product_versions.create.mockResolvedValue(newVersion);
      mockPrisma.products.update.mockResolvedValue({});

      const req = createRequest('/api/products/' + uuid(1) + '/versions', {
        method: 'POST',
        body: { versionNo: '2.0', effectiveFrom: '2026-01-01' },
      });

      const res = await createVersion(req, createRouteContext({ id: uuid(1) }));
      const { status } = await parseResponse(res);

      expect(status).toBe(201);
      expect(mockPrisma.products.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { current_version_id: uuid(5) },
        }),
      );
    });

    it('should return 404 for non-existent product', async () => {
      mockPrisma.products.findUnique.mockResolvedValue(null);

      const req = createRequest('/api/products/' + uuid(99) + '/versions', {
        method: 'POST',
        body: { versionNo: '1.0', effectiveFrom: '2026-01-01' },
      });

      const res = await createVersion(req, createRouteContext({ id: uuid(99) }));
      const { status } = await parseResponse(res);

      expect(status).toBe(404);
    });

    it('should create version with effectiveTo', async () => {
      mockPrisma.products.findUnique.mockResolvedValue({
        id: uuid(1),
        tenant_id: TEST_TENANT_ID,
      });
      mockPrisma.product_versions.create.mockResolvedValue({ id: uuid(5), version_no: '3.0' });
      mockPrisma.products.update.mockResolvedValue({});

      const req = createRequest('/api/products/' + uuid(1) + '/versions', {
        method: 'POST',
        body: { versionNo: '3.0', effectiveFrom: '2026-01-01', effectiveTo: '2026-12-31' },
      });

      const res = await createVersion(req, createRouteContext({ id: uuid(1) }));
      const { status } = await parseResponse(res);

      expect(status).toBe(201);
    });
  });

  describe('POST /api/products/[id]/bom', () => {
    it('should create BOM for product current version', async () => {
      mockPrisma.products.findUnique.mockResolvedValue({
        id: uuid(1),
        current_version_id: uuid(2),
        tenant_id: TEST_TENANT_ID,
      });
      mockPrisma.bom_headers.create.mockResolvedValue({
        id: uuid(3),
        bom_code: 'BOM-001',
        bom_items: [{ id: uuid(4), component_code: 'PLY-18' }],
      });

      const req = createRequest('/api/products/' + uuid(1) + '/bom', {
        method: 'POST',
        body: {
          bomCode: 'BOM-001',
          items: [
            { componentCode: 'PLY-18', componentName: 'Plywood 18mm', componentType: 'raw_material', qtyPerProduct: 2.5, uomCode: 'SHT' },
          ],
        },
      });

      const res = await createBom(req, createRouteContext({ id: uuid(1) }));
      const { status } = await parseResponse(res);

      expect(status).toBe(201);
    });

    it('should return 404 when no current version', async () => {
      mockPrisma.products.findUnique.mockResolvedValue({
        id: uuid(1),
        current_version_id: null,
        tenant_id: TEST_TENANT_ID,
      });

      const req = createRequest('/api/products/' + uuid(1) + '/bom', {
        method: 'POST',
        body: { bomCode: 'BOM-001', items: [] },
      });

      const res = await createBom(req, createRouteContext({ id: uuid(1) }));
      const { status } = await parseResponse(res);

      expect(status).toBe(404);
    });

    it('should return 404 for non-existent product', async () => {
      mockPrisma.products.findUnique.mockResolvedValue(null);

      const req = createRequest('/api/products/' + uuid(99) + '/bom', {
        method: 'POST',
        body: { bomCode: 'BOM-001', items: [] },
      });

      const res = await createBom(req, createRouteContext({ id: uuid(99) }));
      const { status } = await parseResponse(res);

      expect(status).toBe(404);
    });

    it('should create BOM with multiple items and scrap percent', async () => {
      mockPrisma.products.findUnique.mockResolvedValue({
        id: uuid(1),
        current_version_id: uuid(2),
        tenant_id: TEST_TENANT_ID,
      });
      mockPrisma.bom_headers.create.mockResolvedValue({
        id: uuid(3),
        bom_code: 'BOM-002',
        bom_items: [
          { id: uuid(4), component_code: 'PLY-18', line_no: 1 },
          { id: uuid(5), component_code: 'SCREW-001', line_no: 2 },
          { id: uuid(6), component_code: 'GLUE-001', line_no: 3 },
        ],
      });

      const req = createRequest('/api/products/' + uuid(1) + '/bom', {
        method: 'POST',
        body: {
          bomCode: 'BOM-002',
          items: [
            { componentCode: 'PLY-18', componentName: 'Plywood 18mm', componentType: 'raw_material', qtyPerProduct: 2.5, uomCode: 'SHT', scrapPercent: 5 },
            { componentCode: 'SCREW-001', componentName: 'Wood Screw', componentType: 'raw_material', qtyPerProduct: 20, uomCode: 'PC', scrapPercent: 2 },
            { componentCode: 'GLUE-001', componentName: 'Wood Glue', componentType: 'raw_material', qtyPerProduct: 0.5, uomCode: 'KG' },
          ],
        },
      });

      const res = await createBom(req, createRouteContext({ id: uuid(1) }));
      const { status, body } = await parseResponse(res);

      expect(status).toBe(201);
      expect(body.bom_items).toHaveLength(3);
    });

    it('should create BOM with item linked by itemId', async () => {
      mockPrisma.products.findUnique.mockResolvedValue({
        id: uuid(1),
        current_version_id: uuid(2),
        tenant_id: TEST_TENANT_ID,
      });
      mockPrisma.bom_headers.create.mockResolvedValue({
        id: uuid(3),
        bom_code: 'BOM-003',
        bom_items: [{ id: uuid(4), component_code: 'PLY-18', item_id: uuid(50) }],
      });

      const req = createRequest('/api/products/' + uuid(1) + '/bom', {
        method: 'POST',
        body: {
          bomCode: 'BOM-003',
          items: [
            { componentCode: 'PLY-18', componentName: 'Plywood', componentType: 'raw_material', qtyPerProduct: 2, uomCode: 'SHT', itemId: uuid(50) },
          ],
        },
      });

      const res = await createBom(req, createRouteContext({ id: uuid(1) }));
      const { status } = await parseResponse(res);

      expect(status).toBe(201);
    });
  });

  describe('POST /api/products/[id]/routing', () => {
    it('should create routing for product current version', async () => {
      mockPrisma.products.findUnique.mockResolvedValue({
        id: uuid(1),
        current_version_id: uuid(2),
        tenant_id: TEST_TENANT_ID,
      });
      mockPrisma.routings.create.mockResolvedValue({
        id: uuid(3),
        routing_code: 'RT-001',
        routing_steps: [{ id: uuid(4), step_no: 1, step_code: 'CUT' }],
      });

      const req = createRequest('/api/products/' + uuid(1) + '/routing', {
        method: 'POST',
        body: {
          routingCode: 'RT-001',
          steps: [
            { stepNo: 1, stepCode: 'CUT', stepName: 'Cutting', workCenterId: uuid(20), standardMinutes: 30 },
          ],
        },
      });

      const res = await createRouting(req, createRouteContext({ id: uuid(1) }));
      const { status } = await parseResponse(res);

      expect(status).toBe(201);
    });

    it('should return 404 when product has no current version', async () => {
      mockPrisma.products.findUnique.mockResolvedValue({
        id: uuid(1),
        current_version_id: null,
        tenant_id: TEST_TENANT_ID,
      });

      const req = createRequest('/api/products/' + uuid(1) + '/routing', {
        method: 'POST',
        body: {
          routingCode: 'RT-001',
          steps: [
            { stepNo: 1, stepCode: 'CUT', stepName: 'Cutting', workCenterId: uuid(20) },
          ],
        },
      });

      const res = await createRouting(req, createRouteContext({ id: uuid(1) }));
      const { status } = await parseResponse(res);

      expect(status).toBe(404);
    });

    it('should return 404 for non-existent product', async () => {
      mockPrisma.products.findUnique.mockResolvedValue(null);

      const req = createRequest('/api/products/' + uuid(99) + '/routing', {
        method: 'POST',
        body: {
          routingCode: 'RT-001',
          steps: [{ stepNo: 1, stepCode: 'CUT', stepName: 'Cutting', workCenterId: uuid(20) }],
        },
      });

      const res = await createRouting(req, createRouteContext({ id: uuid(99) }));
      const { status } = await parseResponse(res);

      expect(status).toBe(404);
    });

    it('should create routing with multiple sequential steps', async () => {
      mockPrisma.products.findUnique.mockResolvedValue({
        id: uuid(1),
        current_version_id: uuid(2),
        tenant_id: TEST_TENANT_ID,
      });
      mockPrisma.routings.create.mockResolvedValue({
        id: uuid(3),
        routing_code: 'RT-002',
        routing_steps: [
          { id: uuid(4), step_no: 1, step_code: 'CUT' },
          { id: uuid(5), step_no: 2, step_code: 'SAND' },
          { id: uuid(6), step_no: 3, step_code: 'FINISH' },
        ],
      });

      const req = createRequest('/api/products/' + uuid(1) + '/routing', {
        method: 'POST',
        body: {
          routingCode: 'RT-002',
          steps: [
            { stepNo: 1, stepCode: 'CUT', stepName: 'Cutting', workCenterId: uuid(20), standardMinutes: 30 },
            { stepNo: 2, stepCode: 'SAND', stepName: 'Sanding', workCenterId: uuid(21), standardMinutes: 20 },
            { stepNo: 3, stepCode: 'FINISH', stepName: 'Finishing', workCenterId: uuid(22), standardMinutes: 45 },
          ],
        },
      });

      const res = await createRouting(req, createRouteContext({ id: uuid(1) }));
      const { status, body } = await parseResponse(res);

      expect(status).toBe(201);
      expect(body.routing_steps).toHaveLength(3);
    });

    it('should default standardMinutes to 0 when not provided', async () => {
      mockPrisma.products.findUnique.mockResolvedValue({
        id: uuid(1),
        current_version_id: uuid(2),
        tenant_id: TEST_TENANT_ID,
      });
      mockPrisma.routings.create.mockResolvedValue({
        id: uuid(3),
        routing_code: 'RT-003',
        routing_steps: [{ id: uuid(4), step_no: 1, step_code: 'CUT', standard_minutes: 0 }],
      });

      const req = createRequest('/api/products/' + uuid(1) + '/routing', {
        method: 'POST',
        body: {
          routingCode: 'RT-003',
          steps: [
            { stepNo: 1, stepCode: 'CUT', stepName: 'Cutting', workCenterId: uuid(20) },
          ],
        },
      });

      const res = await createRouting(req, createRouteContext({ id: uuid(1) }));
      const { status } = await parseResponse(res);

      expect(status).toBe(201);
    });
  });
});
