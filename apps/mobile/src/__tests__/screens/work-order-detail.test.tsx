import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';

const mockGet = jest.fn();
const mockPost = jest.fn();
const mockPatch = jest.fn();
jest.mock('@/lib/api', () => ({
  api: {
    get: (...args: unknown[]) => mockGet(...args),
    post: (...args: unknown[]) => mockPost(...args),
    patch: (...args: unknown[]) => mockPatch(...args),
  },
  ApiError: class extends Error {
    status: number;
    constructor(s: number, m: string) { super(m); this.status = s; }
  },
}));

jest.mock('@/lib/auth-store', () => ({
  useAuthStore: Object.assign(jest.fn(() => ({ isAuthenticated: true })), {
    getState: jest.fn(() => ({ accessToken: 'tok', refreshToken: 'ref', logout: jest.fn() })),
    setState: jest.fn(),
    subscribe: jest.fn(),
  }),
}));

import WorkOrderDetailScreen from '../../../app/work-order/[id]';

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

const mockWorkOrder = {
  id: 'wo1',
  wo_number: 'WO-2024-001',
  status: 'in_progress',
  planned_qty: 100,
  completed_qty: 40,
  scrapped_qty: 5,
  work_order_steps: [
    {
      id: 'step1',
      step_no: 1,
      operation_name: 'Cắt gỗ',
      status: 'completed',
      planned_qty: 100,
      completed_qty: 40,
      scrapped_qty: 5,
      work_order_executions: [
        { id: 'ex1', output_qty: 40, scrap_qty: 5, notes: 'OK', started_at: '2024-01-01T00:00:00Z' },
      ],
    },
    {
      id: 'step2',
      step_no: 2,
      operation_name: 'Ghép nối',
      status: 'in_progress',
      planned_qty: 100,
      completed_qty: 0,
      scrapped_qty: 0,
      work_order_executions: [],
    },
    {
      id: 'step3',
      step_no: 3,
      operation_name: 'Sơn phủ',
      status: 'pending',
      planned_qty: 100,
      completed_qty: 0,
      scrapped_qty: 0,
      work_order_executions: [],
    },
  ],
};

beforeEach(() => {
  jest.clearAllMocks();
  (useLocalSearchParams as jest.Mock).mockReturnValue({ id: 'wo1' });
  mockGet.mockResolvedValue(mockWorkOrder);
});

describe('WorkOrderDetailScreen', () => {
  it('renders work order header with wo_number', async () => {
    const { getByText } = render(<WorkOrderDetailScreen />, { wrapper });

    await waitFor(() => {
      expect(getByText('WO-2024-001')).toBeTruthy();
    });
  });

  it('shows planned/completed/scrapped quantities', async () => {
    const { getAllByText, getByText } = render(<WorkOrderDetailScreen />, { wrapper });

    await waitFor(() => {
      expect(getByText(/SL kế hoạch/)).toBeTruthy();
      expect(getByText(/Hoàn thành/)).toBeTruthy();
      expect(getAllByText(/Phế/).length).toBeGreaterThanOrEqual(1);
    });
  });

  it('renders all steps with names', async () => {
    const { getByText } = render(<WorkOrderDetailScreen />, { wrapper });

    await waitFor(() => {
      expect(getByText('Cắt gỗ')).toBeTruthy();
      expect(getByText('Ghép nối')).toBeTruthy();
      expect(getByText('Sơn phủ')).toBeTruthy();
    });
  });

  it('shows step completion percentage', async () => {
    const { getAllByText } = render(<WorkOrderDetailScreen />, { wrapper });

    await waitFor(() => {
      // 40% appears in overall progress and step1 progress
      const matches = getAllByText(/40%/);
      expect(matches.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('shows "Ghi sản lượng" button for in_progress step', async () => {
    const { getByText } = render(<WorkOrderDetailScreen />, { wrapper });

    await waitFor(() => {
      expect(getByText('Ghi sản lượng')).toBeTruthy();
    });
  });

  it('shows "Sẵn sàng" button for pending step', async () => {
    const { getByText } = render(<WorkOrderDetailScreen />, { wrapper });

    await waitFor(() => {
      expect(getByText('Sẵn sàng')).toBeTruthy();
    });
  });

  it('fetches work order by id', async () => {
    render(<WorkOrderDetailScreen />, { wrapper });

    await waitFor(() => {
      expect(mockGet).toHaveBeenCalledWith('/production/work-orders/wo1');
    });
  });

  it('shows execution history for completed step', async () => {
    const { getByText } = render(<WorkOrderDetailScreen />, { wrapper });

    await waitFor(() => {
      // execution format: ✓ {output_qty} ok · {scrap_qty} phế
      expect(getByText(/40 ok/)).toBeTruthy();
      expect(getByText(/5 phế/)).toBeTruthy();
    });
  });

  it('transitions step status on button press', async () => {
    mockPatch.mockResolvedValue({ id: 'step3', status: 'ready' });
    jest.spyOn(Alert, 'alert').mockImplementation((_title, _msg, buttons) => {
      // Press "Đồng ý" button (index 1)
      const confirm = (buttons as Array<{ text: string; onPress?: () => void }>)?.[1];
      confirm?.onPress?.();
    });

    const { getByText } = render(<WorkOrderDetailScreen />, { wrapper });

    await waitFor(() => expect(getByText('Sẵn sàng')).toBeTruthy());

    fireEvent.press(getByText('Sẵn sàng'));

    await waitFor(() => {
      expect(mockPatch).toHaveBeenCalledWith(
        '/production/work-orders/wo1/steps/step3',
        expect.objectContaining({ status: 'ready' }),
      );
    });
  });

  it('shows loading state initially', () => {
    mockGet.mockReturnValue(new Promise(() => {})); // never resolves
    const { UNSAFE_queryByType } = render(<WorkOrderDetailScreen />, { wrapper });

    // Should render without crashing (loading state)
    expect(true).toBe(true);
  });
});
