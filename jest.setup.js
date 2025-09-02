/* eslint-env jest */
/* eslint-disable import/no-unresolved, no-undef */
import '@testing-library/jest-native/extend-expect';

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
    })),
    auth: {
      getUser: jest.fn(),
      signOut: jest.fn(),
    },
  },
}));

// Mock OneSignal
jest.mock('react-native-onesignal', () => ({
  default: {
    setAppId: jest.fn(),
    promptForPushNotificationsWithUserResponse: jest.fn(),
    setExternalUserId: jest.fn(),
    setNotificationWillShowInForegroundHandler: jest.fn(),
    setNotificationOpenedHandler: jest.fn(),
  },
}));

// Mock PostHog
jest.mock('posthog-react-native', () => ({
  default: jest.fn().mockImplementation(() => ({
    identify: jest.fn(),
    capture: jest.fn(),
    reset: jest.fn(),
  })),
}));

// Mock React Navigation
jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    useNavigation: () => ({
      navigate: jest.fn(),
      goBack: jest.fn(),
    }),
    useRoute: () => ({
      params: {},
    }),
  };
});

// Mock Expo modules
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: {
    Light: 'Light',
    Medium: 'Medium',
    Heavy: 'Heavy',
  },
}));

jest.mock('expo-linking', () => ({
  openURL: jest.fn(),
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock Platform
jest.mock('react-native/Libraries/Utilities/Platform', () => ({
  OS: 'ios',
  select: jest.fn((obj) => obj.ios),
}));

// Silence console warnings in tests
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
};
