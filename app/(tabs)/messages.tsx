import React from 'react';
import { SafeAreaView } from 'react-native';
import { AuthConsumer } from '@/contexts/SimpleWorkingAuth';
import MessagingCenter from '@/components/messaging/MessagingCenter';
import { useTheme } from '@/contexts/ThemeContext';

export default function MessagesTabScreen() {
  const { colorScheme } = useTheme();
  const isDark = colorScheme === 'dark';
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? '#0B1220' : '#F8FAFC' }}>
      <AuthConsumer>
        {({ profile }) => (
          <MessagingCenter profile={profile} childrenList={[]} onClose={() => {}} />
        )}
      </AuthConsumer>
    </SafeAreaView>
  );
}

