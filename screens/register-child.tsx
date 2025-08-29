/* eslint-disable */
// @ts-nocheck
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { AuthConsumer, UserProfile } from '@/contexts/SimpleWorkingAuth';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { MobileHeader } from '@/components/navigation/MobileHeader';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';

interface ChildFormData {
  first_name: string;
  last_name: string;
  date_of_birth: Date;
  gender: string;
  medical_conditions: string;
  allergies: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  emergency_contact_relation: string;
}

interface PreschoolClass {
  id: string;
  name: string;
  age_min: number;
  age_max: number;
  capacity: number;
  current_enrollment: number;
}

interface RegisterChildContentProps {
  profile: UserProfile | null;
  onSignOut: () => Promise<void>;
}

const RegisterChildContent: React.FC<RegisterChildContentProps> = ({ profile, onSignOut }) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [availableClasses, setAvailableClasses] = useState<PreschoolClass[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [formData, setFormData] = useState<ChildFormData>({
    first_name: '',
    last_name: '',
    date_of_birth: new Date(),
    gender: '',
    medical_conditions: '',
    allergies: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    emergency_contact_relation: '',
  });

  const updateFormData = <K extends keyof ChildFormData>(field: K, value: ChildFormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const calculateAge = (birthDate: Date): number => {
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      return age - 1;
    }
    return age;
  };

  const loadAvailableClasses = async (profile: UserProfile) => {
    if (!profile.preschool_id) return;

    try {
      const { data: classes, error } = await supabase
        .from('classes')
        .select(`
          id,
          name,
          age_min,
          age_max,
          capacity,
          current_enrollment
        `)
        .eq('preschool_id', profile.preschool_id)
        .eq('is_active', true)
        .order('age_min');

      if (error) throw error;

      setAvailableClasses(classes || []);
    } catch (error) {
      // Removed debug statement: console.error('Error loading classes:', error);
    }
  };

  const getRecommendedClass = (childAge: number): PreschoolClass | null => {
    return availableClasses.find(cls => 
      childAge >= cls.age_min && childAge <= cls.age_max && 
      cls.current_enrollment < cls.capacity
    ) || null;
  };

  const validateForm = () => {
    const requiredFields = ['first_name', 'last_name', 'gender'];
    const missingFields = requiredFields.filter(field => 
      !formData[field as keyof ChildFormData]?.toString().trim()
    );

    if (missingFields.length > 0) {
      Alert.alert(
        'Missing Information',
        `Please fill in the following required fields: ${missingFields.join(', ').replace(/_/g, ' ')}`
      );
      return false;
    }

    // Check if child is too young or too old
    const childAge = calculateAge(formData.date_of_birth);
    if (childAge < 2 || childAge > 6) {
      Alert.alert(
        'Age Requirement',
        'Children must be between 2 and 6 years old to enroll.'
      );
      return false;
    }

    if (!selectedClassId) {
      Alert.alert(
        'Class Selection Required',
        'Please select a class for your child.'
      );
      return false;
    }

    return true;
  };

  const registerChild = async (profile: UserProfile) => {
    if (!validateForm()) return;

    setSaving(true);
    try {
      // Get parent's internal ID
      const { data: parentProfile, error: parentError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', profile.auth_user_id)
        .single();

      if (parentError || !parentProfile) {
        throw new Error('Parent profile not found');
      }

      // Register the child
      const { data: student, error: studentError } = await supabase
        .from('students')
        .insert({
          first_name: formData.first_name.trim(),
          last_name: formData.last_name.trim(),
          date_of_birth: formData.date_of_birth.toISOString().split('T')[0],
          gender: formData.gender,
          medical_conditions: formData.medical_conditions.trim() || null,
          allergies: formData.allergies.trim() || null,
          emergency_contact_name: formData.emergency_contact_name.trim() || null,
          emergency_contact_phone: formData.emergency_contact_phone.trim() || null,
          emergency_contact_relation: formData.emergency_contact_relation.trim() || null,
          parent_id: parentProfile.id,
          class_id: selectedClassId,
          preschool_id: profile.preschool_id,
          enrollment_date: new Date().toISOString().split('T')[0],
          is_active: true,
        })
        .select()
        .single();

      if (studentError) {
        throw studentError;
      }

      // Update class enrollment count
      const selectedClass = availableClasses.find(cls => cls.id === selectedClassId);
      if (selectedClass) {
        await supabase
          .from('classes')
          .update({ current_enrollment: selectedClass.current_enrollment + 1 })
          .eq('id', selectedClassId);
      }

      Alert.alert(
        'Registration Successful!',
        `${formData.first_name} has been successfully registered. Welcome to our preschool family!`,
        [
          {
            text: 'Continue',
            onPress: () => router.push('/(tabs)/dashboard'),
          },
        ]
      );
    } catch (error) {
      // Removed debug statement: console.error('Error registering child:', error);
      Alert.alert(
        'Registration Failed',
        'There was an error registering your child. Please try again or contact support.'
      );
    } finally {
      setSaving(false);
    }
  };

  const renderFormField = (
    label: string,
    field: keyof ChildFormData,
    placeholder: string,
    required: boolean = true,
    multiline: boolean = false,
    keyboardType: 'default' | 'email-address' | 'phone-pad' = 'default'
  ) => (
    <View style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>
        {label} {required && <Text style={styles.required}>*</Text>}
      </Text>
      <TextInput
        style={[styles.textInput, multiline && styles.textInputMultiline]}
        value={formData[field]?.toString() || ''}
        onChangeText={(value) => updateFormData(field, value as any)}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
        keyboardType={keyboardType}
        autoCapitalize="sentences"
      />
    </View>
  );

  // Load available classes on mount
  useEffect(() => {
    if (profile && !loading) {
      loadAvailableClasses(profile);
    }
  }, [profile]);

  // Auto-select recommended class when age changes
  useEffect(() => {
    const childAge = calculateAge(formData.date_of_birth);
    const recommendedClass = getRecommendedClass(childAge);
    if (recommendedClass && !selectedClassId) {
      setSelectedClassId(recommendedClass.id);
    }
  }, [formData.date_of_birth, availableClasses]);

  const childAge = calculateAge(formData.date_of_birth);
  const recommendedClass = getRecommendedClass(childAge);

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <MobileHeader
        user={{
          name: profile?.name || 'Parent',
          role: 'parent',
          avatar: profile?.avatar_url,
        }}
        onNotificationsPress={() => { /* TODO: Implement notifications */ }}
        onSignOut={onSignOut}
        onNavigate={(route) => router.push(route as any)}
        notificationCount={0}
        title="Register Child"
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.headerContainer}>
          <LinearGradient
            colors={['#F0F9FF', '#E0F2FE']}
            style={styles.headerGradient}
          >
            <View style={styles.headerIcon}>
              <IconSymbol name="graduationcap.fill" size={48} color="#0EA5E9" />
            </View>
            <Text style={styles.headerTitle}>Register Your Child</Text>
            <Text style={styles.headerSubtitle}>
              Let&apos;s get your child enrolled in our preschool program
            </Text>
          </LinearGradient>
        </View>

        <View style={styles.formContainer}>
          {/* Basic Information */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>👶 Child Information</Text>
            
            {renderFormField('First Name', 'first_name', 'Enter child&apos;s first name')}
            {renderFormField('Last Name', 'last_name', 'Enter child&apos;s last name')}

            {/* Date of Birth */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>
                Date of Birth <Text style={styles.required}>*</Text>
              </Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={styles.dateText}>
                  {formData.date_of_birth.toLocaleDateString()}
                </Text>
                <IconSymbol name="calendar" size={20} color="#6B7280" />
              </TouchableOpacity>
              <Text style={styles.ageText}>
                Age: {childAge} years old
              </Text>
            </View>

            {showDatePicker && (
              <DateTimePicker
                value={formData.date_of_birth}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => {
                  setShowDatePicker(false);
                  if (selectedDate) {
                    updateFormData('date_of_birth', selectedDate);
                  }
                }}
                maximumDate={new Date()}
                minimumDate={new Date(new Date().getFullYear() - 10, 0, 1)}
              />
            )}

            {/* Gender */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>
                Gender <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={formData.gender}
                  onValueChange={(value) => updateFormData('gender', value)}
                  style={styles.picker}
                >
                  <Picker.Item label="Select gender" value="" />
                  <Picker.Item label="Male" value="male" />
                  <Picker.Item label="Female" value="female" />
                  <Picker.Item label="Other" value="other" />
                </Picker>
              </View>
            </View>
          </View>

          {/* Class Selection */}
          {availableClasses.length > 0 && (
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>🏫 Class Selection</Text>
              
              {recommendedClass && (
                <View style={styles.recommendationCard}>
                  <IconSymbol name="star.fill" size={20} color="#F59E0B" />
                  <Text style={styles.recommendationText}>
                    Recommended: {recommendedClass.name} (Ages {recommendedClass.age_min}-{recommendedClass.age_max})
                  </Text>
                </View>
              )}

              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>
                  Select Class <Text style={styles.required}>*</Text>
                </Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={selectedClassId}
                    onValueChange={setSelectedClassId}
                    style={styles.picker}
                  >
                    <Picker.Item label="Select a class" value="" />
                    {availableClasses.map(cls => (
                      <Picker.Item
                        key={cls.id}
                        label={`${cls.name} (Ages ${cls.age_min}-${cls.age_max}) - ${cls.capacity - cls.current_enrollment} spots left`}
                        value={cls.id}
                        enabled={cls.current_enrollment < cls.capacity}
                      />
                    ))}
                  </Picker>
                </View>
              </View>
            </View>
          )}

          {/* Health Information */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>🏥 Health Information (Optional)</Text>
            <Text style={styles.sectionDescription}>
              Help us provide the best care for your child
            </Text>
            
            {renderFormField('Medical Conditions', 'medical_conditions', 'Any medical conditions we should know about', false, true)}
            {renderFormField('Allergies', 'allergies', 'Any allergies (food, environmental, etc.)', false, true)}
          </View>

          {/* Emergency Contact */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>🚨 Emergency Contact (Optional)</Text>
            <Text style={styles.sectionDescription}>
              Alternative contact person besides yourself
            </Text>
            
            {renderFormField('Emergency Contact Name', 'emergency_contact_name', 'Name of emergency contact', false)}
            {renderFormField('Emergency Contact Phone', 'emergency_contact_phone', 'Emergency contact phone', false, false, 'phone-pad')}
            {renderFormField('Relation to Child', 'emergency_contact_relation', 'e.g., Grandparent, Aunt, Family Friend', false)}
          </View>

          {/* Registration Button */}
          <TouchableOpacity
            style={[styles.registerButton, saving && styles.registerButtonDisabled]}
            onPress={() => registerChild(profile!)}
            disabled={saving}
          >
            <LinearGradient
              colors={saving ? ['#9CA3AF', '#6B7280'] : ['#0EA5E9', '#0284C7']}
              style={styles.registerButtonGradient}
            >
              {saving ? (
                <>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                  <Text style={styles.registerButtonText}>Registering...</Text>
                </>
              ) : (
                <>
                  <IconSymbol name="graduationcap.fill" size={20} color="#FFFFFF" />
                  <Text style={styles.registerButtonText}>Register Child</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Info Card */}
          <View style={styles.infoCard}>
            <IconSymbol name="info.circle.fill" size={24} color="#0EA5E9" />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>What happens next?</Text>
              <Text style={styles.infoText}>
                After registration, our staff will review your child&apos;s information and contact you within 1-2 business days to complete the enrollment process.
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const RegisterChildScreen = () => {
  return (
    <AuthConsumer>
      {({ profile, signOut }) => (
        <RegisterChildContent
          profile={profile}
          onSignOut={signOut}
        />
      )}
    </AuthConsumer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  headerContainer: {
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 32,
  },
  headerGradient: {
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
  },
  headerIcon: {
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
  },
  formContainer: {
    marginHorizontal: 20,
  },
  sectionContainer: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
    lineHeight: 20,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  required: {
    color: '#EF4444',
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1F2937',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  textInputMultiline: {
    height: 80,
    textAlignVertical: 'top',
  },
  dateButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  dateText: {
    fontSize: 16,
    color: '#1F2937',
  },
  ageText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  pickerContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  picker: {
    height: 50,
  },
  recommendationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  recommendationText: {
    fontSize: 14,
    color: '#92400E',
    marginLeft: 8,
    fontWeight: '500',
  },
  registerButton: {
    marginBottom: 24,
  },
  registerButtonDisabled: {
    opacity: 0.7,
  },
  registerButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  registerButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0C4A6E',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    color: '#0EA5E9',
    lineHeight: 18,
  },
  bottomSpacing: {
    height: 20,
  },
});

export default RegisterChildScreen;
