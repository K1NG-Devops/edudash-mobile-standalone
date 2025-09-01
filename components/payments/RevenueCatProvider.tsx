import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { configureRevenueCat } from '@/lib/services/revenuecat';
import { useAuth } from '@/contexts/SimpleWorkingAuth';

export default function RevenueCatProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  useEffect(() => {
    // On web or in Expo Go, the billing SDK is unavailable; the configure function will no-op
    const extras: any = Constants.expoConfig?.extra || {};
    const iosKey = extras?.revenuecat?.iosSdkKey ?? null;
    const androidKey = extras?.revenuecat?.androidSdkKey ?? null;
    // Use Supabase user id if present to unify across devices
    configureRevenueCat({ iosKey, androidKey, appUserId: user?.id ?? null });
  }, [user?.id]);

  return <>{children}</>;
}

