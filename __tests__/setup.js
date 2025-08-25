// Jest native matchers are now built-in to @testing-library/react-native v12.4+
import 'react-native-gesture-handler/jestSetup';

// Mock expo-font
jest.mock('expo-font', () => ({
  loadAsync: jest.fn(),
  isLoaded: jest.fn(() => true),
}));

// Mock expo-asset
jest.mock('expo-asset', () => ({
  Asset: {
    loadAsync: jest.fn(),
    fromModule: jest.fn(() => ({ downloadAsync: jest.fn() })),
  },
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

// Mock react-native-svg
jest.mock('react-native-svg', () => 'SvgComponent');

// Mock expo-linear-gradient
jest.mock('expo-linear-gradient', () => ({
  LinearGradient: 'LinearGradient',
}));

// Ensure React Native Share & Alert APIs are present for tests (without mocking entire module)
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const RN = require('react-native');
  const LibShare = require('react-native/Libraries/Share/Share');
  const LibAlert = require('react-native/Libraries/Alert/Alert');
  // Ensure library mocks exist
  if (!LibShare.share) {
    LibShare.share = jest.fn(async () => ({ action: 'sharedAction' }));
  }
  if (!LibAlert.alert) {
    LibAlert.alert = jest.fn();
  }
  // Point RN exports to library mocks so component and tests share the same objects
  RN.Share = LibShare;
  RN.Alert = LibAlert;
} catch (_) { /* ignore */ }

// Provide window.confirm stub for jsdom (override unconditionally)
if (typeof window !== 'undefined') {
  // @ts-ignore
  window.confirm = jest.fn(() => true);
}

// Mock expo-clipboard
jest.mock('expo-clipboard', () => ({
  setStringAsync: jest.fn(async () => true),
}));

// Mock Haptics
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  selectionAsync: jest.fn(),
  notificationAsync: jest.fn(),
}));

// Mock expo-blur
jest.mock('expo-blur', () => ({
  BlurView: 'BlurView',
}));

// Mock expo-notifications
jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  scheduleNotificationAsync: jest.fn(),
  setNotificationHandler: jest.fn(),
}));

// Mock crypto for React Native
global.crypto = {
  randomUUID: () => 'test-uuid-' + Math.random().toString(36).substr(2, 9),
  getRandomValues: (array) => {
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
    return array;
  }
};

// Mock console methods to avoid noise in tests
global.console = {
  ...console,
  warn: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  error: jest.fn(),
};
