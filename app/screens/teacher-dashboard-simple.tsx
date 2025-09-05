import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { UserProfile } from '@/contexts/SimpleWorkingAuth';
import i18n from '../../src/i18n/index';

interface TeacherDashboardProps {
  profile: UserProfile;
}

export default function TeacherDashboard({ profile }: TeacherDashboardProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{i18n.t('dashboard.teacherDashboard')}</Text>
      <Text style={styles.subtitle}>{i18n.t('dashboard.welcome', { name: profile.name })}</Text>
      <Text style={styles.subtitle}>{i18n.t('common.comingSoon')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
});
