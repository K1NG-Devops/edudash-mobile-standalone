import React, { useState } from 'react';
import {
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { IconSymbol } from '@/components/ui/IconSymbol';
import { CreateSchoolData, SchoolManagementService } from '@/lib/services/schoolManagementService';

interface CreateSchoolModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (schoolId: string) => void;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const CreateSchoolModal: React.FC<CreateSchoolModalProps> = ({
  visible,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState<CreateSchoolData>({
    name: '',
    email: '',
    phone: '',
    address: '',
    timezone: 'Africa/Johannesburg',
    subscription_plan: 'free',
    principal_name: '',
    principal_email: '',
    principal_phone: '',
  });

  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'School name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'School email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.address?.trim()) {
      newErrors.address = 'School address is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.principal_name.trim()) {
      newErrors.principal_name = 'Principal name is required';
    }

    if (!formData.principal_email.trim()) {
      newErrors.principal_email = 'Principal email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.principal_email)) {
      newErrors.principal_email = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2);
    } else if (currentStep === 2 && validateStep2()) {
      setCurrentStep(3);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep2()) {
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const result = await SchoolManagementService.createSchool(formData);

      if (result.success && result.school_id) {
        Alert.alert(
          'School Created Successfully! 🎉',
          `${formData.name} has been created successfully. An invitation has been sent to ${formData.principal_email} to complete the setup.`,
          [
            {
              text: 'OK',
              onPress: () => {
                onSuccess(result.school_id!);
                handleClose();
              },
            },
          ]
        );
      } else {
        Alert.alert('Error', result.error || 'Failed to create school');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: '',
      timezone: 'Africa/Johannesburg',
      subscription_plan: 'free',
      principal_name: '',
      principal_email: '',
      principal_phone: '',
    });
    setCurrentStep(1);
    setErrors({});
    setLoading(false);
    onClose();
  };

  const updateFormData = (field: keyof CreateSchoolData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {[1, 2, 3].map((step) => (
        <View key={step} style={styles.stepItem}>
          <View
            style={[
              styles.stepCircle,
              currentStep >= step && styles.stepCircleActive,
            ]}
          >
            <Text
              style={[
                styles.stepNumber,
                currentStep >= step && styles.stepNumberActive,
              ]}
            >
              {step}
            </Text>
          </View>
          <Text style={styles.stepLabel}>
            {step === 1 ? 'School Info' : step === 2 ? 'Principal' : 'Review'}
          </Text>
        </View>
      ))}
    </View>
  );

  const renderStep1 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>School Information</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>School Name *</Text>
        <TextInput
          style={[styles.textInput, errors.name && styles.textInputError]}
          value={formData.name}
          onChangeText={(value) => updateFormData('name', value)}
          placeholder="e.g. Little Stars Preschool"
          placeholderTextColor="#9CA3AF"
        />
        {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>School Email *</Text>
        <TextInput
          style={[styles.textInput, errors.email && styles.textInputError]}
          value={formData.email}
          onChangeText={(value) => updateFormData('email', value)}
          placeholder="admin@littlestars.co.za"
          placeholderTextColor="#9CA3AF"
          keyboardType="email-address"
          autoCapitalize="none"
        />
        {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Phone Number</Text>
        <TextInput
          style={styles.textInput}
          value={formData.phone}
          onChangeText={(value) => updateFormData('phone', value)}
          placeholder="+27 11 123 4567"
          placeholderTextColor="#9CA3AF"
          keyboardType="phone-pad"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Address *</Text>
        <TextInput
          style={[
            styles.textInput,
            styles.textInputMultiline,
            errors.address && styles.textInputError,
          ]}
          value={formData.address}
          onChangeText={(value) => updateFormData('address', value)}
          placeholder="123 Main Street, Johannesburg, 2000"
          placeholderTextColor="#9CA3AF"
          multiline
          numberOfLines={3}
        />
        {errors.address && <Text style={styles.errorText}>{errors.address}</Text>}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Subscription Plan</Text>
        <View style={styles.radioGroup}>
          {[
            { value: 'free', label: 'Free (20 students, 2 teachers)', color: '#6B7280' },
            { value: 'basic', label: 'Basic (50 students, 5 teachers)', color: '#3B82F6' },
            { value: 'pro', label: 'Pro (150 students, 15 teachers)', color: '#8B5CF6' },
            { value: 'enterprise', label: 'Enterprise (1000+ students)', color: '#F59E0B' },
          ].map((plan) => (
            <TouchableOpacity
              key={plan.value}
              style={styles.radioOption}
              onPress={() => updateFormData('subscription_plan', plan.value)}
            >
              <View
                style={[
                  styles.radioCircle,
                  formData.subscription_plan === plan.value && {
                    backgroundColor: plan.color,
                  },
                ]}
              >
                {formData.subscription_plan === plan.value && (
                  <IconSymbol name="checkmark" size={12} color="white" />
                )}
              </View>
              <Text style={styles.radioLabel}>{plan.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Principal Information</Text>
      <Text style={styles.stepSubtitle}>
        We'll send an invitation to the principal to complete the school setup.
      </Text>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Principal Full Name *</Text>
        <TextInput
          style={[styles.textInput, errors.principal_name && styles.textInputError]}
          value={formData.principal_name}
          onChangeText={(value) => updateFormData('principal_name', value)}
          placeholder="e.g. Sarah Johnson"
          placeholderTextColor="#9CA3AF"
        />
        {errors.principal_name && <Text style={styles.errorText}>{errors.principal_name}</Text>}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Principal Email *</Text>
        <TextInput
          style={[styles.textInput, errors.principal_email && styles.textInputError]}
          value={formData.principal_email}
          onChangeText={(value) => updateFormData('principal_email', value)}
          placeholder="sarah@littlestars.co.za"
          placeholderTextColor="#9CA3AF"
          keyboardType="email-address"
          autoCapitalize="none"
        />
        {errors.principal_email && <Text style={styles.errorText}>{errors.principal_email}</Text>}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Principal Phone</Text>
        <TextInput
          style={styles.textInput}
          value={formData.principal_phone}
          onChangeText={(value) => updateFormData('principal_phone', value)}
          placeholder="+27 82 123 4567"
          placeholderTextColor="#9CA3AF"
          keyboardType="phone-pad"
        />
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Review & Create</Text>
      <Text style={styles.stepSubtitle}>
        Please review the information before creating the school.
      </Text>

      <View style={styles.reviewSection}>
        <Text style={styles.reviewSectionTitle}>🏫 School Details</Text>
        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>Name:</Text>
          <Text style={styles.reviewValue}>{formData.name}</Text>
        </View>
        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>Email:</Text>
          <Text style={styles.reviewValue}>{formData.email}</Text>
        </View>
        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>Phone:</Text>
          <Text style={styles.reviewValue}>{formData.phone || 'Not provided'}</Text>
        </View>
        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>Address:</Text>
          <Text style={styles.reviewValue}>{formData.address}</Text>
        </View>
        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>Plan:</Text>
          <Text style={[styles.reviewValue, styles.planBadge]}>
            {formData.subscription_plan.toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.reviewSection}>
        <Text style={styles.reviewSectionTitle}>👤 Principal Details</Text>
        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>Name:</Text>
          <Text style={styles.reviewValue}>{formData.principal_name}</Text>
        </View>
        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>Email:</Text>
          <Text style={styles.reviewValue}>{formData.principal_email}</Text>
        </View>
        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>Phone:</Text>
          <Text style={styles.reviewValue}>{formData.principal_phone || 'Not provided'}</Text>
        </View>
      </View>

      <View style={styles.infoBox}>
        <IconSymbol name="info.circle" size={20} color="#3B82F6" />
        <Text style={styles.infoText}>
          After creation, an invitation email will be sent to the principal to complete the school setup and onboarding process.
        </Text>
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <IconSymbol name="xmark" size={24} color="#6B7280" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create New School</Text>
          <View style={styles.placeholder} />
        </View>

        {renderStepIndicator()}

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
        </ScrollView>

        <View style={styles.footer}>
          {currentStep > 1 && (
            <TouchableOpacity
              style={[styles.button, styles.buttonSecondary]}
              onPress={handlePrevious}
              disabled={loading}
            >
              <Text style={styles.buttonSecondaryText}>Previous</Text>
            </TouchableOpacity>
          )}

          {currentStep < 3 ? (
            <TouchableOpacity
              style={[styles.button, styles.buttonPrimary]}
              onPress={handleNext}
              disabled={loading}
            >
              <Text style={styles.buttonPrimaryText}>Next</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.button, styles.buttonPrimary]}
              onPress={handleSubmit}
              disabled={loading}
            >
              <Text style={styles.buttonPrimaryText}>
                {loading ? 'Creating...' : 'Create School'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  closeButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  placeholder: {
    width: 32,
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  stepItem: {
    alignItems: 'center',
    marginHorizontal: 20,
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  stepCircleActive: {
    backgroundColor: '#8B5CF6',
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  stepNumberActive: {
    color: 'white',
  },
  stepLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  stepContent: {
    paddingVertical: 20,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
    backgroundColor: 'white',
  },
  textInputMultiline: {
    height: 80,
    textAlignVertical: 'top',
  },
  textInputError: {
    borderColor: '#EF4444',
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
  },
  radioGroup: {
    gap: 12,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  radioLabel: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  reviewSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  reviewSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  reviewItem: {
    flexDirection: 'row',
    paddingVertical: 6,
  },
  reviewLabel: {
    fontSize: 14,
    color: '#6B7280',
    width: 80,
    fontWeight: '500',
  },
  reviewValue: {
    fontSize: 14,
    color: '#111827',
    flex: 1,
  },
  planBadge: {
    fontWeight: '600',
    color: '#8B5CF6',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#EBF8FF',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#1E40AF',
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPrimary: {
    backgroundColor: '#8B5CF6',
  },
  buttonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  buttonPrimaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  buttonSecondaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
});

export default CreateSchoolModal;
