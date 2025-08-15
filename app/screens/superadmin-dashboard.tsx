import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function SuperAdminDashboardScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Super Admin Dashboard Screen - Coming Soon</Text>
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
  text: {
    fontSize: 18,
    textAlign: 'center',
  },
});
