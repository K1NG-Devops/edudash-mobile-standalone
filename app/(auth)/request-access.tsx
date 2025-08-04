import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { createOnboardingRequest } from '@/lib/services/onboardingService';
import { router } from 'expo-router';

export default function RequestAccessScreen() {
  const [formData, setFormData] = useState({
    preschoolName: '',
    adminName: '',
    adminEmail: '',
    phone: '',
    address: '',
    numberOfStudents: '',
    numberOfTeachers: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);

  const handleRequestAccess = async () => {
    console.log('Submit button pressed!');
    console.log('Form data:', formData);
    
    if (!formData.preschoolName.trim() || !formData.adminName.trim() || !formData.adminEmail.trim()) {
      console.log('Validation failed - missing required fields');
      Alert.alert('Error', 'Preschool name, admin name, and email are required.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    console.log('Validation passed, submitting request...');
    setLoading(true);
    try {
      console.log('Calling createOnboardingRequest...');
      await createOnboardingRequest(formData);
      console.log('Request successful!');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        'Request Submitted!', 
        'Your preschool access request has been submitted successfully. A super admin will review your request and contact you via email.',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/(auth)/sign-in')
          }
        ]
      );
    } catch (error) {
      console.error('Submit error:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Request Preschool Access</Text>
          <Text style={styles.subtitle}>Start your journey by submitting a request</Text>
        </View>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            value={formData.preschoolName}
            onChangeText={(text) => setFormData({...formData, preschoolName: text})}
            placeholder="Preschool Name"
          />
          
          <TextInput
            style={styles.input}
            value={formData.adminName}
            onChangeText={(text) => setFormData({...formData, adminName: text})}
            placeholder="Admin Name"
          />

          <TextInput
            style={styles.input}
            value={formData.adminEmail}
            onChangeText={(text) => setFormData({...formData, adminEmail: text})}
            keyboardType="email-address"
            placeholder="Admin Email"
          />

          <TextInput
            style={styles.input}
            value={formData.phone}
            onChangeText={(text) => setFormData({...formData, phone: text})}
            keyboardType="phone-pad"
            placeholder="Phone"
          />

          <TextInput
            style={styles.input}
            value={formData.address}
            onChangeText={(text) => setFormData({...formData, address: text})}
            placeholder="Address"
          />

          <TextInput
            style={styles.input}
            value={formData.numberOfStudents}
            onChangeText={(text) => setFormData({...formData, numberOfStudents: text})}
            keyboardType="numeric"
            placeholder="Number of Students"
          />

          <TextInput
            style={styles.input}
            value={formData.numberOfTeachers}
            onChangeText={(text) => setFormData({...formData, numberOfTeachers: text})}
            keyboardType="numeric"
            placeholder="Number of Teachers"
          />

          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.message}
            onChangeText={(text) => setFormData({...formData, message: text})}
            placeholder="Additional Message"
            multiline
            numberOfLines={4}
          />

          <TouchableOpacity 
            style={[styles.submitButton, loading && styles.submitButtonDisabled]} 
            onPress={handleRequestAccess}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.submitButtonText}>Submit Request</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  scrollContent: {
    padding: 20,
    flexGrow: 1,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  form: {
    flex: 1,
  },
  input: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 10,
  },
  textArea: {
    height: 80,
  },
  submitButton: {
    backgroundColor: '#1E40AF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  submitButtonDisabled: {
    backgroundColor: '#9CA3AF',
    opacity: 0.6,
  },
});

