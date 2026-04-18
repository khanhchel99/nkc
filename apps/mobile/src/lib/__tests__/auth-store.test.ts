import * as SecureStore from 'expo-secure-store';
import { useAuthStore, AuthUser } from '../auth-store';

const mockStore = SecureStore as jest.Mocked<typeof SecureStore> & {
  __store: Record<string, string>;
  __reset: () => void;
};

const testUser: AuthUser = {
  id: 'u1',
  email: 'test@nkc.com',
  fullName: 'Test User',
  tenantId: 't1',
  roles: ['admin'],
  permissions: ['read', 'write'],
};

beforeEach(() => {
  mockStore.__reset();
  jest.clearAllMocks();
  // Reset zustand store to initial state
  useAuthStore.setState({
    user: null,
    accessToken: null,
    refreshToken: null,
    isLoading: true,
    isAuthenticated: false,
  });
});

describe('auth-store', () => {
  describe('initial state', () => {
    it('starts unauthenticated and loading', () => {
      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(true);
      expect(state.user).toBeNull();
      expect(state.accessToken).toBeNull();
      expect(state.refreshToken).toBeNull();
    });
  });

  describe('hydrate', () => {
    it('hydrates from empty storage (no session)', async () => {
      await useAuthStore.getState().hydrate();

      const state = useAuthStore.getState();
      expect(state.isLoading).toBe(false);
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
    });

    it('hydrates an existing session from storage', async () => {
      // Pre-populate storage
      mockStore.__store['nkc_access_token'] = 'tok_123';
      mockStore.__store['nkc_refresh_token'] = 'ref_456';
      mockStore.__store['nkc_user'] = JSON.stringify(testUser);

      await useAuthStore.getState().hydrate();

      const state = useAuthStore.getState();
      expect(state.isLoading).toBe(false);
      expect(state.isAuthenticated).toBe(true);
      expect(state.accessToken).toBe('tok_123');
      expect(state.refreshToken).toBe('ref_456');
      expect(state.user).toEqual(testUser);
    });

    it('stays unauthenticated when only token exists (no user)', async () => {
      mockStore.__store['nkc_access_token'] = 'tok_123';

      await useAuthStore.getState().hydrate();

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
    });
  });

  describe('setAuth', () => {
    it('sets user, tokens and marks authenticated', async () => {
      await useAuthStore.getState().setAuth(testUser, 'tok_new', 'ref_new');

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.user).toEqual(testUser);
      expect(state.accessToken).toBe('tok_new');
      expect(state.refreshToken).toBe('ref_new');
    });

    it('persists to SecureStore', async () => {
      await useAuthStore.getState().setAuth(testUser, 'tok_a', 'ref_b');

      expect(SecureStore.setItemAsync).toHaveBeenCalledWith('nkc_user', JSON.stringify(testUser));
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith('nkc_access_token', 'tok_a');
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith('nkc_refresh_token', 'ref_b');
    });
  });

  describe('setTokens', () => {
    it('updates only tokens without changing user', async () => {
      await useAuthStore.getState().setAuth(testUser, 'tok_old', 'ref_old');
      await useAuthStore.getState().setTokens('tok_refreshed', 'ref_refreshed');

      const state = useAuthStore.getState();
      expect(state.accessToken).toBe('tok_refreshed');
      expect(state.refreshToken).toBe('ref_refreshed');
      expect(state.user).toEqual(testUser);
    });

    it('persists new tokens to SecureStore', async () => {
      await useAuthStore.getState().setTokens('tok_x', 'ref_y');

      expect(SecureStore.setItemAsync).toHaveBeenCalledWith('nkc_access_token', 'tok_x');
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith('nkc_refresh_token', 'ref_y');
    });
  });

  describe('logout', () => {
    it('clears state completely', async () => {
      await useAuthStore.getState().setAuth(testUser, 'tok_1', 'ref_1');
      await useAuthStore.getState().logout();

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
      expect(state.accessToken).toBeNull();
      expect(state.refreshToken).toBeNull();
    });

    it('clears SecureStore', async () => {
      await useAuthStore.getState().setAuth(testUser, 'tok_1', 'ref_1');
      jest.clearAllMocks();

      await useAuthStore.getState().logout();

      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('nkc_access_token');
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('nkc_refresh_token');
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('nkc_user');
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('nkc_api_url');
    });
  });
});
