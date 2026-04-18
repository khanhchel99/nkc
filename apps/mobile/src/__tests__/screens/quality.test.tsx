import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { router } from 'expo-router';

const mockGet = jest.fn();
jest.mock('@/lib/api', () => ({
  api: { get: (...args: unknown[]) => mockGet(...args) },
  ApiError: class extends Error { status: number; constructor(s: number, m: string) { super(m); this.status = s; } },
}));

jest.mock('@/lib/auth-store', () => ({
  useAuthStore: Object.assign(jest.fn(() => ({ isAuthenticated: true })), {
    getState: jest.fn(() => ({ accessToken: 'tok', refreshToken: 'ref', logout: jest.fn() })),
    setState: jest.fn(),
    subscribe: jest.fn(),
  }),
}));

import QualityScreen from '../../../app/(tabs)/quality';

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

const mockInspections = {
  data: [
    {
      id: 'i1',
      inspection_no: 'INS-001',
      result: 'pending',
      ref_type: 'work_order_step',
      inspected_qty: 0,
      passed_qty: 0,
      failed_qty: 0,
      qc_plans: { plan_name: 'Kiểm tra bề mặt' },
    },
    {
      id: 'i2',
      inspection_no: 'INS-002',
      result: 'passed',
      ref_type: 'incoming_receipt',
      inspected_qty: 50,
      passed_qty: 48,
      failed_qty: 2,
      qc_plans: { plan_name: 'Kiểm tra vật liệu nhập' },
    },
    {
      id: 'i3',
      inspection_no: 'INS-003',
      result: 'failed',
      ref_type: 'shipment',
      inspected_qty: 20,
      passed_qty: 5,
      failed_qty: 15,
      qc_plans: { plan_name: 'Kiểm tra trước giao' },
    },
  ],
  pagination: { total: 3, page: 1, limit: 20, totalPages: 1 },
};

beforeEach(() => {
  jest.clearAllMocks();
  mockGet.mockResolvedValue(mockInspections);
});

describe('QualityScreen', () => {
  it('renders inspection list', async () => {
    const { getByText } = render(<QualityScreen />, { wrapper });

    await waitFor(() => {
      expect(getByText('INS-001')).toBeTruthy();
      expect(getByText('INS-002')).toBeTruthy();
      expect(getByText('INS-003')).toBeTruthy();
    });
  });

  it('shows plan names', async () => {
    const { getByText } = render(<QualityScreen />, { wrapper });

    await waitFor(() => {
      expect(getByText('Kiểm tra bề mặt')).toBeTruthy();
      expect(getByText('Kiểm tra vật liệu nhập')).toBeTruthy();
    });
  });

  it('displays result badges with correct labels', async () => {
    const { getByText } = render(<QualityScreen />, { wrapper });

    await waitFor(() => {
      expect(getByText('Chờ kiểm tra')).toBeTruthy();
      expect(getByText('Đạt')).toBeTruthy();
      expect(getByText('Không đạt')).toBeTruthy();
    });
  });

  it('shows ref type labels', async () => {
    const { getByText } = render(<QualityScreen />, { wrapper });

    await waitFor(() => {
      expect(getByText(/Công đoạn SX/)).toBeTruthy();
      expect(getByText(/Nhập kho/)).toBeTruthy();
      expect(getByText(/Giao hàng/)).toBeTruthy();
    });
  });

  it('navigates to inspection detail on press', async () => {
    const { getByText } = render(<QualityScreen />, { wrapper });

    await waitFor(() => expect(getByText('INS-001')).toBeTruthy());

    fireEvent.press(getByText('INS-001'));

    expect(router.push).toHaveBeenCalledWith('/inspection/i1');
  });

  it('fetches inspections from API', async () => {
    render(<QualityScreen />, { wrapper });

    await waitFor(() => {
      expect(mockGet).toHaveBeenCalled();
      const path = mockGet.mock.calls[0][0];
      expect(path).toContain('/quality/inspections');
    });
  });

  it('shows empty state', async () => {
    mockGet.mockResolvedValue({ data: [], pagination: { total: 0 } });

    const { getByText } = render(<QualityScreen />, { wrapper });

    await waitFor(() => {
      expect(getByText('Chưa có phiếu kiểm tra')).toBeTruthy();
    });
  });
});
