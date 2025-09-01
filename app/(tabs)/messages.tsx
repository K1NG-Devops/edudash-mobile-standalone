import React, { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthConsumer } from '@/contexts/SimpleWorkingAuth';
import MessagingCenter from '@/components/messaging/MessagingCenter';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors } from '@/constants/Colors';
import { supabase } from '@/lib/supabase';

// Inner component to properly use hooks
const MessagesContent: React.FC<{ profile: any }> = ({ profile }) => {
  const [childrenList, setChildrenList] = useState<any[]>([]);

  // Load children list similar to how parent dashboard does it
  const loadChildrenList = async (profile: any) => {
    if (!profile?.auth_user_id) return;

    try {
      // Get user's internal ID
      const { data: parentData } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', profile.auth_user_id)
        .single();

      if (!parentData) return;

      // Load children associated with this parent
      const { data: children } = await supabase
        .from('students')
        .select('id, first_name, last_name, avatar_url, date_of_birth')
        .eq('parent_id', parentData.id)
        .eq('is_active', true)
        .order('first_name');

      setChildrenList(children || []);
    } catch (error) {
      console.error('Error loading children list:', error);
    }
  };

  // Properly use useEffect at component level
  useEffect(() => {
    if (profile) {
      loadChildrenList(profile);
    }
  }, [profile]);

  return (
    <MessagingCenter profile={profile} childrenList={childrenList} onClose={() => {}} showHeader={true} />
  );
};

export default function MessagesTabScreen() {
  const { colorScheme } = useTheme();
  const palette = Colors[colorScheme];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.background }} edges={['top','left','right']}>
      <AuthConsumer>
        {({ profile }) => <MessagesContent profile={profile} />}
      </AuthConsumer>
    </SafeAreaView>
  );
}

