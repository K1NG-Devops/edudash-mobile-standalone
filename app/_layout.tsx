import { AuthErrorBoundary } from '@/components/auth/AuthErrorBoundary';
import { AuthProvider } from '@/contexts/SimpleWorkingAuth';
import { ThemeProvider } from '@/contexts/ThemeContext';
import * as Notifications from 'expo-notifications';
import { Stack, usePathname } from 'expo-router';
import { useEffect } from 'react';
import { Platform, View, StyleSheet } from 'react-native';
import GlobalBottomNav from '@/components/navigation/GlobalBottomNav';

export default function RootLayout() {
  const pathname = usePathname();
  const hideBottomNav = pathname === '/' || pathname.startsWith('/(auth)');

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
        <ThemeProvider>
          <View style={styles.container}>
            <Stack>
              <Stack.Screen name="index" options={{ headerShown: false }} />
              <Stack.Screen name="(auth)" options={{ headerShown: false }} />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="screens" options={{ headerShown: false }} />
              <Stack.Screen name="+not-found" />
            </Stack>
            {!hideBottomNav && <GlobalBottomNav />}
          </View>
        </ThemeProvider>
      </AuthProvider>
    </AuthErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
