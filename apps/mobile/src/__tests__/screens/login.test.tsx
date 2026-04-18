import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { router } from 'expo-router';

// Must mock api and auth-store before importing LoginScreen
const mockPost = jest.fn();
jest.mock('@/lib/api', () => ({
  api: { post: (...args: unknown[]) => mockPost(...args) },
  ApiError: class ApiError extends Error {
    status: number;
    constructor(status: number, message: string) {
      super(message);
      this.status = status;
    }
  },
}));

const mockSetAuth = jest.fn();
jest.mock('@/lib/auth-store', () => ({
  useAuthStore: Object.assign(jest.fn(() => ({ setAuth: mockSetAuth })), {
    getState: jest.fn(() => ({
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      logout: jest.fn(),
    })),
    setState: jest.fn(),
    subscribe: jest.fn(),
  }),
}));

const mockSetApiUrl = jest.fn();
jest.mock('@/lib/storage', () => ({
  setApiUrl: (...args: unknown[]) => mockSetApiUrl(...args),
  getApiUrl: jest.fn(async () => 'http://localhost:3100'),
  getAccessToken: jest.fn(async () => null),
}));

import LoginScreen from '../../../app/login';

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(Alert, 'alert').mockImplementation(() => {});
});

describe('LoginScreen', () => {
  it('renders login form fields', () => {
    const { getByPlaceholderText, getByText } = render(<LoginScreen />);

    expect(getByPlaceholderText(/Server URL/)).toBeTruthy();
    expect(getByPlaceholderText('Email')).toBeTruthy();
    expect(getByPlaceholderText('Mật khẩu')).toBeTruthy();
    expect(getByText('Đăng nhập')).toBeTruthy();
    expect(getByText('NKC ERP')).toBeTruthy();
  });

  it('shows alert when email is empty', () => {
    const { getByText } = render(<LoginScreen />);

    fireEvent.press(getByText('Đăng nhập'));

    expect(Alert.alert).toHaveBeenCalledWith('Lỗi', 'Vui lòng nhập email và mật khẩu');
    expect(mockPost).not.toHaveBeenCalled();
  });

  it('shows alert when password is empty', () => {
    const { getByText, getByPlaceholderText } = render(<LoginScreen />);

    fireEvent.changeText(getByPlaceholderText('Email'), 'admin@nkc.com');
    fireEvent.press(getByText('Đăng nhập'));

    expect(Alert.alert).toHaveBeenCalledWith('Lỗi', 'Vui lòng nhập email và mật khẩu');
  });

  it('calls api.post with credentials on submit', async () => {
    mockPost.mockResolvedValue({
      accessToken: 'tok_1',
      refreshToken: 'ref_1',
      expiresIn: 900,
      user: { id: 'u1', email: 'admin@nkc.com', fullName: 'Admin', tenantId: 't1', roles: ['admin'], permissions: [] },
    });

    const { getByText, getByPlaceholderText } = render(<LoginScreen />);

    fireEvent.changeText(getByPlaceholderText('Email'), 'admin@nkc.com');
    fireEvent.changeText(getByPlaceholderText('Mật khẩu'), 'admin123');
    fireEvent.press(getByText('Đăng nhập'));

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith('/auth/login', {
        email: 'admin@nkc.com',
        password: 'admin123',
      });
    });

    expect(mockSetAuth).toHaveBeenCalled();
    expect(router.replace).toHaveBeenCalledWith('/(tabs)');
  });

  it('saves custom server URL before login', async () => {
    mockPost.mockResolvedValue({
      accessToken: 'tok', refreshToken: 'ref', expiresIn: 900,
      user: { id: 'u1', email: 'x@y.com', fullName: 'X', tenantId: 't1', roles: [], permissions: [] },
    });

    const { getByText, getByPlaceholderText } = render(<LoginScreen />);

    fireEvent.changeText(getByPlaceholderText(/Server URL/), 'https://erp.nkc.com/');
    fireEvent.changeText(getByPlaceholderText('Email'), 'x@y.com');
    fireEvent.changeText(getByPlaceholderText('Mật khẩu'), 'pass');
    fireEvent.press(getByText('Đăng nhập'));

    await waitFor(() => {
      expect(mockSetApiUrl).toHaveBeenCalledWith('https://erp.nkc.com');
    });
  });

  it('shows error alert on API failure', async () => {
    const { ApiError } = require('@/lib/api');
    mockPost.mockRejectedValue(new ApiError(401, 'Invalid credentials'));

    const { getByText, getByPlaceholderText } = render(<LoginScreen />);

    fireEvent.changeText(getByPlaceholderText('Email'), 'bad@nkc.com');
    fireEvent.changeText(getByPlaceholderText('Mật khẩu'), 'wrong');
    fireEvent.press(getByText('Đăng nhập'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Đăng nhập thất bại', 'Invalid credentials');
    });
  });

  it('shows generic error on network failure', async () => {
    mockPost.mockRejectedValue(new TypeError('Network error'));

    const { getByText, getByPlaceholderText } = render(<LoginScreen />);

    fireEvent.changeText(getByPlaceholderText('Email'), 'admin@nkc.com');
    fireEvent.changeText(getByPlaceholderText('Mật khẩu'), 'pass');
    fireEvent.press(getByText('Đăng nhập'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Đăng nhập thất bại', 'Không thể kết nối đến server');
    });
  });
});
