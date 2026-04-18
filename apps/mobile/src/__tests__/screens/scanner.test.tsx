import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
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

import ScannerScreen from '../../../app/scanner';

beforeEach(() => {
  jest.clearAllMocks();
});

describe('ScannerScreen', () => {
  it('renders without crashing', () => {
    // Scanner uses native camera which is mocked
    const { toJSON } = render(<ScannerScreen />);
    expect(toJSON()).toBeTruthy();
  });

  it('renders scan instruction text', () => {
    const { getByText } = render(<ScannerScreen />);
    expect(getByText('Hướng camera vào mã vạch lệnh sản xuất')).toBeTruthy();
  });
});
