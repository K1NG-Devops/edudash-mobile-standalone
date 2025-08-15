import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function TeachersScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Teachers Screen - Coming Soon</Text>
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
