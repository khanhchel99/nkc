import { vi } from 'vitest';

// Mock Prisma globally
vi.mock('@/lib/prisma', () => ({
  prisma: createMockPrisma(),
}));

// Mock bcrypt
vi.mock('bcrypt', () => ({
  default: {
    compare: vi.fn(),
    hash: vi.fn(),
  },
  compare: vi.fn(),
  hash: vi.fn(),
}));

function createMockPrisma() {
  const handler: ProxyHandler<Record<string, unknown>> = {
    get(_target, prop: string) {
      if (prop === '$transaction') {
        return vi.fn(async (fnOrArray: unknown) => {
          if (typeof fnOrArray === 'function') {
            return fnOrArray(new Proxy({}, handler));
          }
          // Array of promises
          return Promise.all(fnOrArray as Promise<unknown>[]);
        });
      }
      if (prop === '$connect' || prop === '$disconnect') {
        return vi.fn();
      }
      // Return a model proxy
      return new Proxy({}, {
        get(_t, method: string) {
          return vi.fn();
        },
      });
    },
  };
  return new Proxy({}, handler);
}
