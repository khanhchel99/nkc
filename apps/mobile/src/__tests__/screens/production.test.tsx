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

import ProductionScreen from '../../../app/(tabs)/production';

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

const mockWorkOrders = {
  data: [
    {
      id: 'wo1',
      wo_number: 'WO-001',
      status: 'in_progress',
      planned_qty: 100,
      completed_qty: 60,
      scrapped_qty: 5,
      work_order_steps: [
        { id: 's1', status: 'completed' },
        { id: 's2', status: 'in_progress' },
        { id: 's3', status: 'pending' },
      ],
    },
    {
      id: 'wo2',
      wo_number: 'WO-002',
      status: 'released',
      planned_qty: 50,
      completed_qty: 0,
      scrapped_qty: 0,
      work_order_steps: [
        { id: 's4', status: 'pending' },
        { id: 's5', status: 'pending' },
      ],
    },
  ],
  pagination: { total: 2, page: 1, limit: 20, totalPages: 1 },
};

beforeEach(() => {
  jest.clearAllMocks();
  mockGet.mockResolvedValue(mockWorkOrders);
});

describe('ProductionScreen', () => {
  it('renders status filter chips', async () => {
    const { getByText } = render(<ProductionScreen />, { wrapper });

    await waitFor(() => {
      expect(getByText('Tất cả')).toBeTruthy();
      expect(getByText('Đã phát')).toBeTruthy();
      expect(getByText('Đang SX')).toBeTruthy();
      expect(getByText('Hoàn thành')).toBeTruthy();
    });
  });

  it('displays work order cards with details', async () => {
    const { getByText } = render(<ProductionScreen />, { wrapper });

    await waitFor(() => {
      expect(getByText('WO-001')).toBeTruthy();
      expect(getByText('WO-002')).toBeTruthy();
    });
  });

  it('shows progress data (completed/planned)', async () => {
    const { getByText } = render(<ProductionScreen />, { wrapper });

    await waitFor(() => {
      // WO-001: 60/100
      expect(getByText(/60.*\/.*100/)).toBeTruthy();
    });
  });

  it('fetches work orders from API', async () => {
    render(<ProductionScreen />, { wrapper });

    await waitFor(() => {
      const firstCall = mockGet.mock.calls[0][0];
      expect(firstCall).toContain('/production/work-orders');
    });
  });

  it('filters by status when chip pressed', async () => {
    const { getByText, getAllByText } = render(<ProductionScreen />, { wrapper });

    await waitFor(() => expect(getByText('WO-001')).toBeTruthy());

    mockGet.mockClear();
    const dangSXElements = getAllByText('Đang SX');
    fireEvent.press(dangSXElements[0]);

    await waitFor(() => {
      const calls = mockGet.mock.calls;
      const filterCall = calls.find(
        (c: unknown[]) => c[1] && (c[1] as Record<string, string>).status === 'in_progress',
      );
      expect(filterCall).toBeTruthy();
    });
  });

  it('navigates to detail on card press', async () => {
    const { getByText } = render(<ProductionScreen />, { wrapper });

    await waitFor(() => expect(getByText('WO-001')).toBeTruthy());

    fireEvent.press(getByText('WO-001'));

    expect(router.push).toHaveBeenCalledWith('/work-order/wo1');
  });

  it('shows empty state when no data', async () => {
    mockGet.mockResolvedValue({ data: [], pagination: { total: 0 } });

    const { getByText } = render(<ProductionScreen />, { wrapper });

    await waitFor(() => {
      expect(getByText('Chưa có lệnh sản xuất')).toBeTruthy();
    });
  });
});
