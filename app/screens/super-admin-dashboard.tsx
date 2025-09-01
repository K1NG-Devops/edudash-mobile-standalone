// @ts-nocheck
import { router } from 'expo-router';
import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { useAuth } from '@/contexts/SimpleWorkingAuth';
import SuperAdminDashboard from '@/components/dashboard/SuperAdminDashboard';

const SuperAdminDashboardScreen: React.FC = () => {
  const { user, signOut } = useAuth();

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Authentication required</Text>
      </View>
    );
  }

  return (
    <SuperAdminDashboard
      userId={user.id}
      userProfile={{
        name: (user as any)?.name || (user as any)?.email || 'Super Admin',
        role: 'superadmin',
        avatar: (user as any)?.avatar_url,
      }}
      onSignOut={signOut}
      onNavigate={(route) => {
        if (route.startsWith('/')) router.push(route as any);
        else router.push(`/${route}` as any);
      }}
    />
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  message: { color: '#EF4444', fontSize: 16 },
});

export default SuperAdminDashboardScreen;
