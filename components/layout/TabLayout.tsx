import React from 'react';
import { View, StyleSheet } from 'react-native';
import { MobileHeader } from '@/components/navigation/MobileHeader';
import { router } from 'expo-router';

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
  const handleNavigate = (route: string) => {
    router.push(route);
  };

  const handleNotificationsPress = () => {
    router.push('/notifications');
  };

  const handleSearchPress = () => {
    router.push('/search');
  };

  return (
    <View style={styles.container}>
      {user && (
        <MobileHeader
          user={user}
          onNavigate={handleNavigate}
          onSignOut={onSignOut}
          onNotificationsPress={handleNotificationsPress}
          onSearchPress={handleSearchPress}
          notificationCount={notificationCount}
        />
      )}
      <View style={styles.content}>
        {children}
      </View>
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
