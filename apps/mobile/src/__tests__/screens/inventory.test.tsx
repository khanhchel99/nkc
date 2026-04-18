import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

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

import InventoryScreen from '../../../app/(tabs)/inventory';

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

const mockStockData = {
  data: [
    {
      id: 'sb1',
      item_id: 'it1',
      warehouse_id: 'wh1',
      bin_location: 'A-01-01',
      qty_on_hand: 100,
      qty_reserved: 20,
      qty_available: 80,
      items: { item_code: 'VT-001', item_name: 'Gỗ sồi 20mm', uom: 'tấm' },
      warehouses: { wh_code: 'WH1', wh_name: 'Kho nguyên liệu' },
    },
    {
      id: 'sb2',
      item_id: 'it2',
      warehouse_id: 'wh1',
      bin_location: null,
      qty_on_hand: 0,
      qty_reserved: 0,
      qty_available: 0,
      items: { item_code: 'VT-002', item_name: 'Keo dán AB', uom: 'kg' },
      warehouses: { wh_code: 'WH1', wh_name: 'Kho nguyên liệu' },
    },
  ],
  pagination: { total: 2, page: 1, limit: 50, totalPages: 1 },
};

beforeEach(() => {
  jest.clearAllMocks();
  mockGet.mockResolvedValue(mockStockData);
});

describe('InventoryScreen', () => {
  it('renders search input', async () => {
    const { getByPlaceholderText } = render(<InventoryScreen />, { wrapper });

    await waitFor(() => {
      expect(getByPlaceholderText('Tìm vật tư, mã SP...')).toBeTruthy();
    });
  });

  it('displays stock items', async () => {
    const { getByText } = render(<InventoryScreen />, { wrapper });

    await waitFor(() => {
      expect(getByText('Gỗ sồi 20mm')).toBeTruthy();
      expect(getByText('VT-001')).toBeTruthy();
      expect(getByText('Keo dán AB')).toBeTruthy();
      expect(getByText('VT-002')).toBeTruthy();
    });
  });

  it('shows available quantity', async () => {
    const { getByText } = render(<InventoryScreen />, { wrapper });

    await waitFor(() => {
      expect(getByText('80 tấm')).toBeTruthy();
      expect(getByText('0 kg')).toBeTruthy();
    });
  });

  it('shows warehouse name', async () => {
    const { getAllByText } = render(<InventoryScreen />, { wrapper });

    await waitFor(() => {
      expect(getAllByText('Kho nguyên liệu').length).toBeGreaterThan(0);
    });
  });

  it('shows bin location when available', async () => {
    const { getByText } = render(<InventoryScreen />, { wrapper });

    await waitFor(() => {
      expect(getByText('A-01-01')).toBeTruthy();
    });
  });

  it('shows on-hand and reserved stats', async () => {
    const { getAllByText } = render(<InventoryScreen />, { wrapper });

    await waitFor(() => {
      expect(getAllByText('Tồn kho').length).toBeGreaterThan(0);
      expect(getAllByText('Đã giữ').length).toBeGreaterThan(0);
      expect(getAllByText('Khả dụng').length).toBeGreaterThan(0);
    });
  });

  it('shows item count from pagination', async () => {
    const { getByText } = render(<InventoryScreen />, { wrapper });

    await waitFor(() => {
      expect(getByText('2 mục')).toBeTruthy();
    });
  });

  it('fetches stock balances from API', async () => {
    render(<InventoryScreen />, { wrapper });

    await waitFor(() => {
      expect(mockGet).toHaveBeenCalled();
      const path = mockGet.mock.calls[0][0];
      expect(path).toContain('/inventory/stock-balances');
    });
  });

  it('shows empty state when no data', async () => {
    mockGet.mockResolvedValue({ data: [], pagination: { total: 0, page: 1, limit: 50, totalPages: 0 } });

    const { getByText } = render(<InventoryScreen />, { wrapper });

    await waitFor(() => {
      expect(getByText('Không có dữ liệu tồn kho')).toBeTruthy();
    });
  });
});
