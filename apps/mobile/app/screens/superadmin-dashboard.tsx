import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SuperadminDashboard() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Superadmin Dashboard</Text>
      <Text style={styles.subtitle}>This screen is under construction.</Text>
      <View style={styles.card}>
        <Text style={styles.cardText}>Soon: Manage tenants, users, and system settings.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#0a0a0f',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#9aa0a6',
    marginBottom: 16,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)'
  },
  cardText: {
    color: '#e5e7eb',
  }
});
