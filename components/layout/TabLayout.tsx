import { MobileHeader } from '@/components/navigation/MobileHeader';
import AdPlacement from '@/components/ui/AdPlacement';
import { router } from 'expo-router';
import type { Href } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface TabLayoutProps {
  children: React.ReactNode;
  user?: {
    name: string;
    role: string;
    avatar?: string;
  };
  onSignOut?: () => void;
  notificationCount?: number;
}

export function TabLayout({ children, user, onSignOut, notificationCount }: TabLayoutProps) {
  const insets = useSafeAreaInsets();
  const handleNavigate = (route: string | Href) => {
    router.push(route as Href);
  };

  const handleNotificationsPress = () => {
    router.push('/notifications' as Href);
  };

  const handleSearchPress = () => {
    router.push('/search' as Href);
  };

  return (
    <View style={styles.container}>
      {user && (
        <MobileHeader
          user={user}
          onNavigate={handleNavigate}
          onSignOut={onSignOut}
          onNotificationsPress={handleNotificationsPress}
          notificationCount={notificationCount}
        />
      )}
      <AdPlacement>
        <View style={[styles.content, { paddingBottom: Math.max(insets.bottom, 8) }]}>
          {children}
        </View>
      </AdPlacement>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    flex: 1,
  },
});
