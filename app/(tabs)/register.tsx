import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { MobileHeader } from '@/components/navigation/MobileHeader';
import { AuthConsumer } from '@/contexts/SimpleWorkingAuth';
import { router } from 'expo-router';
import { studentService } from '@/lib/services/studentService';
import * as Haptics from 'expo-haptics';

const handleNavigate = (route: string) => {
  console.log('Navigating to:', route);
  if (route.startsWith('/(tabs)')) {
    router.push(route as any);
  } else if (route.startsWith('/')) {
    const screenName = route.substring(1);
    router.push(`/screens/${screenName}` as any);
  }
};

export default function RegisterScreen() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    sex: '',
    homeLanguage: '',
    homeAddress: '',
    nickname: '',
    allergies: '',
    dietaryRestrictions: '',
    medications: '',
    medicalConditions: '',
    previousPreschool: '',
    previousExperience: '',
    attendanceDays: [] as string[],
    timeBlock: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelation: '',
    consentPolicies: false,
    consentMedia: false,
    consentFieldTrips: false,
    consentPhotography: false,
    registrationFee: '',
    paymentMethod: '',
    additionalNotes: '',
  });
  
  const handleInputChange = (field: keyof typeof formData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleDayToggle = (day: string) => {
    setFormData(prev => ({
      ...prev,
      attendanceDays: prev.attendanceDays.includes(day)
        ? prev.attendanceDays.filter(d => d !== day)
        : [...prev.attendanceDays, day]
    }));
  };

  return (
    <AuthConsumer>
      {({ profile, signOut }) => (
        <View style={styles.container}>
          <MobileHeader
            user={{
              name: profile?.full_name || 'Parent',
              role: 'parent',
              avatar: profile?.avatar_url,
            }}
            onNotificationsPress={() => console.log('Notifications')}
            onSearchPress={() => console.log('Search')}
            onSignOut={signOut}
            onNavigate={handleNavigate}
            notificationCount={3}
          />
          
          <ScrollView style={styles.content}>
            <View style={styles.centerContent}>
              <TextInput
                placeholder="Child's First Name"
                style={styles.input}
                value={formData.firstName}
                onChangeText={(text) => handleInputChange('firstName', text)}
              />
              <TextInput
                placeholder="Child's Last Name"
                style={styles.input}
                value={formData.lastName}
                onChangeText={(text) => handleInputChange('lastName', text)}
              />
              <TextInput
                placeholder="Birth Date (YYYY-MM-DD)"
                style={styles.input}
                value={formData.dateOfBirth}
                onChangeText={(text) => handleInputChange('dateOfBirth', text)}
              />
              <TextInput
                placeholder="Sex"
                style={styles.input}
                value={formData.sex}
                onChangeText={(text) => handleInputChange('sex', text)}
              />
              <TextInput
                placeholder="Home Language"
                style={styles.input}
                value={formData.homeLanguage}
                onChangeText={(text) => handleInputChange('homeLanguage', text)}
              />
              <TextInput
                placeholder="Home Address"
                style={styles.input}
                value={formData.homeAddress}
                onChangeText={(text) => handleInputChange('homeAddress', text)}
                multiline
              />
              <TextInput
                placeholder="Nickname"
                style={styles.input}
                value={formData.nickname}
                onChangeText={(text) => handleInputChange('nickname', text)}
              />
              <TextInput
                placeholder="Allergies"
                style={styles.input}
                value={formData.allergies}
                onChangeText={(text) => handleInputChange('allergies', text)}
                multiline
              />
              <TextInput
                placeholder="Dietary Restrictions"
                style={styles.input}
                value={formData.dietaryRestrictions}
                onChangeText={(text) => handleInputChange('dietaryRestrictions', text)}
                multiline
              />
              <TextInput
                placeholder="Medications"
                style={styles.input}
                value={formData.medications}
                onChangeText={(text) => handleInputChange('medications', text)}
                multiline
              />
              <TextInput
                placeholder="Medical Conditions"
                style={styles.input}
                value={formData.medicalConditions}
                onChangeText={(text) => handleInputChange('medicalConditions', text)}
                multiline
              />
              <TextInput
                placeholder="Emergency Contact Name"
                style={styles.input}
                value={formData.emergencyContactName}
                onChangeText={(text) => handleInputChange('emergencyContactName', text)}
              />
              <TextInput
                placeholder="Emergency Contact Phone"
                style={styles.input}
                value={formData.emergencyContactPhone}
                onChangeText={(text) => handleInputChange('emergencyContactPhone', text)}
                keyboardType="phone-pad"
              />
              <TextInput
                placeholder="Emergency Contact Relation"
                style={styles.input}
                value={formData.emergencyContactRelation}
                onChangeText={(text) => handleInputChange('emergencyContactRelation', text)}
              />
              <TextInput
                placeholder="Previous Preschool/Daycare"
                style={styles.input}
                value={formData.previousPreschool}
                onChangeText={(text) => handleInputChange('previousPreschool', text)}
              />
              <TextInput
                placeholder="Previous Experience"
                style={styles.input}
                value={formData.previousExperience}
                onChangeText={(text) => handleInputChange('previousExperience', text)}
                multiline
              />
              <TextInput
                placeholder="Time Block Preference"
                style={styles.input}
                value={formData.timeBlock}
                onChangeText={(text) => handleInputChange('timeBlock', text)}
              />
              <TextInput
                placeholder="Registration Fee"
                style={styles.input}
                value={formData.registrationFee}
                onChangeText={(text) => handleInputChange('registrationFee', text)}
              />
              <TextInput
                placeholder="Payment Method"
                style={styles.input}
                value={formData.paymentMethod}
                onChangeText={(text) => handleInputChange('paymentMethod', text)}
              />
              <TextInput
                placeholder="Additional Notes"
                style={styles.input}
                value={formData.additionalNotes}
                onChangeText={(text) => handleInputChange('additionalNotes', text)}
                multiline
                numberOfLines={4}
              />
              
              <TouchableOpacity
                style={styles.submitButton}
                onPress={() => console.log('Register Student pressed', formData)}
              >
                <Text style={styles.submitButtonText}>Register Student</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      )}
    </AuthConsumer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  centerContent: {
    paddingVertical: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
  },
  submitButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
});
