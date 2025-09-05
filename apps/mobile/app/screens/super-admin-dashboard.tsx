// @ts-nocheck
import { router } from 'expo-router';
import React, { useEffect } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { useAuth } from '@/contexts/SimpleWorkingAuth';
import SuperAdminDashboard from '@/components/dashboard/SuperAdminDashboard';

const SuperAdminDashboardScreen: React.FC = () => {
  const { user, signOut, loading } = useAuth();
  
  console.log('🧑‍💻 [SuperAdminDashboardScreen] Component render with state:', {
    hasUser: !!user,
    userId: user?.id,
    userEmail: user?.email,
    loading,
    userMetadata: (user as any)?.user_metadata
  });

  // Gracefully handle web race: show loading until auth initializes
  if (loading && !user) {
    console.log('⏳ [SuperAdminDashboardScreen] Showing loading state - auth not ready');
    return (
      <View style={styles.container}>
        <Text style={styles.loading}>Loading…</Text>
      </View>
    );
  }

  // If unauthenticated on web, send to sign-in route instead of hanging
  useEffect(() => {
    if (!loading && !user) {
      try { router.replace('/(auth)/sign-in' as any); } catch {}
    }
  }, [loading, user]);

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
  loading: { color: '#6B7280', fontSize: 16 },
});

export default SuperAdminDashboardScreen;
