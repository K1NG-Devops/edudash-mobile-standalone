import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TestButtons() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Test Buttons</Text>
      <Text style={styles.subtitle}>Temporary screen for manual testing.</Text>
      <View style={styles.card}>
        <Text style={styles.cardText}>Add ad-hoc buttons/components here during development.</Text>
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
