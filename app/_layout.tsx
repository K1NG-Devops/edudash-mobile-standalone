import { AuthErrorBoundary } from '@/components/auth/AuthErrorBoundary';
import { AuthProvider } from '@/contexts/SimpleWorkingAuth';
import * as Notifications from 'expo-notifications';
import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { Platform } from 'react-native';

export default function RootLayout() {
  useEffect(() => {
    const register = async () => {
      try {
        // Ask for permissions on mobile devices
        if (Platform.OS !== 'web') {
          const { status } = await Notifications.requestPermissionsAsync();
          if (status !== 'granted') return;
          // Configure Android channel (required for notifications)
          if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('default', {
              name: 'default',
              importance: Notifications.AndroidImportance.DEFAULT,
            });
          }
          // Get FCM device token (requires google-services.json in android/app)
          await Notifications.getExpoPushTokenAsync();
        }
      } catch {
        // best-effort; non-fatal
      }
    };
    register();
  }, []);
  return (
    <AuthErrorBoundary>
      <AuthProvider>
        <Stack>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="screens" options={{ headerShown: false }} />
          <Stack.Screen name="+not-found" />
        </Stack>
      </AuthProvider>
    </AuthErrorBoundary>
  );
}
