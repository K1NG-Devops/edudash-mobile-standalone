import { AuthErrorBoundary } from '@/components/auth/AuthErrorBoundary';
import { AuthProvider } from '@/contexts/SimpleWorkingAuth';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import * as Notifications from 'expo-notifications';
import { Stack, usePathname, ErrorBoundaryProps } from 'expo-router';
import { useEffect, ErrorBoundary } from 'react';
import { Platform, View, StyleSheet, Text } from 'react-native';
import GlobalBottomNav from '@/components/navigation/GlobalBottomNav';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { Colors } from '@/constants/Colors';

// Error boundary for route-level errors
function RouteErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  return (
    <View style={styles.errorContainer}>
      <Text style={styles.errorText}>Something went wrong!</Text>
      <Text style={styles.errorDetails}>{error.message}</Text>
    </View>
  );
}

export default function RootLayout() {
  const pathname = usePathname();
  const hideBottomNav = pathname === '/' || pathname.startsWith('/(auth)') || pathname.startsWith('/screens/super-admin-dashboard');

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
  const ThemeStatusBar = () => {
    const { colorScheme } = useTheme();
    const palette = Colors[colorScheme];
    useEffect(() => {
      SystemUI.setBackgroundColorAsync(palette.background).catch(() => {});
    }, [palette.background]);
    return <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} backgroundColor={palette.background} />;
  };

  return (
    <AuthErrorBoundary>
      <AuthProvider>
        <ThemeProvider>
          <SafeAreaProvider>
            <ThemeStatusBar />
            <View style={styles.container}>
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="index" options={{ headerShown: false }} />
                <Stack.Screen name="landing" options={{ headerShown: false }} />
                <Stack.Screen name="pricing" options={{ headerShown: false }} />
                <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="screens" options={{ headerShown: false }} />
                <Stack.Screen name="about" options={{ headerShown: false }} />
                <Stack.Screen name="+not-found" options={{ headerShown: false, title: 'Not Found' }} />
              </Stack>
              {!hideBottomNav && <GlobalBottomNav />}
            </View>
          </SafeAreaProvider>
        </ThemeProvider>
      </AuthProvider>
    </AuthErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#fff',
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ef4444',
    marginBottom: 8,
  },
  errorDetails: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
});
