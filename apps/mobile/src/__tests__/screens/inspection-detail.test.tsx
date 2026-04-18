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

import InspectionDetailScreen from '../../../app/inspection/[id]';

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

const mockInspection = {
  id: 'insp1',
  inspection_no: 'INS-2024-001',
  ref_type: 'production_step',
  result: 'pending',
  inspected_qty: 0,
  passed_qty: 0,
  failed_qty: 0,
  notes: null,
  inspected_at: null,
  qc_plans: {
    plan_name: 'Kiểm tra bề mặt gỗ',
    qc_checklist_items: [
      { id: 'cl1', check_point: 'Không nứt', method: 'Quan sát', accept_criteria: 'Không có vết nứt > 1mm', seq: 1 },
      { id: 'cl2', check_point: 'Độ phẳng', method: 'Thước đo', accept_criteria: 'Sai lệch < 0.5mm', seq: 2 },
    ],
  },
  qc_defects: [
    { id: 'd1', defect_type: 'Xước bề mặt', description: 'Vết xước dài 3cm', qty: 2, severity: 'minor', created_at: '2024-01-01' },
    { id: 'd2', defect_type: 'Cong vênh', description: null, qty: 1, severity: 'major', created_at: '2024-01-01' },
  ],
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  (useLocalSearchParams as jest.Mock).mockReturnValue({ id: 'insp1' });
  mockGet.mockResolvedValue(mockInspection);
});

describe('InspectionDetailScreen', () => {
  it('renders inspection header', async () => {
    const { getByText } = render(<InspectionDetailScreen />, { wrapper });

    await waitFor(() => {
      expect(getByText('INS-2024-001')).toBeTruthy();
      expect(getByText('Kiểm tra bề mặt gỗ')).toBeTruthy();
    });
  });

  it('shows quantity stats', async () => {
    const { getAllByText, getByText } = render(<InspectionDetailScreen />, { wrapper });

    await waitFor(() => {
      expect(getByText('Đạt')).toBeTruthy();
      expect(getByText('Không đạt')).toBeTruthy();
      expect(getByText('Tổng KT')).toBeTruthy();
    });
  });

  it('shows result status', async () => {
    const { getByText } = render(<InspectionDetailScreen />, { wrapper });

    await waitFor(() => {
      expect(getByText(/Kết quả:.*Chờ kiểm tra/)).toBeTruthy();
    });
  });

  it('renders checklist items', async () => {
    const { getByText } = render(<InspectionDetailScreen />, { wrapper });

    await waitFor(() => {
      expect(getByText('Checklist kiểm tra')).toBeTruthy();
      expect(getByText('Không nứt')).toBeTruthy();
      expect(getByText('Độ phẳng')).toBeTruthy();
    });
  });

  it('shows acceptance criteria', async () => {
    const { getByText } = render(<InspectionDetailScreen />, { wrapper });

    await waitFor(() => {
      expect(getByText(/Không có vết nứt > 1mm/)).toBeTruthy();
      expect(getByText(/Sai lệch < 0.5mm/)).toBeTruthy();
    });
  });

  it('shows checklist methods', async () => {
    const { getByText } = render(<InspectionDetailScreen />, { wrapper });

    await waitFor(() => {
      expect(getByText(/Quan sát/)).toBeTruthy();
      expect(getByText(/Thước đo/)).toBeTruthy();
    });
  });

  it('displays existing defects', async () => {
    const { getByText } = render(<InspectionDetailScreen />, { wrapper });

    await waitFor(() => {
      expect(getByText('Xước bề mặt')).toBeTruthy();
      expect(getByText('Cong vênh')).toBeTruthy();
      expect(getByText('Vết xước dài 3cm')).toBeTruthy();
    });
  });

  it('shows defect severity and count', async () => {
    const { getByText } = render(<InspectionDetailScreen />, { wrapper });

    await waitFor(() => {
      expect(getByText(/MINOR.*×.*2/)).toBeTruthy();
      expect(getByText(/MAJOR.*×.*1/)).toBeTruthy();
    });
  });

  it('shows defect count in section title', async () => {
    const { getByText } = render(<InspectionDetailScreen />, { wrapper });

    await waitFor(() => {
      expect(getByText('Lỗi phát hiện (2)')).toBeTruthy();
    });
  });

  it('shows "Nhập kết quả kiểm tra" button for pending inspections', async () => {
    const { getByText } = render(<InspectionDetailScreen />, { wrapper });

    await waitFor(() => {
      expect(getByText('Nhập kết quả kiểm tra')).toBeTruthy();
    });
  });

  it('shows "Ghi nhận lỗi" button', async () => {
    const { getByText } = render(<InspectionDetailScreen />, { wrapper });

    await waitFor(() => {
      expect(getByText('+ Ghi nhận lỗi')).toBeTruthy();
    });
  });

  it('expands update result form on button press', async () => {
    const { getByText, getByPlaceholderText } = render(<InspectionDetailScreen />, { wrapper });

    await waitFor(() => expect(getByText('Nhập kết quả kiểm tra')).toBeTruthy());

    fireEvent.press(getByText('Nhập kết quả kiểm tra'));

    await waitFor(() => {
      expect(getByText('SL đạt')).toBeTruthy();
      expect(getByText('SL không đạt')).toBeTruthy();
      expect(getByText('Lưu kết quả')).toBeTruthy();
    });
  });

  it('expands defect form on button press', async () => {
    const { getByText } = render(<InspectionDetailScreen />, { wrapper });

    await waitFor(() => expect(getByText('+ Ghi nhận lỗi')).toBeTruthy());

    fireEvent.press(getByText('+ Ghi nhận lỗi'));

    await waitFor(() => {
      expect(getByText('Ghi nhận lỗi mới')).toBeTruthy();
      expect(getByText('Loại lỗi *')).toBeTruthy();
      expect(getByText('Mức độ')).toBeTruthy();
      expect(getByText('Ghi nhận')).toBeTruthy();
    });
  });

  it('validates defect type required', async () => {
    const { getByText } = render(<InspectionDetailScreen />, { wrapper });

    await waitFor(() => expect(getByText('+ Ghi nhận lỗi')).toBeTruthy());
    fireEvent.press(getByText('+ Ghi nhận lỗi'));
    await waitFor(() => expect(getByText('Ghi nhận')).toBeTruthy());

    fireEvent.press(getByText('Ghi nhận'));

    expect(Alert.alert).toHaveBeenCalledWith('Lỗi', 'Nhập loại lỗi');
    expect(mockPost).not.toHaveBeenCalled();
  });

  it('submits defect correctly', async () => {
    mockPost.mockResolvedValue({ id: 'd3' });

    const { getByText, getByPlaceholderText } = render(<InspectionDetailScreen />, { wrapper });

    await waitFor(() => expect(getByText('+ Ghi nhận lỗi')).toBeTruthy());
    fireEvent.press(getByText('+ Ghi nhận lỗi'));

    await waitFor(() => expect(getByPlaceholderText('VD: Xước bề mặt')).toBeTruthy());

    fireEvent.changeText(getByPlaceholderText('VD: Xước bề mặt'), 'Nứt cạnh');
    fireEvent.changeText(getByPlaceholderText('1'), '3');
    fireEvent.press(getByText('Ghi nhận'));

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith('/quality/inspections/insp1/defects', {
        defectType: 'Nứt cạnh',
        qty: 3,
        severity: 'minor',
        description: undefined,
      });
    });
  });

  it('does not show update form for non-pending inspections', async () => {
    mockGet.mockResolvedValue({ ...mockInspection, result: 'passed' });

    const { queryByText } = render(<InspectionDetailScreen />, { wrapper });

    await waitFor(() => {
      expect(queryByText('Nhập kết quả kiểm tra')).toBeNull();
    });
  });

  it('fetches inspection by id', async () => {
    render(<InspectionDetailScreen />, { wrapper });

    await waitFor(() => {
      expect(mockGet).toHaveBeenCalledWith('/quality/inspections/insp1');
    });
  });

  it('shows not found for missing inspection', async () => {
    mockGet.mockResolvedValue(null);

    const { getByText } = render(<InspectionDetailScreen />, { wrapper });

    await waitFor(() => {
      expect(getByText('Không tìm thấy phiếu')).toBeTruthy();
    });
  });
});
