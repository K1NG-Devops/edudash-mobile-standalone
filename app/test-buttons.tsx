import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';

export default function TestButtons() {
  const testPlans = [
    { id: 'free-tier', name: 'Free Tier' },
    { id: 'neural-starter', name: 'Neural Starter' },
    { id: 'quantum-pro', name: 'Quantum Pro' },
    { id: 'singularity', name: 'Enterprise' }
  ];

  const handlePlanPress = (plan: typeof testPlans[0]) => {
    Alert.alert('Plan Selected', `You selected ${plan.name}`, [
      { text: 'OK' },
      { text: 'Go to Sign Up', onPress: () => router.push('/(auth)/sign-up') }
    ]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Button Test</Text>
      
      {testPlans.map(plan => (
        <TouchableOpacity
          key={plan.id}
          style={styles.button}
          onPress={() => handlePlanPress(plan)}
        >
          <Text style={styles.buttonText}>Select {plan.name}</Text>
        </TouchableOpacity>
      ))}
      
      <TouchableOpacity
        style={[styles.button, styles.backButton]}
        onPress={() => router.back()}
      >
        <Text style={styles.buttonText}>Go Back</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    padding: 20,
  },
  title: {
    fontSize: 24,
    color: 'white',
    marginBottom: 30,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
    marginVertical: 10,
    width: '100%',
    alignItems: 'center',
  },
  backButton: {
    backgroundColor: '#FF3B30',
    marginTop: 30,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
