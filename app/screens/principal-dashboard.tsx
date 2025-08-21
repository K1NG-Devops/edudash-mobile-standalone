import React from 'react';
import PrincipalDashboard from '../../screens/principal-dashboard';
import { AuthConsumer } from '@/contexts/SimpleWorkingAuth';
import { Stack } from 'expo-router';
import Head from 'expo-router/head';

export default function PrincipalDashboardScreen() {
  return (
    <>
      <Head>
        <title>EduDash Pro – Principal</title>
      </Head>
      <Stack.Screen options={{ headerShown: false, title: ' ' }} />
      <AuthConsumer>
        {({ profile, signOut }) => (
          <PrincipalDashboard profile={profile} onSignOut={signOut} />
        )}
      </AuthConsumer>
    </>
  );
}
