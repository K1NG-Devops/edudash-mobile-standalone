// Example: How to add the Password Reset Tool to your admin dashboard

import { PasswordResetTool } from '@/components/admin/PasswordResetTool';
import React from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';

export default function AdminDashboard() {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.pageTitle}>Admin Dashboard</Text>
      
      {/* Other admin tools */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>User Management</Text>
        
        {/* Password Reset Tool */}
        <PasswordResetTool />
        
        {/* Other admin tools would go here */}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    padding: 20,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
});
