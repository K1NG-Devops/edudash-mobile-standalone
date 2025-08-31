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
  Modal,
  Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AuthConsumer, UserProfile } from '@/contexts/SimpleWorkingAuth';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { MobileHeader } from '@/components/navigation/MobileHeader';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import DateTimePicker from '@react-native-community/datetimepicker';
import { profileService, ParentProfileData, ChildProfileData } from '@/lib/services/profileService';

interface ParentProfileFormData {
  // Basic Information
  name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  gender: string;
  id_number: string;
  
  // Address Information
  street_address: string;
  city: string;
  state_province: string;
  postal_code: string;
  country: string;
  
  // Work Information
  position_title: string;
  department: string;
  
  // Emergency Contacts
  emergency_contact_name: string;
  emergency_contact_phone: string;
  emergency_contact_relationship: string;
}

interface ChildProfileFormData {
  id?: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string;
  
  // Medical Information
  allergies: string;
  medical_conditions: string;
  
  // Emergency Contact for Child
  emergency_contact_name: string;
  emergency_contact_phone: string;
  emergency_contact_relation: string;
  
  // Enrollment
  enrollment_date: string;
  is_active: boolean;
}

type FormSection = 'parent' | 'children';

const EnhancedCompleteProfileScreen: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [currentProfile, setCurrentProfile] = useState<UserProfile | null>(null);
  const [activeSection, setActiveSection] = useState<FormSection>('parent');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerField, setDatePickerField] = useState<string>('');
  const [datePickerMode, setDatePickerMode] = useState<'date' | 'time'>('date');
  const [datePickerValue, setDatePickerValue] = useState<Date>(new Date());
  const [selectedChildIndex, setSelectedChildIndex] = useState<number>(-1);
  
  // Parent Profile Form Data
  const [parentFormData, setParentFormData] = useState<ParentProfileFormData>({
    name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    gender: '',
    id_number: '',
    street_address: '',
    city: '',
    state_province: '',
    postal_code: '',
    country: '',
    position_title: '',
    department: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    emergency_contact_relationship: '',
  });

  // Children Profile Form Data
  const [childrenFormData, setChildrenFormData] = useState<ChildProfileFormData[]>([]);

  const updateParentFormData = (field: keyof ParentProfileFormData, value: string) => {
    setParentFormData(prev => ({ ...prev, [field]: value }));
  };

  const updateChildFormData = (index: number, field: keyof ChildProfileFormData, value: any) => {
    setChildrenFormData(prev => {
      const newData = [...prev];
      newData[index] = { ...newData[index], [field]: value };
      return newData;
    });
  };

  const addNewChild = () => {
    const newChild: ChildProfileFormData = {
      first_name: '',
      last_name: '',
      date_of_birth: '',
      gender: '',
      allergies: '',
      medical_conditions: '',
      emergency_contact_name: '',
      emergency_contact_phone: '',
      emergency_contact_relation: '',
      enrollment_date: new Date().toISOString().split('T')[0],
      is_active: true,
    };
    setChildrenFormData(prev => [...prev, newChild]);
  };

  const removeChild = (index: number) => {
    Alert.alert(
      'Remove Child',
      'Are you sure you want to remove this child from your profile?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: () => {
            setChildrenFormData(prev => prev.filter((_, i) => i !== index));
          }
        }
      ]
    );
  };

  const loadUserProfile = async (profile: UserProfile) => {
    setLoading(true);
    try {
      // Get parent's internal ID
      const { data: parentProfile, error: parentError } = await supabase
        .from('users')
        .select('*')
        .eq('auth_user_id', profile.auth_user_id)
        .limit(1)
        .single();

      if (parentError || !parentProfile) {
        throw new Error('Parent profile not found');
      }

      // Pre-fill parent form with existing data
      setParentFormData({
        name: parentProfile.name || '',
        email: parentProfile.email || '',
        phone: parentProfile.phone || '',
        date_of_birth: parentProfile.date_of_birth || '',
        gender: parentProfile.gender || '',
        id_number: parentProfile.id_number || '',
        street_address: parentProfile.street_address || '',
        city: parentProfile.city || '',
        state_province: parentProfile.state_province || '',
        postal_code: parentProfile.postal_code || '',
        country: parentProfile.country || 'South Africa',
        position_title: parentProfile.position_title || '',
        department: parentProfile.department || '',
        emergency_contact_name: parentProfile.emergency_contact_name || '',
        emergency_contact_phone: parentProfile.emergency_contact_phone || '',
        emergency_contact_relationship: parentProfile.emergency_contact_relationship || '',
      });

      // Load children data
      const { data: childrenData, error: childrenError } = await supabase
        .from('students')
        .select('*')
        .eq('parent_id', parentProfile.id)
        .eq('is_active', true);

      if (!childrenError && childrenData) {
        const formattedChildren: ChildProfileFormData[] = childrenData.map(child => ({
          id: child.id,
          first_name: child.first_name || '',
          last_name: child.last_name || '',
          date_of_birth: child.date_of_birth || '',
          gender: child.gender || '',
          allergies: child.allergies || '',
          medical_conditions: child.medical_conditions || '',
          emergency_contact_name: child.emergency_contact_name || '',
          emergency_contact_phone: child.emergency_contact_phone || '',
          emergency_contact_relation: child.emergency_contact_relation || '',
          enrollment_date: child.enrollment_date || new Date().toISOString().split('T')[0],
          is_active: child.is_active ?? true,
        }));
        setChildrenFormData(formattedChildren);
      }

      // If no children exist, add one empty form
      if (!childrenData || childrenData.length === 0) {
        addNewChild();
      }

    } catch (error) {
      console.error('Error loading profile:', error);
      Alert.alert('Error', 'Failed to load profile data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const validateParentForm = () => {
    const requiredFields = ['name', 'email', 'phone', 'street_address'];
    const missingFields = requiredFields.filter(field => 
      !parentFormData[field as keyof ParentProfileFormData]?.trim()
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
    if (!emailRegex.test(parentFormData.email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return false;
    }

    // Validate phone format (basic)
    const phoneRegex = /^[\+]?[1-9][\d]{3,14}$/;
    if (!phoneRegex.test(parentFormData.phone.replace(/\s|-/g, ''))) {
      Alert.alert('Invalid Phone', 'Please enter a valid phone number.');
      return false;
    }

    return true;
  };

  const validateChildrenForms = () => {
    for (let i = 0; i < childrenFormData.length; i++) {
      const child = childrenFormData[i];
      const requiredFields = ['first_name', 'last_name', 'date_of_birth'];
      const missingFields = requiredFields.filter(field => 
        !child[field as keyof ChildProfileFormData]?.toString().trim()
      );

      if (missingFields.length > 0) {
        Alert.alert(
          'Missing Child Information',
          `Child #${i + 1}: Please fill in the following required fields: ${missingFields.join(', ')}`
        );
        return false;
      }
    }
    return true;
  };

  const saveProfile = async (profile: UserProfile) => {
    setSaving(true);
    try {
      // Convert form data to profile service format
      const parentData: ParentProfileData = {
        name: parentFormData.name,
        email: parentFormData.email,
        phone: parentFormData.phone,
        date_of_birth: parentFormData.date_of_birth,
        gender: parentFormData.gender,
        id_number: parentFormData.id_number,
        street_address: parentFormData.street_address,
        city: parentFormData.city,
        state_province: parentFormData.state_province,
        postal_code: parentFormData.postal_code,
        country: parentFormData.country,
        position_title: parentFormData.position_title,
        department: parentFormData.department,
        emergency_contact_name: parentFormData.emergency_contact_name,
        emergency_contact_phone: parentFormData.emergency_contact_phone,
        emergency_contact_relationship: parentFormData.emergency_contact_relationship,
      };

      const childrenData: ChildProfileData[] = childrenFormData.map(child => ({
        id: child.id,
        first_name: child.first_name,
        last_name: child.last_name,
        date_of_birth: child.date_of_birth,
        gender: child.gender,
        allergies: child.allergies,
        medical_conditions: child.medical_conditions,
        emergency_contact_name: child.emergency_contact_name,
        emergency_contact_phone: child.emergency_contact_phone,
        emergency_contact_relation: child.emergency_contact_relation,
        enrollment_date: child.enrollment_date,
        is_active: child.is_active,
      }));

      // Use profile service to save complete profile
      const result = await profileService.updateCompleteProfile(
        profile.auth_user_id,
        parentData,
        childrenData
      );

      if (result.success) {
        Alert.alert(
          'Profile Updated',
          'Your profile and children information have been successfully updated!',
          [
            {
              text: 'OK',
              onPress: () => router.push('/(tabs)/dashboard'),
            },
          ]
        );
      } else {
        Alert.alert(
          'Error',
          result.error || 'Failed to update profile. Please try again.'
        );
      }
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

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate && datePickerField) {
      const dateString = selectedDate.toISOString().split('T')[0];
      
      if (datePickerField.startsWith('parent_')) {
        const field = datePickerField.replace('parent_', '') as keyof ParentProfileFormData;
        updateParentFormData(field, dateString);
      } else if (datePickerField.startsWith('child_')) {
        const parts = datePickerField.split('_');
        const childIndex = parseInt(parts[1]);
        const field = parts.slice(2).join('_') as keyof ChildProfileFormData;
        updateChildFormData(childIndex, field, dateString);
      }
    }
  };

  const showDatePickerModal = (field: string) => {
    let currentValue: Date = new Date();
    
    // Get the current value for the field to set the date picker to the correct date
    if (field.startsWith('parent_')) {
      const fieldName = field.replace('parent_', '') as keyof ParentProfileFormData;
      const dateString = parentFormData[fieldName];
      if (dateString && typeof dateString === 'string') {
        const parsedDate = new Date(dateString);
        if (!isNaN(parsedDate.getTime())) {
          currentValue = parsedDate;
        }
      }
    } else if (field.startsWith('child_')) {
      const parts = field.split('_');
      const childIndex = parseInt(parts[1]);
      const fieldName = parts.slice(2).join('_') as keyof ChildProfileFormData;
      if (childrenFormData[childIndex]) {
        const dateString = childrenFormData[childIndex][fieldName];
        if (dateString && typeof dateString === 'string') {
          const parsedDate = new Date(dateString);
          if (!isNaN(parsedDate.getTime())) {
            currentValue = parsedDate;
          }
        }
      }
    }
    
    setDatePickerValue(currentValue);
    setDatePickerField(field);
    setShowDatePicker(true);
  };

  const renderFormField = (
    label: string,
    value: string,
    onChangeText: (text: string) => void,
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
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
        keyboardType={keyboardType}
        autoCapitalize={keyboardType === 'email-address' ? 'none' : 'sentences'}
      />
    </View>
  );

  const renderDateField = (
    label: string,
    value: string,
    fieldKey: string,
    required: boolean = true
  ) => (
    <View style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>
        {label} {required && <Text style={styles.required}>*</Text>}
      </Text>
      <TouchableOpacity
        style={styles.dateInput}
        onPress={() => showDatePickerModal(fieldKey)}
      >
        <Text style={[styles.dateInputText, !value && styles.dateInputPlaceholder]}>
          {value ? new Date(value).toLocaleDateString() : `Select ${label.toLowerCase()}`}
        </Text>
        <IconSymbol name="calendar" size={20} color="#6B7280" />
      </TouchableOpacity>
    </View>
  );

  const renderPickerField = (
    label: string,
    value: string,
    onChangeText: (text: string) => void,
    options: string[],
    placeholder: string,
    required: boolean = true
  ) => {
    const [showPicker, setShowPicker] = useState(false);

    return (
      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>
          {label} {required && <Text style={styles.required}>*</Text>}
        </Text>
        <TouchableOpacity
          style={styles.pickerInput}
          onPress={() => setShowPicker(true)}
        >
          <Text style={[styles.pickerInputText, !value && styles.pickerInputPlaceholder]}>
            {value || placeholder}
          </Text>
          <IconSymbol name="chevron.down" size={16} color="#6B7280" />
        </TouchableOpacity>
        
        <Modal
          visible={showPicker}
          transparent
          animationType="slide"
          onRequestClose={() => setShowPicker(false)}
        >
          <Pressable style={styles.modalOverlay} onPress={() => setShowPicker(false)}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select {label}</Text>
                <TouchableOpacity onPress={() => setShowPicker(false)}>
                  <IconSymbol name="xmark" size={20} color="#6B7280" />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.optionsList}>
                {options.map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.optionItem,
                      value === option && styles.optionItemSelected
                    ]}
                    onPress={() => {
                      onChangeText(option);
                      setShowPicker(false);
                    }}
                  >
                    <Text style={[
                      styles.optionText,
                      value === option && styles.optionTextSelected
                    ]}>
                      {option}
                    </Text>
                    {value === option && (
                      <IconSymbol name="checkmark" size={16} color="#10B981" />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </Pressable>
        </Modal>
      </View>
    );
  };

  const calculateProfileCompletion = () => {
    const parentRequiredFields = ['name', 'email', 'phone', 'street_address'];
    const parentCompletedFields = parentRequiredFields.filter(field => 
      parentFormData[field as keyof ParentProfileFormData]?.trim()
    ).length;
    
    let childrenCompletedFields = 0;
    let totalChildrenFields = 0;
    
    childrenFormData.forEach(child => {
      const childRequiredFields = ['first_name', 'last_name', 'date_of_birth'];
      totalChildrenFields += childRequiredFields.length;
      childrenCompletedFields += childRequiredFields.filter(field => 
        child[field as keyof ChildProfileFormData]?.toString().trim()
      ).length;
    });
    
    const totalRequired = parentRequiredFields.length + totalChildrenFields;
    const totalCompleted = parentCompletedFields + childrenCompletedFields;
    
    return totalRequired > 0 ? Math.round((totalCompleted / totalRequired) * 100) : 0;
  };

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
          onNotificationsPress={() => { /* TODO: Implement notifications */ }}
          onSignOut={signOut}
          onNavigate={(route) => router.push(route as any)}
          notificationCount={0}
          showBack={true}
          onBack={() => router.back()}
          title="Complete Profile"
        />

        {/* Section Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeSection === 'parent' && styles.activeTab]}
            onPress={() => setActiveSection('parent')}
          >
            <IconSymbol 
              name="person.fill" 
              size={20} 
              color={activeSection === 'parent' ? '#3B82F6' : '#6B7280'} 
            />
            <Text style={[
              styles.tabText, 
              activeSection === 'parent' && styles.activeTabText
            ]}>
              Parent Profile
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, activeSection === 'children' && styles.activeTab]}
            onPress={() => setActiveSection('children')}
          >
            <IconSymbol 
              name="graduationcap.fill" 
              size={20} 
              color={activeSection === 'children' ? '#3B82F6' : '#6B7280'} 
            />
            <Text style={[
              styles.tabText, 
              activeSection === 'children' && styles.activeTabText
            ]}>
              Children ({childrenFormData.length})
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#3B82F6" />
              <Text style={styles.loadingText}>Loading your profile...</Text>
            </View>
          ) : (
            <View style={styles.formContainer}>
              {/* Progress Indicator */}
              <View style={styles.progressContainer}>
                <Text style={styles.progressTitle}>Profile Completion</Text>
                <View style={styles.progressBar}>
                  <View style={[
                    styles.progressFill, 
                    { width: `${calculateProfileCompletion()}%` }
                  ]} />
                </View>
                <Text style={styles.progressText}>
                  {calculateProfileCompletion()}% completed
                </Text>
              </View>

              {activeSection === 'parent' ? (
                // Parent Profile Section
                <>
                  {/* Basic Information */}
                  <View style={styles.sectionContainer}>
                    <Text style={styles.sectionTitle}>📋 Basic Information</Text>
                    
                    {renderFormField(
                      'Full Name', 
                      parentFormData.name, 
                      (text) => updateParentFormData('name', text),
                      'Enter your full name'
                    )}
                    
                    {renderFormField(
                      'Email Address', 
                      parentFormData.email, 
                      (text) => updateParentFormData('email', text),
                      'Enter your email', 
                      true, 
                      false, 
                      'email-address'
                    )}
                    
                    {renderFormField(
                      'Phone Number', 
                      parentFormData.phone, 
                      (text) => updateParentFormData('phone', text),
                      'Enter your phone number', 
                      true, 
                      false, 
                      'phone-pad'
                    )}

                    {renderDateField(
                      'Date of Birth',
                      parentFormData.date_of_birth,
                      'parent_date_of_birth',
                      false
                    )}

                    {renderPickerField(
                      'Gender',
                      parentFormData.gender,
                      (text) => updateParentFormData('gender', text),
                      ['Male', 'Female', 'Other', 'Prefer not to say'],
                      'Select gender',
                      false
                    )}

                    {renderFormField(
                      'ID Number', 
                      parentFormData.id_number, 
                      (text) => updateParentFormData('id_number', text),
                      'Enter your ID number',
                      false
                    )}
                  </View>

                  {/* Address Information */}
                  <View style={styles.sectionContainer}>
                    <Text style={styles.sectionTitle}>🏠 Address Information</Text>
                    
                    {renderFormField(
                      'Street Address', 
                      parentFormData.street_address, 
                      (text) => updateParentFormData('street_address', text),
                      'Enter your street address',
                      true,
                      true
                    )}
                    
                    {renderFormField(
                      'City', 
                      parentFormData.city, 
                      (text) => updateParentFormData('city', text),
                      'Enter your city',
                      false
                    )}
                    
                    {renderFormField(
                      'State/Province', 
                      parentFormData.state_province, 
                      (text) => updateParentFormData('state_province', text),
                      'Enter your state or province',
                      false
                    )}
                    
                    {renderFormField(
                      'Postal Code', 
                      parentFormData.postal_code, 
                      (text) => updateParentFormData('postal_code', text),
                      'Enter your postal code',
                      false
                    )}
                    
                    {renderFormField(
                      'Country', 
                      parentFormData.country, 
                      (text) => updateParentFormData('country', text),
                      'Enter your country',
                      false
                    )}
                  </View>

                  {/* Work Information */}
                  <View style={styles.sectionContainer}>
                    <Text style={styles.sectionTitle}>💼 Work Information (Optional)</Text>
                    <Text style={styles.sectionDescription}>
                      This information helps us understand your schedule and availability
                    </Text>
                    
                    {renderFormField(
                      'Job Title', 
                      parentFormData.position_title, 
                      (text) => updateParentFormData('position_title', text),
                      'Enter your job title',
                      false
                    )}
                    
                    {renderFormField(
                      'Department', 
                      parentFormData.department, 
                      (text) => updateParentFormData('department', text),
                      'Enter your department',
                      false
                    )}
                  </View>

                  {/* Emergency Contact */}
                  <View style={styles.sectionContainer}>
                    <Text style={styles.sectionTitle}>🚨 Emergency Contact</Text>
                    <Text style={styles.sectionDescription}>
                      Provide an emergency contact person in case we need to reach someone other than you
                    </Text>
                    
                    {renderFormField(
                      'Emergency Contact Name', 
                      parentFormData.emergency_contact_name, 
                      (text) => updateParentFormData('emergency_contact_name', text),
                      'Name of emergency contact',
                      false
                    )}
                    
                    {renderFormField(
                      'Emergency Contact Phone', 
                      parentFormData.emergency_contact_phone, 
                      (text) => updateParentFormData('emergency_contact_phone', text),
                      'Emergency contact phone',
                      false,
                      false,
                      'phone-pad'
                    )}
                    
                    {renderFormField(
                      'Relationship to Emergency Contact', 
                      parentFormData.emergency_contact_relationship, 
                      (text) => updateParentFormData('emergency_contact_relationship', text),
                      'e.g., Spouse, Parent, Sibling',
                      false
                    )}
                  </View>
                </>
              ) : (
                // Children Profile Section
                <>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>👶 Children Information</Text>
                    <TouchableOpacity
                      style={styles.addChildButton}
                      onPress={addNewChild}
                    >
                      <IconSymbol name="plus" size={20} color="#3B82F6" />
                      <Text style={styles.addChildButtonText}>Add Child</Text>
                    </TouchableOpacity>
                  </View>

                  {childrenFormData.map((child, index) => (
                    <View key={index} style={styles.childFormContainer}>
                      <View style={styles.childFormHeader}>
                        <Text style={styles.childFormTitle}>
                          Child #{index + 1}
                          {child.first_name && ` - ${child.first_name} ${child.last_name}`}
                        </Text>
                        {childrenFormData.length > 1 && (
                          <TouchableOpacity
                            style={styles.removeChildButton}
                            onPress={() => removeChild(index)}
                          >
                            <IconSymbol name="trash" size={16} color="#EF4444" />
                          </TouchableOpacity>
                        )}
                      </View>

                      {/* Basic Child Info */}
                      <View style={styles.childSection}>
                        <Text style={styles.childSectionTitle}>Basic Information</Text>
                        
                        {renderFormField(
                          'First Name',
                          child.first_name,
                          (text) => updateChildFormData(index, 'first_name', text),
                          'Enter child\'s first name'
                        )}
                        
                        {renderFormField(
                          'Last Name',
                          child.last_name,
                          (text) => updateChildFormData(index, 'last_name', text),
                          'Enter child\'s last name'
                        )}

                        {renderDateField(
                          'Date of Birth',
                          child.date_of_birth,
                          `child_${index}_date_of_birth`
                        )}

                        {renderPickerField(
                          'Gender',
                          child.gender,
                          (text) => updateChildFormData(index, 'gender', text),
                          ['Male', 'Female', 'Other'],
                          'Select gender',
                          false
                        )}
                      </View>

                      {/* Medical Information */}
                      <View style={styles.childSection}>
                        <Text style={styles.childSectionTitle}>Medical Information</Text>
                        
                        {renderFormField(
                          'Allergies',
                          child.allergies,
                          (text) => updateChildFormData(index, 'allergies', text),
                          'List any allergies (food, environmental, etc.)',
                          false,
                          true
                        )}
                        
                        {renderFormField(
                          'Medical Conditions',
                          child.medical_conditions,
                          (text) => updateChildFormData(index, 'medical_conditions', text),
                          'List any medical conditions or medications',
                          false,
                          true
                        )}
                      </View>

                      {/* Emergency Contact for Child */}
                      <View style={styles.childSection}>
                        <Text style={styles.childSectionTitle}>Emergency Contact (if different from parent)</Text>
                        
                        {renderFormField(
                          'Emergency Contact Name',
                          child.emergency_contact_name,
                          (text) => updateChildFormData(index, 'emergency_contact_name', text),
                          'Alternative emergency contact name',
                          false
                        )}
                        
                        {renderFormField(
                          'Emergency Contact Phone',
                          child.emergency_contact_phone,
                          (text) => updateChildFormData(index, 'emergency_contact_phone', text),
                          'Alternative emergency contact phone',
                          false,
                          false,
                          'phone-pad'
                        )}
                        
                        {renderFormField(
                          'Relationship to Child',
                          child.emergency_contact_relation,
                          (text) => updateChildFormData(index, 'emergency_contact_relation', text),
                          'e.g., Grandparent, Aunt, Family Friend',
                          false
                        )}
                      </View>
                    </View>
                  ))}
                </>
              )}

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
                    This information helps teachers and administrators communicate with you about your child&apos;s progress, ensure their safety, and provide appropriate care based on their individual needs.
                  </Text>
                </View>
              </View>

              <View style={styles.bottomSpacing} />
            </View>
          )}
        </ScrollView>

        {/* Date Picker Modal */}
        {showDatePicker && (
          <DateTimePicker
            value={datePickerValue}
            mode={datePickerMode}
            display="default"
            onChange={handleDateChange}
          />
        )}
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  activeTab: {
    backgroundColor: '#EBF4FF',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#3B82F6',
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
  formContainer: {
    marginHorizontal: 20,
    marginTop: 20,
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
  sectionContainer: {
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
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
  addChildButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF4FF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  addChildButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
  },
  childFormContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  childFormHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  childFormTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  removeChildButton: {
    padding: 8,
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
  },
  childSection: {
    marginBottom: 20,
  },
  childSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
    marginBottom: 12,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  required: {
    color: '#EF4444',
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1F2937',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  textInputMultiline: {
    height: 80,
    textAlignVertical: 'top',
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  dateInputText: {
    fontSize: 16,
    color: '#1F2937',
  },
  dateInputPlaceholder: {
    color: '#9CA3AF',
  },
  pickerInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  pickerInputText: {
    fontSize: 16,
    color: '#1F2937',
  },
  pickerInputPlaceholder: {
    color: '#9CA3AF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  optionsList: {
    maxHeight: 400,
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  optionItemSelected: {
    backgroundColor: '#EBF4FF',
  },
  optionText: {
    fontSize: 16,
    color: '#1F2937',
  },
  optionTextSelected: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  saveButton: {
    marginTop: 20,
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

export default EnhancedCompleteProfileScreen;
