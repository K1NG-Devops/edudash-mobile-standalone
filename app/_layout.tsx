import '@/lib/monitoring';
import '../global.css'; // NativeWind styles
import { AuthErrorBoundary } from '@/components/auth/AuthErrorBoundary';
import { AuthProvider } from '@/contexts/SimpleWorkingAuth';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
// import { ThemeProvider as DesignSystemThemeProvider } from '@/design-system/theme/ThemeProvider';
import * as Notifications from 'expo-notifications';
import { Stack, usePathname, ErrorBoundaryProps } from 'expo-router';
import { useEffect } from 'react';
import { Platform, View, StyleSheet, Text } from 'react-native';
import GlobalBottomNav from '@/components/navigation/GlobalBottomNav';
import { PushService } from '@/lib/services/pushService';
import { SafeAreaProvider, useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '@/constants/Colors';
import RevenueCatProvider from '@/components/payments/RevenueCatProvider';
import { QueryProvider } from '@/contexts/QueryProvider';
import { ToastProvider } from '@/components/ui/Toast';
import { SubscriptionProvider } from '@/contexts/SubscriptionContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/SimpleWorkingAuth';
import { NavigationProvider, useNavigation } from '@/contexts/NavigationContext';
import { AppFlowProvider } from '@/contexts/AppFlowProvider';
import AdsBootstrapper from '@/components/advertising/AdsBootstrapper';
// import { GrowthBookProvider } from '@growthbook/growthbook-react';
// import { growthbook } from '@/lib/growthbook';
import ShakeToReport from '@/components/feedback/ShakeToReport';

// Error boundary for route-level errors
function RouteErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  return (
    <View style={styles.errorContainer}>
      <Text style={styles.errorText}>Something went wrong!</Text>
      <Text style={styles.errorDetails}>{error.message}</Text>
    </View>
  );
}

// Global error boundary for this route segment
export function ErrorBoundary(props: ErrorBoundaryProps) {
  return RouteErrorBoundary(props);
}

function SubscriptionProviderWithAuth({ children }: { children: React.ReactNode }) {
  const { user, profile } = useAuth();
  const userId = profile?.auth_user_id || user?.id || undefined;
  return <SubscriptionProvider userId={userId}>{children}</SubscriptionProvider>;
}

// Sync GrowthBook targeting attributes with the authenticated user
// Temporarily disabled for testing
/*
function GrowthBookAttributeSync() {
  const { user, profile } = useAuth();
  useEffect(() => {
    try {
      const attrs: Record<string, any> = {
        environment: process.env.EXPO_PUBLIC_ENVIRONMENT,
        platform: Platform.OS,
      };
      const id = (profile as any)?.auth_user_id || (user as any)?.id;
      if (id) attrs.userId = id;
      const role = (profile as any)?.role || (user as any)?.role;
      if (role) attrs.role = role;
      const schoolId = (profile as any)?.preschool_id || (user as any)?.preschool_id;
      if (schoolId) attrs.school_id = schoolId;
      growthbook.setAttributes(attrs);
    } catch {
      // best-effort; never block UI
    }
  }, [user, profile]);
  return null;
}
*/

// Foreground notifications behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: true,
    shouldShowBanner: false,
    shouldShowList: true,
  }),
});

export default function RootLayout() {
  const pathname = usePathname();
  // Hide global bottom nav on welcome, landing, auth, super-admin dashboard and pricing pages
  const hideBottomNav = (
    pathname === '/' ||
    pathname === '/landing' ||
    pathname.startsWith('/(auth)') ||
    pathname.startsWith('/screens/super-admin-dashboard') ||
    pathname === '/pricing'
  );

  useEffect(() => {
    const register = async () => {
      try {
        const ENABLE_PUSH = process.env.EXPO_PUBLIC_ENABLE_PUSH_NOTIFICATIONS === 'true';
        if (!ENABLE_PUSH) return;
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
          // Get Expo push token
          const token = await Notifications.getExpoPushTokenAsync();
          const expoToken = typeof token === 'string' ? token : (token?.data ?? null);
          if (expoToken) {
            // Save token to Supabase (RLS-safe)
            await PushService.saveExpoPushToken({ token: expoToken, projectId: null, appVersion: null });
          }
        }
      } catch {
        // best-effort; non-fatal
      }
    };
    register();
  }, []);
  const ThemeStatusBar = () => {
    const { colorScheme } = useTheme();
    return <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />;
  };

  // Move useSafeAreaInsets usage inside the SafeAreaProvider via an inner component
  const ContainerWithInsets = ({ hideBottomNav }: { hideBottomNav: boolean }) => {
    const insets = useSafeAreaInsets();
    const { isBottomNavVisible } = useNavigation();
    const { user, profile, loading } = useAuth();
    const { colorScheme } = useTheme();
    const bottomNavBase = 64; // estimated nav height on mobile

    // GlobalBottomNav renders null when unauthenticated or loading.
    const navWouldRender = !!profile && !loading && isBottomNavVisible;
    const shouldHideNav = hideBottomNav || !navWouldRender;

    const containerPaddingBottom = (!shouldHideNav && Platform.OS !== 'web')
      ? (bottomNavBase + (insets?.bottom || 0))
      : 0;

    const bgColor = colorScheme === 'dark' ? Colors.dark.background : Colors.light.background;

    return (
      <SafeAreaView edges={['top','left','right']} style={[styles.container, { paddingBottom: containerPaddingBottom, backgroundColor: bgColor }]}> 
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
        {!shouldHideNav && <GlobalBottomNav />}
        {/* Initialize interstitials and ad config (child-safe, throttled) */}
        <AdsBootstrapper />
        {/* Shake-to-report, gated to beta builds and authenticated users */}
        {process.env.EXPO_PUBLIC_BETA_MODE === 'true' && process.env.EXPO_PUBLIC_SHAKE_TO_REPORT === 'true' && profile && (
          <ShakeToReport />
        )}
      </SafeAreaView>
    );
  };

  // Wrapper to apply NativeWind dark class on React Native
  const RootThemeWrapper = ({ children }: { children: React.ReactNode }) => {
    const { colorScheme } = useTheme();
    // Apply "dark" class at the root so `dark:` variants work across the app on native
    return (
      <View className={colorScheme === 'dark' ? 'dark flex-1' : 'flex-1'} style={styles.full}>
        {children}
      </View>
    );
  };

  return (
    <AuthErrorBoundary>
      <AuthProvider>
        <QueryProvider>
          <ThemeProvider>
            {/* <DesignSystemThemeProvider> */}
              <RevenueCatProvider>
                <ToastProvider>
                  <NavigationProvider>
                    <SubscriptionProviderWithAuth>
                      <AppFlowProvider>
                        <SafeAreaProvider>
                          <LanguageProvider>
                            <RootThemeWrapper>
                              <ThemeStatusBar />
                              <ContainerWithInsets hideBottomNav={hideBottomNav} />
                            </RootThemeWrapper>
                          </LanguageProvider>
                        </SafeAreaProvider>
                      </AppFlowProvider>
                    </SubscriptionProviderWithAuth>
                  </NavigationProvider>
                </ToastProvider>
              </RevenueCatProvider>
            {/* </DesignSystemThemeProvider> */}
          </ThemeProvider>
        </QueryProvider>
      </AuthProvider>
    </AuthErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  full: { flex: 1 },
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
