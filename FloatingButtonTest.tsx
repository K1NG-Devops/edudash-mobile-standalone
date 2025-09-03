import React from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import FloatingButton from './src/design-system/components/FloatingButton';

export default function FloatingButtonTest() {
  const handlePress = () => {
    Alert.alert('FloatingButton Pressed!', 'The button is working correctly.');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>FloatingButton Test Screen</Text>
      <Text style={styles.subtitle}>
        You should see a green floating button in the bottom-right corner
      </Text>
      
      {/* This should render the floating button */}
      <FloatingButton onPress={handlePress} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
  },
});
