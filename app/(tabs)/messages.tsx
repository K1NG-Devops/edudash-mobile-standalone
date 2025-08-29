import React from 'react';
import { SafeAreaView } from 'react-native';
import { AuthConsumer } from '@/contexts/SimpleWorkingAuth';
import MessagingCenter from '@/components/messaging/MessagingCenter';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors } from '@/constants/Colors';

export default function MessagesTabScreen() {
  const { colorScheme } = useTheme();
  const palette = Colors[colorScheme];
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.background }}>
      <AuthConsumer>
        {({ profile }) => (
          <MessagingCenter profile={profile} childrenList={[]} onClose={() => {}} showHeader={false} />
        )}
      </AuthConsumer>
    </SafeAreaView>
  );
}

