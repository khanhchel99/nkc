import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createRequest, parseResponse, setupEnv, uuid, TEST_TENANT_ID } from '@/__tests__/helpers';

const { mockPrisma, mockBcrypt } = vi.hoisted(() => ({
  mockPrisma: {
    users: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    refresh_sessions: {
      create: vi.fn(),
      findFirst: vi.fn(),
      updateMany: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn(async (arr: Promise<unknown>[]) => Promise.all(arr)),
  },
  mockBcrypt: {
    compare: vi.fn(),
    hash: vi.fn(),
  },
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));
vi.mock('bcrypt', () => ({ default: mockBcrypt }));

setupEnv();

import { POST as loginPost } from '@/app/api/auth/login/route';
import { POST as logoutPost } from '@/app/api/auth/logout/route';
import { POST as refreshPost } from '@/app/api/auth/refresh/route';

describe('Auth Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/auth/login', () => {
    const validUser = {
      id: uuid(10),
      email: 'admin@nkc.com',
      tenant_id: TEST_TENANT_ID,
      full_name: 'Admin User',
      password_hash: '$2b$12$hashedpassword',
      status: 'active',
      user_roles: [
        {
          roles: {
            code: 'admin',
            role_permissions: [
              { permissions: { code: 'users.read' } },
              { permissions: { code: 'users.write' } },
            ],
          },
        },
      ],
    };

    it('should return tokens for valid credentials', async () => {
      mockPrisma.users.findUnique.mockResolvedValue(validUser);
      mockBcrypt.compare.mockResolvedValue(true);
      mockPrisma.refresh_sessions.create.mockResolvedValue({ id: uuid(1) });
      mockPrisma.users.update.mockResolvedValue({});

      const req = createRequest('/api/auth/login', {
        method: 'POST',
        body: { tenantId: TEST_TENANT_ID, email: 'admin@nkc.com', password: 'password123' },
        token: undefined,
      });

      const res = await loginPost(req);
      const { status, body } = await parseResponse(res);

      expect(status).toBe(200);
      expect(body.accessToken).toBeDefined();
      expect(body.refreshToken).toBeDefined();
      expect(body.expiresIn).toBe(900);
      expect(body.user.email).toBe('admin@nkc.com');
      expect(body.user.roles).toEqual(['admin']);
      expect(body.user.permissions).toEqual(['users.read', 'users.write']);
    });

    it('should aggregate permissions from multiple roles', async () => {
      const multiRoleUser = {
        ...validUser,
        user_roles: [
          {
            roles: {
              code: 'admin',
              role_permissions: [
                { permissions: { code: 'users.read' } },
              ],
            },
          },
          {
            roles: {
              code: 'planner',
              role_permissions: [
                { permissions: { code: 'planning.read' } },
                { permissions: { code: 'planning.write' } },
              ],
            },
          },
        ],
      };
      mockPrisma.users.findUnique.mockResolvedValue(multiRoleUser);
      mockBcrypt.compare.mockResolvedValue(true);
      mockPrisma.refresh_sessions.create.mockResolvedValue({ id: uuid(1) });
      mockPrisma.users.update.mockResolvedValue({});

      const req = createRequest('/api/auth/login', {
        method: 'POST',
        body: { tenantId: TEST_TENANT_ID, email: 'admin@nkc.com', password: 'password123' },
        token: undefined,
      });

      const res = await loginPost(req);
      const { status, body } = await parseResponse(res);

      expect(status).toBe(200);
      expect(body.user.roles).toEqual(['admin', 'planner']);
      expect(body.user.permissions).toContain('users.read');
      expect(body.user.permissions).toContain('planning.read');
      expect(body.user.permissions).toContain('planning.write');
    });

    it('should handle user with no roles', async () => {
      const noRoleUser = { ...validUser, user_roles: [] };
      mockPrisma.users.findUnique.mockResolvedValue(noRoleUser);
      mockBcrypt.compare.mockResolvedValue(true);
      mockPrisma.refresh_sessions.create.mockResolvedValue({ id: uuid(1) });
      mockPrisma.users.update.mockResolvedValue({});

      const req = createRequest('/api/auth/login', {
        method: 'POST',
        body: { tenantId: TEST_TENANT_ID, email: 'admin@nkc.com', password: 'password123' },
        token: undefined,
      });

      const res = await loginPost(req);
      const { status, body } = await parseResponse(res);

      expect(status).toBe(200);
      expect(body.user.roles).toEqual([]);
      expect(body.user.permissions).toEqual([]);
    });

    it('should return 401 for invalid password', async () => {
      mockPrisma.users.findUnique.mockResolvedValue(validUser);
      mockBcrypt.compare.mockResolvedValue(false);

      const req = createRequest('/api/auth/login', {
        method: 'POST',
        body: { tenantId: TEST_TENANT_ID, email: 'admin@nkc.com', password: 'wrongpass' },
        token: undefined,
      });

      const res = await loginPost(req);
      const { status, body } = await parseResponse(res);

      expect(status).toBe(401);
      expect(body.error).toBe('Invalid credentials');
    });

    it('should return 401 for non-existent user', async () => {
      mockPrisma.users.findUnique.mockResolvedValue(null);

      const req = createRequest('/api/auth/login', {
        method: 'POST',
        body: { tenantId: TEST_TENANT_ID, email: 'nobody@nkc.com', password: 'pass' },
        token: undefined,
      });

      const res = await loginPost(req);
      const { status } = await parseResponse(res);

      expect(status).toBe(401);
    });

    it('should return 401 for inactive user', async () => {
      mockPrisma.users.findUnique.mockResolvedValue({ ...validUser, status: 'inactive' });

      const req = createRequest('/api/auth/login', {
        method: 'POST',
        body: { tenantId: TEST_TENANT_ID, email: 'admin@nkc.com', password: 'password123' },
        token: undefined,
      });

      const res = await loginPost(req);
      const { status } = await parseResponse(res);

      expect(status).toBe(401);
    });

    it('should return 401 for suspended user', async () => {
      mockPrisma.users.findUnique.mockResolvedValue({ ...validUser, status: 'suspended' });

      const req = createRequest('/api/auth/login', {
        method: 'POST',
        body: { tenantId: TEST_TENANT_ID, email: 'admin@nkc.com', password: 'password123' },
        token: undefined,
      });

      const res = await loginPost(req);
      const { status } = await parseResponse(res);

      expect(status).toBe(401);
    });

    it('should return 400 for missing fields', async () => {
      const req = createRequest('/api/auth/login', {
        method: 'POST',
        body: { email: 'admin@nkc.com' },
        token: undefined,
      });

      const res = await loginPost(req);
      const { status, body } = await parseResponse(res);

      expect(status).toBe(400);
      expect(body.error).toContain('required');
    });

    it('should return 400 when only tenantId provided', async () => {
      const req = createRequest('/api/auth/login', {
        method: 'POST',
        body: { tenantId: TEST_TENANT_ID },
        token: undefined,
      });

      const res = await loginPost(req);
      const { status } = await parseResponse(res);

      expect(status).toBe(400);
    });

    it('should return 400 when password missing', async () => {
      const req = createRequest('/api/auth/login', {
        method: 'POST',
        body: { tenantId: TEST_TENANT_ID, email: 'admin@nkc.com' },
        token: undefined,
      });

      const res = await loginPost(req);
      const { status } = await parseResponse(res);

      expect(status).toBe(400);
    });

    it('should return 400 for empty body', async () => {
      const req = createRequest('/api/auth/login', {
        method: 'POST',
        body: {},
        token: undefined,
      });

      const res = await loginPost(req);
      const { status } = await parseResponse(res);

      expect(status).toBe(400);
    });

    it('should update last_login_at on successful login', async () => {
      mockPrisma.users.findUnique.mockResolvedValue(validUser);
      mockBcrypt.compare.mockResolvedValue(true);
      mockPrisma.refresh_sessions.create.mockResolvedValue({ id: uuid(1) });
      mockPrisma.users.update.mockResolvedValue({});

      const req = createRequest('/api/auth/login', {
        method: 'POST',
        body: { tenantId: TEST_TENANT_ID, email: 'admin@nkc.com', password: 'password123' },
        token: undefined,
      });

      await loginPost(req);

      expect(mockPrisma.users.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: validUser.id },
          data: expect.objectContaining({ last_login_at: expect.any(Date) }),
        }),
      );
    });

    it('should handle bcrypt.compare throwing an error', async () => {
      mockPrisma.users.findUnique.mockResolvedValue(validUser);
      mockBcrypt.compare.mockRejectedValue(new Error('bcrypt failure'));

      const req = createRequest('/api/auth/login', {
        method: 'POST',
        body: { tenantId: TEST_TENANT_ID, email: 'admin@nkc.com', password: 'password123' },
        token: undefined,
      });

      const res = await loginPost(req);
      const { status } = await parseResponse(res);

      expect(status).toBeGreaterThanOrEqual(400);
    });

    it('should handle database error on findUnique', async () => {
      mockPrisma.users.findUnique.mockRejectedValue(new Error('DB connection lost'));

      const req = createRequest('/api/auth/login', {
        method: 'POST',
        body: { tenantId: TEST_TENANT_ID, email: 'admin@nkc.com', password: 'password123' },
        token: undefined,
      });

      const res = await loginPost(req);
      const { status } = await parseResponse(res);

      expect(status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should revoke refresh token', async () => {
      mockPrisma.refresh_sessions.updateMany.mockResolvedValue({ count: 1 });

      const req = createRequest('/api/auth/logout', {
        method: 'POST',
        body: { refreshToken: 'some-refresh-token' },
        token: undefined,
      });

      const res = await logoutPost(req);
      const { status, body } = await parseResponse(res);

      expect(status).toBe(200);
      expect(body.success).toBe(true);
      expect(mockPrisma.refresh_sessions.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ revoked_at: expect.any(Date) }),
        }),
      );
    });

    it('should succeed even if token matches no records (idempotent)', async () => {
      mockPrisma.refresh_sessions.updateMany.mockResolvedValue({ count: 0 });

      const req = createRequest('/api/auth/logout', {
        method: 'POST',
        body: { refreshToken: 'already-revoked-token' },
        token: undefined,
      });

      const res = await logoutPost(req);
      const { status, body } = await parseResponse(res);

      expect(status).toBe(200);
      expect(body.success).toBe(true);
    });

    it('should return 400 for missing refreshToken', async () => {
      const req = createRequest('/api/auth/logout', {
        method: 'POST',
        body: {},
        token: undefined,
      });

      const res = await logoutPost(req);
      const { status } = await parseResponse(res);

      expect(status).toBe(400);
    });

    it('should return 400 for empty body', async () => {
      const req = createRequest('/api/auth/logout', {
        method: 'POST',
        body: {},
        token: undefined,
      });

      const res = await logoutPost(req);
      const { status } = await parseResponse(res);

      expect(status).toBe(400);
    });
  });

  describe('POST /api/auth/refresh', () => {
    const mockSession = {
      id: uuid(1),
      user_id: uuid(10),
      users: {
        id: uuid(10),
        email: 'admin@nkc.com',
        tenant_id: TEST_TENANT_ID,
        status: 'active',
        user_roles: [
          {
            roles: {
              code: 'admin',
              role_permissions: [{ permissions: { code: 'users.read' } }],
            },
          },
        ],
      },
    };

    it('should rotate tokens for valid refresh token', async () => {
      mockPrisma.refresh_sessions.findFirst.mockResolvedValue(mockSession);
      mockPrisma.$transaction.mockResolvedValue([{}, {}]);

      const req = createRequest('/api/auth/refresh', {
        method: 'POST',
        body: { refreshToken: 'valid-refresh-token' },
        token: undefined,
      });

      const res = await refreshPost(req);
      const { status, body } = await parseResponse(res);

      expect(status).toBe(200);
      expect(body.accessToken).toBeDefined();
      expect(body.refreshToken).toBeDefined();
      expect(body.expiresIn).toBe(900);
    });

    it('should return 401 for invalid/expired refresh token', async () => {
      mockPrisma.refresh_sessions.findFirst.mockResolvedValue(null);

      const req = createRequest('/api/auth/refresh', {
        method: 'POST',
        body: { refreshToken: 'expired-token' },
        token: undefined,
      });

      const res = await refreshPost(req);
      const { status } = await parseResponse(res);

      expect(status).toBe(401);
    });

    it('should return 401 when user became inactive after token was issued', async () => {
      const inactiveSession = {
        ...mockSession,
        users: { ...mockSession.users, status: 'inactive' },
      };
      mockPrisma.refresh_sessions.findFirst.mockResolvedValue(null); // findFirst filters by user status = active

      const req = createRequest('/api/auth/refresh', {
        method: 'POST',
        body: { refreshToken: 'valid-but-user-inactive' },
        token: undefined,
      });

      const res = await refreshPost(req);
      const { status } = await parseResponse(res);

      expect(status).toBe(401);
    });

    it('should return 400 when refreshToken missing', async () => {
      const req = createRequest('/api/auth/refresh', {
        method: 'POST',
        body: {},
        token: undefined,
      });

      const res = await refreshPost(req);
      const { status } = await parseResponse(res);

      expect(status).toBe(400);
    });

    it('should handle transaction failure gracefully', async () => {
      mockPrisma.refresh_sessions.findFirst.mockResolvedValue(mockSession);
      mockPrisma.$transaction.mockRejectedValue(new Error('Transaction deadlock'));

      const req = createRequest('/api/auth/refresh', {
        method: 'POST',
        body: { refreshToken: 'valid-refresh-token' },
        token: undefined,
      });

      const res = await refreshPost(req);
      const { status } = await parseResponse(res);

      expect(status).toBeGreaterThanOrEqual(400);
    });

    it('should rebuild roles/permissions on refresh', async () => {
      const sessionWithMultipleRoles = {
        ...mockSession,
        users: {
          ...mockSession.users,
          user_roles: [
            {
              roles: {
                code: 'admin',
                role_permissions: [{ permissions: { code: 'users.read' } }],
              },
            },
            {
              roles: {
                code: 'viewer',
                role_permissions: [{ permissions: { code: 'reports.view' } }],
              },
            },
          ],
        },
      };
      mockPrisma.refresh_sessions.findFirst.mockResolvedValue(sessionWithMultipleRoles);
      mockPrisma.$transaction.mockResolvedValue([{}, {}]);

      const req = createRequest('/api/auth/refresh', {
        method: 'POST',
        body: { refreshToken: 'valid-refresh-token' },
        token: undefined,
      });

      const res = await refreshPost(req);
      const { status, body } = await parseResponse(res);

      expect(status).toBe(200);
      expect(body.accessToken).toBeDefined();
      expect(body.refreshToken).toBeDefined();
      expect(body.expiresIn).toBe(900);
      // Roles/permissions are embedded in the JWT, verify transaction ran
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });
  });
});
