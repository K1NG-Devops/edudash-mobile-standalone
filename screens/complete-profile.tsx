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
import { AuthConsumer, UserProfile } from '@/contexts/SimpleWorkingAuth';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { MobileHeader } from '@/components/navigation/MobileHeader';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';

interface ProfileFormData {
  name: string;
  email: string;
  phone: string;
  address: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
}

const CompleteProfileScreen: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [currentProfile, setCurrentProfile] = useState<UserProfile | null>(null);
  const [formData, setFormData] = useState<ProfileFormData>({
    name: '',
    email: '',
    phone: '',
    address: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
  });

  const updateFormData = (field: keyof ProfileFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const loadUserProfile = async (profile: UserProfile) => {
    setLoading(true);
    try {
      // Pre-fill with existing data
      setFormData({
        name: profile.name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        address: profile.address || '',
        emergency_contact_name: profile.emergency_contact_name || '',
        emergency_contact_phone: profile.emergency_contact_phone || '',
      });
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const requiredFields = ['name', 'email', 'phone', 'address'];
    const missingFields = requiredFields.filter(field => 
      !formData[field as keyof ProfileFormData]?.trim()
    );

    if (missingFields.length > 0) {
      Alert.alert(
        'Missing Information',
        `Please fill in the following required fields: ${missingFields.join(', ')}`
      );
      return false;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return false;
    }

    // Validate phone format (basic)
    const phoneRegex = /^[\+]?[1-9][\d]{3,14}$/;
    if (!phoneRegex.test(formData.phone.replace(/\s|-/g, ''))) {
      Alert.alert('Invalid Phone', 'Please enter a valid phone number.');
      return false;
    }

    return true;
  };

  const saveProfile = async (profile: UserProfile) => {
    if (!validateForm()) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({
          name: formData.name.trim(),
          phone: formData.phone.trim(),
          address: formData.address.trim(),
          emergency_contact_name: formData.emergency_contact_name.trim() || null,
          emergency_contact_phone: formData.emergency_contact_phone.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq('auth_user_id', profile.auth_user_id);

      if (error) {
        throw error;
      }

      Alert.alert(
        'Profile Updated',
        'Your profile has been successfully updated!',
        [
          {
            text: 'OK',
            onPress: () => router.push('/(tabs)/dashboard'),
          },
        ]
      );
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert(
        'Error',
        'Failed to update profile. Please try again.'
      );
    } finally {
      setSaving(false);
    }
  };

  const renderFormField = (
    label: string,
    field: keyof ProfileFormData,
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
        value={formData[field]}
        onChangeText={(value) => updateFormData(field, value)}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
        keyboardType={keyboardType}
        autoCapitalize={keyboardType === 'email-address' ? 'none' : 'sentences'}
      />
    </View>
  );

  // Use useEffect at the component level
  useEffect(() => {
    // This will be handled by AuthConsumer
  }, []);

  const ProfileContent = ({ profile, signOut }: { profile: UserProfile | null, signOut: () => void }) => {
    useEffect(() => {
      if (profile && !loading && profile !== currentProfile) {
        setCurrentProfile(profile);
        loadUserProfile(profile);
      }
    }, [profile, loading, currentProfile]);

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
              onNotificationsPress={() => console.log('Notifications')}
              onSearchPress={() => console.log('Search')}
              onSignOut={signOut}
              onNavigate={(route) => router.push(route as any)}
              notificationCount={0}
              showBack={true}
              onBack={() => router.back()}
              title="Complete Profile"
            />

            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
            >
              {/* Header */}
              <View style={styles.headerContainer}>
                <LinearGradient
                  colors={['#EBF4FF', '#DBEAFE']}
                  style={styles.headerGradient}
                >
                  <View style={styles.headerIcon}>
                    <IconSymbol name="person.circle.fill" size={48} color="#3B82F6" />
                  </View>
                  <Text style={styles.headerTitle}>Complete Your Profile</Text>
                  <Text style={styles.headerSubtitle}>
                    Help us connect with you better by providing your contact information
                  </Text>
                </LinearGradient>
              </View>

              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#3B82F6" />
                  <Text style={styles.loadingText}>Loading your profile...</Text>
                </View>
              ) : (
                <View style={styles.formContainer}>
                  {/* Basic Information */}
                  <View style={styles.sectionContainer}>
                    <Text style={styles.sectionTitle}>📋 Basic Information</Text>
                    
                    {renderFormField('Full Name', 'name', 'Enter your full name')}
                    {renderFormField('Email Address', 'email', 'Enter your email', true, false, 'email-address')}
                    {renderFormField('Phone Number', 'phone', 'Enter your phone number', true, false, 'phone-pad')}
                    {renderFormField('Home Address', 'address', 'Enter your home address', true, true)}
                  </View>

                  {/* Emergency Contact */}
                  <View style={styles.sectionContainer}>
                    <Text style={styles.sectionTitle}>🚨 Emergency Contact (Optional)</Text>
                    <Text style={styles.sectionDescription}>
                      Provide an emergency contact person in case we need to reach someone other than you
                    </Text>
                    
                    {renderFormField('Emergency Contact Name', 'emergency_contact_name', 'Name of emergency contact', false)}
                    {renderFormField('Emergency Contact Phone', 'emergency_contact_phone', 'Emergency contact phone', false, false, 'phone-pad')}
                  </View>

                  {/* Progress Indicator */}
                  <View style={styles.progressContainer}>
                    <Text style={styles.progressTitle}>Profile Completion</Text>
                    <View style={styles.progressBar}>
                      <View style={[
                        styles.progressFill, 
                        { width: `${Math.round((Object.values(formData).filter(val => val.trim()).length / 4) * 100)}%` }
                      ]} />
                    </View>
                    <Text style={styles.progressText}>
                      {Object.values(formData).filter(val => val.trim()).length} of 4 required fields completed
                    </Text>
                  </View>

                  {/* Save Button */}
                  <TouchableOpacity
                    style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                    onPress={() => saveProfile(profile!)}
                    disabled={saving}
                  >
                    <LinearGradient
                      colors={saving ? ['#9CA3AF', '#6B7280'] : ['#3B82F6', '#1D4ED8']}
                      style={styles.saveButtonGradient}
                    >
                      {saving ? (
                        <>
                          <ActivityIndicator size="small" color="#FFFFFF" />
                          <Text style={styles.saveButtonText}>Saving...</Text>
                        </>
                      ) : (
                        <>
                          <IconSymbol name="checkmark.circle.fill" size={20} color="#FFFFFF" />
                          <Text style={styles.saveButtonText}>Save Profile</Text>
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>

                  {/* Info Card */}
                  <View style={styles.infoCard}>
                    <IconSymbol name="info.circle.fill" size={24} color="#3B82F6" />
                    <View style={styles.infoContent}>
                      <Text style={styles.infoTitle}>Why do we need this information?</Text>
                      <Text style={styles.infoText}>
                        This information helps teachers and administrators communicate with you about your child&apos;s progress, events, and important announcements.
                      </Text>
                    </View>
                  </View>
                </View>
              )}

              <View style={styles.bottomSpacing} />
            </ScrollView>
          </KeyboardAvoidingView>
    );
  };

  return (
    <AuthConsumer>
      {({ profile, signOut }) => (
        <ProfileContent profile={profile} signOut={signOut} />
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
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
  progressContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#6B7280',
  },
  saveButton: {
    marginBottom: 24,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#EBF4FF',
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
    color: '#1E40AF',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    color: '#3B82F6',
    lineHeight: 18,
  },
  bottomSpacing: {
    height: 20,
  },
});

export default CompleteProfileScreen;
