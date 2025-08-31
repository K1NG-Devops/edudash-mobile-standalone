import React from 'react';
import { Stack } from 'expo-router';
import { useAuth } from '@/contexts/SimpleWorkingAuth';
import AnnouncementManagement from '@/screens/announcement-management';

export default function AnnouncementManagementScreen() {
  const { profile, signOut } = useAuth();

  return (
    <>
      <Stack.Screen options={{ headerShown: false, title: ' ' }} />
      <AnnouncementManagement
        profile={profile}
        onSignOut={signOut}
      />
    </>
  );
}
