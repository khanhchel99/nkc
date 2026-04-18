/* Global mocks for React Native testing */

// Mock expo-secure-store
jest.mock('expo-secure-store', () => {
  const store: Record<string, string> = {};
  return {
    getItemAsync: jest.fn(async (key: string) => store[key] || null),
    setItemAsync: jest.fn(async (key: string, value: string) => {
      store[key] = value;
    }),
    deleteItemAsync: jest.fn(async (key: string) => {
      delete store[key];
    }),
    __store: store,
    __reset: () => {
      Object.keys(store).forEach((k) => delete store[k]);
    },
  };
});

// Mock expo-camera
jest.mock('expo-camera', () => ({
  CameraView: 'CameraView',
  useCameraPermissions: jest.fn(() => [{ granted: true }, jest.fn()]),
}));

// Mock expo-router
jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  },
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  })),
  useLocalSearchParams: jest.fn(() => ({})),
  useSegments: jest.fn(() => []),
  Redirect: jest.fn(({ href }: { href: string }) => null),
  Stack: Object.assign(jest.fn(({ children }: any) => children), {
    Screen: jest.fn(() => null),
  }),
  Tabs: Object.assign(jest.fn(({ children }: any) => children), {
    Screen: jest.fn(() => null),
  }),
}));

// Mock @expo/vector-icons
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

// Mock react-native Alert (will be spied on in individual tests)
// Note: Alert.alert is already available from RN setup

// Silence console.warn in tests for expected RN warnings
const originalWarn = console.warn;
console.warn = (...args: unknown[]) => {
  if (typeof args[0] === 'string' && (args[0].includes('ReactNative') || args[0].includes('Animated'))) return;
  originalWarn(...args);
};
