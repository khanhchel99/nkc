import * as SecureStore from 'expo-secure-store';
import {
  getAccessToken,
  setAccessToken,
  getRefreshToken,
  setRefreshToken,
  getUser,
  setUser,
  getApiUrl,
  setApiUrl,
  clearAll,
} from '../storage';

const mockStore = SecureStore as jest.Mocked<typeof SecureStore> & {
  __store: Record<string, string>;
  __reset: () => void;
};

beforeEach(() => {
  mockStore.__reset();
  jest.clearAllMocks();
});

describe('storage', () => {
  describe('access token', () => {
    it('returns null when no token stored', async () => {
      expect(await getAccessToken()).toBeNull();
    });

    it('stores and retrieves an access token', async () => {
      await setAccessToken('tok_abc');
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith('nkc_access_token', 'tok_abc');
      expect(await getAccessToken()).toBe('tok_abc');
    });
  });

  describe('refresh token', () => {
    it('returns null when no token stored', async () => {
      expect(await getRefreshToken()).toBeNull();
    });

    it('stores and retrieves a refresh token', async () => {
      await setRefreshToken('ref_xyz');
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith('nkc_refresh_token', 'ref_xyz');
      expect(await getRefreshToken()).toBe('ref_xyz');
    });
  });

  describe('user', () => {
    it('returns null when no user stored', async () => {
      expect(await getUser()).toBeNull();
    });

    it('stores and retrieves user as JSON', async () => {
      const user = { id: '1', email: 'test@nkc.com', fullName: 'Test' };
      await setUser(user);
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith('nkc_user', JSON.stringify(user));
      const retrieved = await getUser();
      expect(retrieved).toEqual(user);
    });
  });

  describe('apiUrl', () => {
    it('returns default localhost when not set', async () => {
      expect(await getApiUrl()).toBe('http://localhost:3100');
    });

    it('stores and retrieves custom API URL', async () => {
      await setApiUrl('https://erp.nkc.com');
      expect(await getApiUrl()).toBe('https://erp.nkc.com');
    });
  });

  describe('clearAll', () => {
    it('deletes all stored keys', async () => {
      await setAccessToken('tok_1');
      await setRefreshToken('ref_1');
      await setUser({ id: '1' });
      await setApiUrl('https://example.com');

      await clearAll();

      expect(SecureStore.deleteItemAsync).toHaveBeenCalledTimes(4);
      expect(await getAccessToken()).toBeNull();
      expect(await getRefreshToken()).toBeNull();
      expect(await getUser()).toBeNull();
      // apiUrl returns default after clear
      expect(await getApiUrl()).toBe('http://localhost:3100');
    });
  });
});
