import { StandardizedNavigation } from '@/components/navigation/StandardizedNavigation';
import { router } from 'expo-router';
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
  schoolName?: string;
  title?: string;
  showBackButton?: boolean;
  onBackPress?: () => void;
  onSignOut?: () => void;
  notificationCount?: number;
}

export function TabLayout({ 
  children, 
  user, 
  schoolName,
  title,
  showBackButton = false,
  onBackPress,
  onSignOut, 
  notificationCount = 0 
}: TabLayoutProps) {
  const insets = useSafeAreaInsets();
  
  const handleNavigate = (route: string) => {
    router.push(route as any);
  };

  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      router.back();
    }
  };

  return (
    <View style={styles.container}>
      {user && (
        <StandardizedNavigation
          user={user}
          schoolName={schoolName}
          title={title}
          showBackButton={showBackButton}
          onBackPress={handleBackPress}
          onNavigate={handleNavigate}
          onSignOut={onSignOut}
          notificationCount={notificationCount}
        />
      )}
      <View style={[styles.content, { paddingBottom: Math.max(insets.bottom, 8) }]}>
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
