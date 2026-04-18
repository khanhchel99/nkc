import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const mockGet = jest.fn();
jest.mock('@/lib/api', () => ({
  api: { get: (...args: unknown[]) => mockGet(...args) },
  ApiError: class extends Error { status: number; constructor(s: number, m: string) { super(m); this.status = s; } },
}));

jest.mock('@/lib/auth-store', () => ({
  useAuthStore: Object.assign(jest.fn(() => ({
    isAuthenticated: true,
    user: { fullName: 'Admin' },
  })), {
    getState: jest.fn(() => ({ accessToken: 'tok', refreshToken: 'ref', logout: jest.fn() })),
    setState: jest.fn(),
    subscribe: jest.fn(),
  }),
}));

import DashboardScreen from '../../../app/(tabs)/index';

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

beforeEach(() => {
  mockGet.mockReset();
  mockGet.mockResolvedValue({ data: [], total: 5 });
});

describe('DashboardScreen', () => {
  it('renders KPI cards', async () => {
    const { getByText } = render(<DashboardScreen />, { wrapper });

    await waitFor(() => {
      expect(getByText('Đơn hàng đang xử lý')).toBeTruthy();
      expect(getByText('Đang sản xuất')).toBeTruthy();
      expect(getByText('Chờ kiểm tra CL')).toBeTruthy();
      expect(getByText('Sẵn sàng giao')).toBeTruthy();
    });
  });

  it('renders quick action shortcuts', async () => {
    const { getByText } = render(<DashboardScreen />, { wrapper });

    await waitFor(() => {
      expect(getByText('Quét lệnh SX')).toBeTruthy();
      expect(getByText('Lệnh sản xuất')).toBeTruthy();
      expect(getByText('Kiểm tra CL')).toBeTruthy();
      expect(getByText('Kho hàng')).toBeTruthy();
    });
  });

  it('fetches data from 4 endpoints', async () => {
    render(<DashboardScreen />, { wrapper });

    await waitFor(() => {
      expect(mockGet).toHaveBeenCalled();
    });

    const calledPaths = mockGet.mock.calls.map(([path]: string[]) => path);
    expect(calledPaths.some((p: string) => p.includes('sales-orders'))).toBe(true);
    expect(calledPaths.some((p: string) => p.includes('work-orders'))).toBe(true);
    expect(calledPaths.some((p: string) => p.includes('inspections'))).toBe(true);
    expect(calledPaths.some((p: string) => p.includes('shipments'))).toBe(true);
  });

  it('displays KPI totals from API responses', async () => {
    mockGet.mockImplementation((path: string) => {
      if (path.includes('sales-orders')) return Promise.resolve({ data: [], total: 12 });
      if (path.includes('work-orders')) return Promise.resolve({ data: [], total: 8 });
      if (path.includes('inspections')) return Promise.resolve({ data: [], total: 3 });
      if (path.includes('shipments')) return Promise.resolve({ data: [], total: 15 });
      return Promise.resolve({ data: [], total: 0 });
    });

    const { getByText } = render(<DashboardScreen />, { wrapper });

    await waitFor(() => {
      expect(getByText('12')).toBeTruthy();
      expect(getByText('8')).toBeTruthy();
      expect(getByText('3')).toBeTruthy();
      expect(getByText('15')).toBeTruthy();
    });
  });
});
