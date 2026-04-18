import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';

const mockLogout = jest.fn();
const mockReplace = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: jest.fn(() => ({ replace: mockReplace })),
  router: { replace: mockReplace },
}));

jest.mock('@/lib/auth-store', () => ({
  useAuthStore: jest.fn(() => ({
    user: {
      id: 'u1',
      email: 'admin@nkc.com',
      fullName: 'Nguyễn Quản Trị',
      tenantId: 'tenant-01',
      roles: ['admin', 'planner'],
      permissions: ['read', 'write', 'delete'],
    },
    logout: mockLogout,
  })),
}));

import AccountScreen from '../../../app/(tabs)/account';

beforeEach(() => {
  jest.clearAllMocks();
  mockLogout.mockResolvedValue(undefined);
  jest.spyOn(Alert, 'alert').mockImplementation(() => {});
});

describe('AccountScreen', () => {
  it('renders user profile info', () => {
    const { getByText } = render(<AccountScreen />);

    expect(getByText('Nguyễn Quản Trị')).toBeTruthy();
    expect(getByText('admin@nkc.com')).toBeTruthy();
  });

  it('displays user roles as badges', () => {
    const { getByText } = render(<AccountScreen />);

    expect(getByText('admin')).toBeTruthy();
    expect(getByText('planner')).toBeTruthy();
  });

  it('shows tenant ID', () => {
    const { getByText } = render(<AccountScreen />);

    expect(getByText('tenant-01')).toBeTruthy();
  });

  it('shows permissions count', () => {
    const { getByText } = render(<AccountScreen />);

    expect(getByText('3 quyền')).toBeTruthy();
  });

  it('renders logout button', () => {
    const { getByText } = render(<AccountScreen />);

    expect(getByText('Đăng xuất')).toBeTruthy();
  });

  it('shows confirmation dialog on logout press', () => {
    const { getByText } = render(<AccountScreen />);

    fireEvent.press(getByText('Đăng xuất'));

    expect(Alert.alert).toHaveBeenCalledWith(
      'Đăng xuất',
      'Bạn có chắc muốn đăng xuất?',
      expect.arrayContaining([
        expect.objectContaining({ text: 'Hủy', style: 'cancel' }),
        expect.objectContaining({ text: 'Đăng xuất', style: 'destructive' }),
      ]),
    );
  });

  it('calls logout and navigates to login on confirm', async () => {
    const { getByText } = render(<AccountScreen />);

    fireEvent.press(getByText('Đăng xuất'));

    // Simulate destructive button press
    const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
    const buttons = alertCall[2];
    const destructiveBtn = buttons.find((b: any) => b.style === 'destructive');
    await destructiveBtn.onPress();

    expect(mockLogout).toHaveBeenCalled();
    expect(mockReplace).toHaveBeenCalledWith('/login');
  });

  it('handles user with no roles gracefully', () => {
    const { useAuthStore } = require('@/lib/auth-store');
    useAuthStore.mockReturnValue({
      user: {
        id: 'u2',
        email: 'worker@nkc.com',
        fullName: 'Công nhân',
        tenantId: 't1',
        roles: [],
        permissions: [],
      },
      logout: mockLogout,
    });

    const { getByText, queryByText } = render(<AccountScreen />);

    expect(getByText('Công nhân')).toBeTruthy();
    expect(getByText('worker@nkc.com')).toBeTruthy();
    expect(getByText('0 quyền')).toBeTruthy();
    // No role badges
    expect(queryByText('admin')).toBeNull();
  });

  it('handles null user gracefully', () => {
    const { useAuthStore } = require('@/lib/auth-store');
    useAuthStore.mockReturnValue({ user: null, logout: mockLogout });

    const { getByText } = render(<AccountScreen />);

    expect(getByText('Người dùng')).toBeTruthy();
  });
});
