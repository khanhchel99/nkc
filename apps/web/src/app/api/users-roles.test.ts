import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createRequest, parseResponse, setupEnv, createRouteContext, uuid, TEST_TENANT_ID } from '@/__tests__/helpers';

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    users: {
      findMany: vi.fn(),
      count: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      findUnique: vi.fn(),
    },
    user_roles: {
      createMany: vi.fn(),
    },
    roles: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    role_permissions: {
      deleteMany: vi.fn(),
      createMany: vi.fn(),
    },
  },
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));
vi.mock('bcrypt', () => ({
  default: { hash: vi.fn().mockResolvedValue('$2b$12$hashedpassword') },
}));

setupEnv();

import { GET as getUsers, POST as createUser } from '@/app/api/users/route';
import { GET as getUserById } from '@/app/api/users/[id]/route';
import { GET as getRoles, POST as createRole } from '@/app/api/roles/route';
import { POST as assignPermissions } from '@/app/api/roles/[id]/permissions/route';

describe('Users Routes', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('GET /api/users', () => {
    it('should return paginated users', async () => {
      const users = [
        { id: uuid(1), email: 'user1@nkc.com', full_name: 'User 1', tenant_id: TEST_TENANT_ID, status: 'active', user_roles: [] },
        { id: uuid(2), email: 'user2@nkc.com', full_name: 'User 2', tenant_id: TEST_TENANT_ID, status: 'active', user_roles: [] },
      ];
      mockPrisma.users.findMany.mockResolvedValue(users);
      mockPrisma.users.count.mockResolvedValue(2);

      const req = createRequest('/api/users?page=1&limit=20');
      const res = await getUsers(req);
      const { status, body } = await parseResponse(res);

      expect(status).toBe(200);
      expect(body.data).toHaveLength(2);
      expect(body.total).toBe(2);
      expect(body.page).toBe(1);
      expect(body.totalPages).toBe(1);
    });

    it('should respect page and limit params', async () => {
      mockPrisma.users.findMany.mockResolvedValue([]);
      mockPrisma.users.count.mockResolvedValue(50);

      const req = createRequest('/api/users?page=3&limit=10');
      const res = await getUsers(req);
      const { body } = await parseResponse(res);

      expect(body.page).toBe(3);
      expect(body.limit).toBe(10);
      expect(body.totalPages).toBe(5);
      expect(mockPrisma.users.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 20, take: 10 }),
      );
    });

    it('should use default pagination when no params provided', async () => {
      mockPrisma.users.findMany.mockResolvedValue([]);
      mockPrisma.users.count.mockResolvedValue(0);

      const req = createRequest('/api/users');
      const res = await getUsers(req);
      const { status, body } = await parseResponse(res);

      expect(status).toBe(200);
      expect(body.page).toBe(1);
      expect(body.data).toEqual([]);
    });

    it('should handle empty result set', async () => {
      mockPrisma.users.findMany.mockResolvedValue([]);
      mockPrisma.users.count.mockResolvedValue(0);

      const req = createRequest('/api/users?page=1&limit=20');
      const res = await getUsers(req);
      const { status, body } = await parseResponse(res);

      expect(status).toBe(200);
      expect(body.data).toHaveLength(0);
      expect(body.total).toBe(0);
      expect(body.totalPages).toBe(0);
    });

    it('should handle large page number beyond total', async () => {
      mockPrisma.users.findMany.mockResolvedValue([]);
      mockPrisma.users.count.mockResolvedValue(5);

      const req = createRequest('/api/users?page=100&limit=20');
      const res = await getUsers(req);
      const { status, body } = await parseResponse(res);

      expect(status).toBe(200);
      expect(body.data).toEqual([]);
    });

    it('should scope users to tenant', async () => {
      mockPrisma.users.findMany.mockResolvedValue([]);
      mockPrisma.users.count.mockResolvedValue(0);

      const req = createRequest('/api/users');
      await getUsers(req);

      expect(mockPrisma.users.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ tenant_id: TEST_TENANT_ID }),
        }),
      );
    });
  });

  describe('POST /api/users', () => {
    it('should create user with hashed password', async () => {
      mockPrisma.users.findUnique.mockResolvedValue(null);
      const newUser = {
        id: uuid(5),
        email: 'new@nkc.com',
        full_name: 'New User',
        tenant_id: TEST_TENANT_ID,
        status: 'active',
      };
      mockPrisma.users.create.mockResolvedValue(newUser);

      const req = createRequest('/api/users', {
        method: 'POST',
        body: { email: 'new@nkc.com', password: 'password123', fullName: 'New User' },
      });

      const res = await createUser(req);
      const { status, body } = await parseResponse(res);

      expect(status).toBe(201);
      expect(body.email).toBe('new@nkc.com');
      expect(mockPrisma.users.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            password_hash: '$2b$12$hashedpassword',
          }),
        }),
      );
    });

    it('should return 409 for duplicate email', async () => {
      mockPrisma.users.findUnique.mockResolvedValue({ id: uuid(1) });

      const req = createRequest('/api/users', {
        method: 'POST',
        body: { email: 'existing@nkc.com', password: 'pass', fullName: 'Existing' },
      });

      const res = await createUser(req);
      const { status } = await parseResponse(res);

      expect(status).toBe(409);
    });

    it('should create user with roleIds', async () => {
      mockPrisma.users.findUnique.mockResolvedValue(null);
      mockPrisma.users.create.mockResolvedValue({
        id: uuid(5),
        email: 'newroles@nkc.com',
        full_name: 'Role User',
        tenant_id: TEST_TENANT_ID,
        status: 'active',
      });

      const req = createRequest('/api/users', {
        method: 'POST',
        body: {
          email: 'newroles@nkc.com',
          password: 'password123',
          fullName: 'Role User',
          roleIds: [uuid(1), uuid(2)],
        },
      });

      const res = await createUser(req);
      const { status } = await parseResponse(res);

      expect(status).toBe(201);
    });

    it('should create user with phone and optional fields', async () => {
      mockPrisma.users.findUnique.mockResolvedValue(null);
      mockPrisma.users.create.mockResolvedValue({
        id: uuid(5),
        email: 'phone@nkc.com',
        full_name: 'Phone User',
        phone: '+84-123-456-789',
        tenant_id: TEST_TENANT_ID,
        status: 'active',
      });

      const req = createRequest('/api/users', {
        method: 'POST',
        body: {
          email: 'phone@nkc.com',
          password: 'password123',
          fullName: 'Phone User',
          phone: '+84-123-456-789',
        },
      });

      const res = await createUser(req);
      const { status } = await parseResponse(res);

      expect(status).toBe(201);
    });

    it('should handle database error on create', async () => {
      mockPrisma.users.findUnique.mockResolvedValue(null);
      mockPrisma.users.create.mockRejectedValue(new Error('DB constraint violation'));

      const req = createRequest('/api/users', {
        method: 'POST',
        body: { email: 'new@nkc.com', password: 'password123', fullName: 'New User' },
      });

      const res = await createUser(req);
      const { status } = await parseResponse(res);

      expect(status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('GET /api/users/[id]', () => {
    it('should return user by id', async () => {
      const user = {
        id: uuid(1),
        email: 'user@nkc.com',
        full_name: 'User',
        tenant_id: TEST_TENANT_ID,
        user_roles: [],
      };
      mockPrisma.users.findUnique.mockResolvedValue(user);

      const req = createRequest('/api/users/' + uuid(1));
      const res = await getUserById(req, createRouteContext({ id: uuid(1) }));
      const { status, body } = await parseResponse(res);

      expect(status).toBe(200);
      expect(body.id).toBe(uuid(1));
    });

    it('should return 404 for non-existent user', async () => {
      mockPrisma.users.findUnique.mockResolvedValue(null);

      const req = createRequest('/api/users/' + uuid(99));
      const res = await getUserById(req, createRouteContext({ id: uuid(99) }));
      const { status } = await parseResponse(res);

      expect(status).toBe(404);
    });

    it('should include user roles in response', async () => {
      const user = {
        id: uuid(1),
        email: 'user@nkc.com',
        full_name: 'User',
        tenant_id: TEST_TENANT_ID,
        user_roles: [
          { roles: { code: 'admin', name: 'Admin' } },
        ],
      };
      mockPrisma.users.findUnique.mockResolvedValue(user);

      const req = createRequest('/api/users/' + uuid(1));
      const res = await getUserById(req, createRouteContext({ id: uuid(1) }));
      const { status, body } = await parseResponse(res);

      expect(status).toBe(200);
      expect(body.user_roles).toHaveLength(1);
    });
  });
});

describe('Roles Routes', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('GET /api/roles', () => {
    it('should return roles for tenant', async () => {
      const roles = [
        { id: uuid(1), code: 'admin', name: 'Admin', role_permissions: [] },
      ];
      mockPrisma.roles.findMany.mockResolvedValue(roles);

      const req = createRequest('/api/roles');
      const res = await getRoles(req);
      const { status, body } = await parseResponse(res);

      expect(status).toBe(200);
      expect(body).toHaveLength(1);
    });

    it('should return empty array when no roles exist', async () => {
      mockPrisma.roles.findMany.mockResolvedValue([]);

      const req = createRequest('/api/roles');
      const res = await getRoles(req);
      const { status, body } = await parseResponse(res);

      expect(status).toBe(200);
      expect(body).toEqual([]);
    });

    it('should include role permissions in response', async () => {
      const roles = [
        {
          id: uuid(1),
          code: 'admin',
          name: 'Admin',
          role_permissions: [
            { permissions: { id: uuid(20), code: 'users.read' } },
            { permissions: { id: uuid(21), code: 'users.write' } },
          ],
        },
      ];
      mockPrisma.roles.findMany.mockResolvedValue(roles);

      const req = createRequest('/api/roles');
      const res = await getRoles(req);
      const { status, body } = await parseResponse(res);

      expect(status).toBe(200);
      expect(body[0].role_permissions).toHaveLength(2);
    });

    it('should scope roles by tenant', async () => {
      mockPrisma.roles.findMany.mockResolvedValue([]);

      const req = createRequest('/api/roles');
      await getRoles(req);

      expect(mockPrisma.roles.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ tenant_id: TEST_TENANT_ID }),
        }),
      );
    });
  });

  describe('POST /api/roles', () => {
    it('should create a role', async () => {
      mockPrisma.roles.findUnique.mockResolvedValue(null);
      mockPrisma.roles.create.mockResolvedValue({
        id: uuid(1),
        code: 'planner',
        name: 'Planner',
        role_permissions: [],
      });

      const req = createRequest('/api/roles', {
        method: 'POST',
        body: { code: 'planner', name: 'Planner' },
      });

      const res = await createRole(req);
      const { status, body } = await parseResponse(res);

      expect(status).toBe(201);
      expect(body.code).toBe('planner');
    });

    it('should return 409 for duplicate role code', async () => {
      mockPrisma.roles.findUnique.mockResolvedValue({ id: uuid(1) });

      const req = createRequest('/api/roles', {
        method: 'POST',
        body: { code: 'admin', name: 'Admin' },
      });

      const res = await createRole(req);
      const { status } = await parseResponse(res);

      expect(status).toBe(409);
    });

    it('should create role with permissionIds', async () => {
      mockPrisma.roles.findUnique.mockResolvedValue(null);
      mockPrisma.roles.create.mockResolvedValue({
        id: uuid(1),
        code: 'editor',
        name: 'Editor',
        role_permissions: [
          { permissions: { id: uuid(20), code: 'users.write' } },
        ],
      });

      const req = createRequest('/api/roles', {
        method: 'POST',
        body: { code: 'editor', name: 'Editor', permissionIds: [uuid(20)] },
      });

      const res = await createRole(req);
      const { status, body } = await parseResponse(res);

      expect(status).toBe(201);
      expect(body.code).toBe('editor');
    });

    it('should handle database error during creation', async () => {
      mockPrisma.roles.findUnique.mockResolvedValue(null);
      mockPrisma.roles.create.mockRejectedValue(new Error('DB failure'));

      const req = createRequest('/api/roles', {
        method: 'POST',
        body: { code: 'newrole', name: 'New Role' },
      });

      const res = await createRole(req);
      const { status } = await parseResponse(res);

      expect(status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('POST /api/roles/[id]/permissions', () => {
    it('should assign permissions to role', async () => {
      mockPrisma.roles.findUnique.mockResolvedValueOnce({ id: uuid(1), tenant_id: TEST_TENANT_ID });
      mockPrisma.role_permissions.deleteMany.mockResolvedValue({ count: 0 });
      mockPrisma.role_permissions.createMany.mockResolvedValue({ count: 2 });
      mockPrisma.roles.findUnique.mockResolvedValueOnce({
        id: uuid(1),
        code: 'planner',
        role_permissions: [
          { permissions: { id: uuid(20), code: 'planning.read' } },
          { permissions: { id: uuid(21), code: 'planning.write' } },
        ],
      });

      const req = createRequest('/api/roles/' + uuid(1) + '/permissions', {
        method: 'POST',
        body: { permissionIds: [uuid(20), uuid(21)] },
      });

      const res = await assignPermissions(req, createRouteContext({ id: uuid(1) }));
      const { status } = await parseResponse(res);

      expect(status).toBe(200);
    });

    it('should return 404 for non-existent role', async () => {
      mockPrisma.roles.findUnique.mockResolvedValue(null);

      const req = createRequest('/api/roles/' + uuid(99) + '/permissions', {
        method: 'POST',
        body: { permissionIds: [uuid(20)] },
      });

      const res = await assignPermissions(req, createRouteContext({ id: uuid(99) }));
      const { status } = await parseResponse(res);

      expect(status).toBe(404);
    });

    it('should replace existing permissions (full replacement)', async () => {
      mockPrisma.roles.findUnique.mockResolvedValueOnce({ id: uuid(1), tenant_id: TEST_TENANT_ID });
      mockPrisma.role_permissions.deleteMany.mockResolvedValue({ count: 3 });
      mockPrisma.role_permissions.createMany.mockResolvedValue({ count: 1 });
      mockPrisma.roles.findUnique.mockResolvedValueOnce({
        id: uuid(1),
        code: 'planner',
        role_permissions: [
          { permissions: { id: uuid(22), code: 'inventory.read' } },
        ],
      });

      const req = createRequest('/api/roles/' + uuid(1) + '/permissions', {
        method: 'POST',
        body: { permissionIds: [uuid(22)] },
      });

      const res = await assignPermissions(req, createRouteContext({ id: uuid(1) }));
      const { status } = await parseResponse(res);

      expect(status).toBe(200);
      expect(mockPrisma.role_permissions.deleteMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { role_id: uuid(1) } }),
      );
    });

    it('should handle empty permissionIds array', async () => {
      mockPrisma.roles.findUnique.mockResolvedValueOnce({ id: uuid(1), tenant_id: TEST_TENANT_ID });
      mockPrisma.role_permissions.deleteMany.mockResolvedValue({ count: 2 });
      mockPrisma.role_permissions.createMany.mockResolvedValue({ count: 0 });
      mockPrisma.roles.findUnique.mockResolvedValueOnce({
        id: uuid(1),
        code: 'planner',
        role_permissions: [],
      });

      const req = createRequest('/api/roles/' + uuid(1) + '/permissions', {
        method: 'POST',
        body: { permissionIds: [] },
      });

      const res = await assignPermissions(req, createRouteContext({ id: uuid(1) }));
      const { status } = await parseResponse(res);

      expect(status).toBe(200);
    });
  });
});
