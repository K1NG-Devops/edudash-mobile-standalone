import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { MobileHeader } from '@/components/navigation/MobileHeader';
import { AuthConsumer } from '@/contexts/SimpleWorkingAuth';
import { router } from 'expo-router';

const handleNavigate = (route: string) => {
  console.log('Navigating to:', route);
  if (route.startsWith('/(tabs)')) {
    router.push(route as any);
  } else if (route.startsWith('/')) {
    const screenName = route.substring(1);
    router.push(`/screens/${screenName}` as any);
  }
};

export default function ActivitiesScreen() {
  return (
    <AuthConsumer>
      {({ profile, signOut }) => (
        <View style={styles.container}>
          <MobileHeader
            user={{
              name: profile?.full_name || 'Parent',
              role: 'parent',
              avatar: profile?.avatar_url,
            }}
            onNotificationsPress={() => console.log('Notifications')}
            onSearchPress={() => console.log('Search')}
            onSignOut={signOut}
            onNavigate={handleNavigate}
            notificationCount={3}
          />
          
          <ScrollView style={styles.content}>
            <View style={styles.centerContent}>
              <Text style={styles.title}>Activities</Text>
              <Text style={styles.subtitle}>School activities and events</Text>
            </View>
          </ScrollView>
        </View>
      )}
    </AuthConsumer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
});
