import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';

// Debug component to show environment variables
export default function DebugEnvScreen() {
  const envVars = {
    'EXPO_PUBLIC_SUPABASE_URL': process.env.EXPO_PUBLIC_SUPABASE_URL,
    'EXPO_PUBLIC_SUPABASE_ANON_KEY': process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ? '[PRESENT]' : '[MISSING]',
    'EXPO_PUBLIC_WEB_URL': process.env.EXPO_PUBLIC_WEB_URL,
    'EXPO_PUBLIC_ENVIRONMENT': process.env.EXPO_PUBLIC_ENVIRONMENT,
    'EXPO_PUBLIC_DEBUG_MODE': process.env.EXPO_PUBLIC_DEBUG_MODE,
    'EXPO_PUBLIC_APP_NAME': process.env.EXPO_PUBLIC_APP_NAME,
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Environment Variables Debug</Text>
      
      {Object.entries(envVars).map(([key, value]) => (
        <View key={key} style={styles.row}>
          <Text style={styles.key}>{key}:</Text>
          <Text style={styles.value}>{value || '[NOT SET]'}</Text>
        </View>
      ))}
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Expected Values:</Text>
        <Text style={styles.expected}>• EXPO_PUBLIC_SUPABASE_URL should be: https://lvvvjywrmpcqrpvuptdi.supabase.co</Text>
        <Text style={styles.expected}>• EXPO_PUBLIC_SUPABASE_ANON_KEY should be: [PRESENT]</Text>
        <Text style={styles.expected}>• EXPO_PUBLIC_WEB_URL should be: https://app.edudashpro.org.za</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  row: {
    marginBottom: 15,
    padding: 10,
    backgroundColor: 'white',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  key: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  value: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'monospace',
  },
  section: {
    marginTop: 30,
    padding: 15,
    backgroundColor: '#e8f4f8',
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  expected: {
    fontSize: 12,
    color: '#555',
    marginBottom: 5,
  },
});
