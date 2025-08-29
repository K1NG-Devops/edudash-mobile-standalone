 
// @ts-nocheck
import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

import { IconSymbol } from '@/components/ui/IconSymbol';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { SuperAdminDataService } from '@/lib/services/superAdminDataService';

interface TeacherPrincipalOnboardingProps {
  userRole: 'superadmin';
  onComplete?: () => void;
}

type Step = 1 | 2 | 3 | 4;

interface SchoolData {
  name: string;
  email: string;
  adminName: string;
  phone: string;
  address: string;
  subscriptionPlan: 'trial' | 'basic' | 'premium';
}

interface PersonalizationData {
  schoolColors: {
    primary: string;
    secondary: string;
  };
  welcomeMessage: string;
  specialFeatures: string[];
}

const TeacherPrincipalOnboarding: React.FC<TeacherPrincipalOnboardingProps> = ({
  userRole,
  onComplete
}) => {
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  
  // Step 1: Basic School Information
  const [schoolData, setSchoolData] = useState<SchoolData>({
    name: '',
    email: '',
    adminName: '',
    phone: '',
    address: '',
    subscriptionPlan: 'trial'
  });

  // Step 2: School Setup Preferences
  const [setupPrefs, setSetupPrefs] = useState({
    generateSampleClasses: true,
    addSampleStudents: true,
    setupNotifications: true,
    enableAiFeatures: true
  });

  // Step 3: Personalization
  const [personalization, setPersonalization] = useState<PersonalizationData>({
    schoolColors: {
      primary: '#8B5CF6',
      secondary: '#3B82F6'
    },
    welcomeMessage: '',
    specialFeatures: []
  });

  // Step 4: Review & Create
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  const validateStep = (step: Step): boolean => {
    const newErrors: {[key: string]: string} = {};

    switch (step) {
      case 1:
        if (!schoolData.name.trim()) newErrors.name = 'School name is required';
        if (!schoolData.email.trim()) newErrors.email = 'Admin email is required';
        if (!schoolData.adminName.trim()) newErrors.adminName = 'Admin name is required';
        if (schoolData.email && !/.+@.+\..+/.test(schoolData.email)) {
          newErrors.email = 'Please enter a valid email';
        }
        break;
      case 2:
        // Setup preferences are optional, no validation needed
        break;
      case 3:
        // Personalization is optional, no validation needed
        break;
      case 4:
        // Final review, validate all critical fields
        if (!schoolData.name.trim() || !schoolData.email.trim() || !schoolData.adminName.trim()) {
          newErrors.general = 'Please complete all required fields in previous steps';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(4, prev + 1) as Step);
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(1, prev - 1) as Step);
  };

  const handleComplete = async () => {
    if (!validateStep(4)) return;

    try {
      setLoading(true);

      // Create the school
      const result = await SuperAdminDataService.createSchool({
        name: schoolData.name,
        email: schoolData.email,
        admin_name: schoolData.adminName,
        subscription_plan: schoolData.subscriptionPlan
      });

      if (result.success) {
        Alert.alert(
          'Success!',
          `School "${schoolData.name}" has been created successfully. The administrator will receive login credentials via email.`,
          [
            {
              text: 'OK',
              onPress: () => {
                onComplete?.();
              }
            }
          ]
        );
      } else {
        Alert.alert('Error', result.error || 'Failed to create school');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create school');
    } finally {
      setLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {[1, 2, 3, 4].map((step) => (
        <View key={step} style={styles.stepIndicatorRow}>
          <View
            style={[
              styles.stepDot,
              step <= currentStep && styles.stepDotActive,
              step === currentStep && styles.stepDotCurrent
            ]}
          >
            {step < currentStep ? (
              <IconSymbol name="checkmark" size={12} color="#FFFFFF" />
            ) : (
              <Text style={[styles.stepNumber, step <= currentStep && styles.stepNumberActive]}>
                {step}
              </Text>
            )}
          </View>
          {step < 4 && <View style={[styles.stepLine, step < currentStep && styles.stepLineActive]} />}
        </View>
      ))}
    </View>
  );

  const renderStep1 = () => (
    <View style={styles.stepContent}>
      <View style={styles.stepHeader}>
        <Text style={styles.stepTitle}>🏫 Basic School Information</Text>
        <Text style={styles.stepDescription}>
          Let's start by setting up your school's basic information
        </Text>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>School Name *</Text>
        <TextInput
          style={[styles.input, errors.name && styles.inputError]}
          value={schoolData.name}
          onChangeText={(text) => setSchoolData(prev => ({ ...prev, name: text }))}
          placeholder="Enter your school name"
          placeholderTextColor="#9CA3AF"
        />
        {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Administrator Name *</Text>
        <TextInput
          style={[styles.input, errors.adminName && styles.inputError]}
          value={schoolData.adminName}
          onChangeText={(text) => setSchoolData(prev => ({ ...prev, adminName: text }))}
          placeholder="Enter administrator's full name"
          placeholderTextColor="#9CA3AF"
        />
        {errors.adminName && <Text style={styles.errorText}>{errors.adminName}</Text>}
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Administrator Email *</Text>
        <TextInput
          style={[styles.input, errors.email && styles.inputError]}
          value={schoolData.email}
          onChangeText={(text) => setSchoolData(prev => ({ ...prev, email: text }))}
          placeholder="Enter admin email address"
          placeholderTextColor="#9CA3AF"
          keyboardType="email-address"
          autoCapitalize="none"
        />
        {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Phone Number (Optional)</Text>
        <TextInput
          style={styles.input}
          value={schoolData.phone}
          onChangeText={(text) => setSchoolData(prev => ({ ...prev, phone: text }))}
          placeholder="Enter phone number"
          placeholderTextColor="#9CA3AF"
          keyboardType="phone-pad"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>School Address (Optional)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={schoolData.address}
          onChangeText={(text) => setSchoolData(prev => ({ ...prev, address: text }))}
          placeholder="Enter school address"
          placeholderTextColor="#9CA3AF"
          multiline
          numberOfLines={3}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Subscription Plan</Text>
        <View style={styles.planSelector}>
          {(['trial', 'basic', 'premium'] as const).map((plan) => (
            <TouchableOpacity
              key={plan}
              style={[
                styles.planOption,
                schoolData.subscriptionPlan === plan && styles.planOptionSelected
              ]}
              onPress={() => setSchoolData(prev => ({ ...prev, subscriptionPlan: plan }))}
            >
              <Text style={[
                styles.planText,
                schoolData.subscriptionPlan === plan && styles.planTextSelected
              ]}>
                {plan.charAt(0).toUpperCase() + plan.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContent}>
      <View style={styles.stepHeader}>
        <Text style={styles.stepTitle}>⚙️ Setup Preferences</Text>
        <Text style={styles.stepDescription}>
          Choose what we should set up automatically for your school
        </Text>
      </View>

      <View style={styles.preferencesContainer}>
        {[
          {
            key: 'generateSampleClasses',
            title: 'Generate Sample Classes',
            description: 'Create example classes like "Butterflies", "Rainbows", etc.',
            icon: 'book.closed'
          },
          {
            key: 'addSampleStudents',
            title: 'Add Sample Students',
            description: 'Add demo students to help you explore features',
            icon: 'graduationcap'
          },
          {
            key: 'setupNotifications',
            title: 'Setup Notifications',
            description: 'Configure push notifications and email alerts',
            icon: 'bell'
          },
          {
            key: 'enableAiFeatures',
            title: 'Enable AI Features',
            description: 'Turn on AI-powered lesson planning and grading',
            icon: 'cpu'
          }
        ].map((pref) => (
          <TouchableOpacity
            key={pref.key}
            style={[
              styles.preferenceCard,
              setupPrefs[pref.key as keyof typeof setupPrefs] && styles.preferenceCardSelected
            ]}
            onPress={() => setSetupPrefs(prev => ({
              ...prev,
              [pref.key]: !prev[pref.key as keyof typeof setupPrefs]
            }))}
          >
            <View style={styles.preferenceHeader}>
              <IconSymbol name={pref.icon as any} size={24} color="#8B5CF6" />
              <View style={styles.preferenceToggle}>
                <View style={[
                  styles.toggleCircle,
                  setupPrefs[pref.key as keyof typeof setupPrefs] && styles.toggleCircleActive
                ]}>
                  {setupPrefs[pref.key as keyof typeof setupPrefs] && (
                    <IconSymbol name="checkmark" size={12} color="#FFFFFF" />
                  )}
                </View>
              </View>
            </View>
            <Text style={styles.preferenceTitle}>{pref.title}</Text>
            <Text style={styles.preferenceDescription}>{pref.description}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContent}>
      <View style={styles.stepHeader}>
        <Text style={styles.stepTitle}>🎨 Personalization</Text>
        <Text style={styles.stepDescription}>
          Make the platform feel like home for your school
        </Text>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Welcome Message</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={personalization.welcomeMessage}
          onChangeText={(text) => setPersonalization(prev => ({ ...prev, welcomeMessage: text }))}
          placeholder="Enter a welcome message for teachers and parents"
          placeholderTextColor="#9CA3AF"
          multiline
          numberOfLines={3}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>School Colors</Text>
        <View style={styles.colorSelector}>
          <View style={styles.colorOption}>
            <Text style={styles.colorLabel}>Primary</Text>
            <View style={[styles.colorPreview, { backgroundColor: personalization.schoolColors.primary }]} />
          </View>
          <View style={styles.colorOption}>
            <Text style={styles.colorLabel}>Secondary</Text>
            <View style={[styles.colorPreview, { backgroundColor: personalization.schoolColors.secondary }]} />
          </View>
        </View>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Special Features</Text>
        <View style={styles.featuresGrid}>
          {[
            'Multi-language Support',
            'Parent Communication Hub',
            'Advanced AI Grading',
            'Custom Report Templates',
            'Video Calling Integration',
            'Mobile App Access'
          ].map((feature) => (
            <TouchableOpacity
              key={feature}
              style={[
                styles.featureChip,
                personalization.specialFeatures.includes(feature) && styles.featureChipSelected
              ]}
              onPress={() => {
                setPersonalization(prev => ({
                  ...prev,
                  specialFeatures: prev.specialFeatures.includes(feature)
                    ? prev.specialFeatures.filter(f => f !== feature)
                    : [...prev.specialFeatures, feature]
                }));
              }}
            >
              <Text style={[
                styles.featureChipText,
                personalization.specialFeatures.includes(feature) && styles.featureChipTextSelected
              ]}>
                {feature}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

  const renderStep4 = () => (
    <View style={styles.stepContent}>
      <View style={styles.stepHeader}>
        <Text style={styles.stepTitle}>✅ Review & Create</Text>
        <Text style={styles.stepDescription}>
          Review your school setup before creating the account
        </Text>
      </View>

      {errors.general && (
        <View style={styles.errorBanner}>
          <IconSymbol name="exclamationmark.triangle" size={20} color="#EF4444" />
          <Text style={styles.errorBannerText}>{errors.general}</Text>
        </View>
      )}

      <View style={styles.reviewSection}>
        <Text style={styles.reviewSectionTitle}>School Information</Text>
        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>Name:</Text>
          <Text style={styles.reviewValue}>{schoolData.name}</Text>
        </View>
        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>Administrator:</Text>
          <Text style={styles.reviewValue}>{schoolData.adminName}</Text>
        </View>
        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>Email:</Text>
          <Text style={styles.reviewValue}>{schoolData.email}</Text>
        </View>
        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>Plan:</Text>
          <Text style={styles.reviewValue}>{schoolData.subscriptionPlan.toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.reviewSection}>
        <Text style={styles.reviewSectionTitle}>Setup Preferences</Text>
        {Object.entries(setupPrefs).map(([key, enabled]) => (
          enabled && (
            <View key={key} style={styles.reviewItem}>
              <IconSymbol name="checkmark.circle" size={16} color="#10B981" />
              <Text style={styles.reviewValue}>
                {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
              </Text>
            </View>
          )
        ))}
      </View>

      {personalization.welcomeMessage && (
        <View style={styles.reviewSection}>
          <Text style={styles.reviewSectionTitle}>Welcome Message</Text>
          <Text style={styles.reviewValue}>{personalization.welcomeMessage}</Text>
        </View>
      )}
    </View>
  );

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <Text style={styles.title}>School Setup Wizard</Text>
        {renderStepIndicator()}
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
        {currentStep === 4 && renderStep4()}
      </ScrollView>

      <View style={styles.actions}>
        {currentStep > 1 && (
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <IconSymbol name="chevron.left" size={16} color="#6B7280" />
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        )}

        {currentStep < 4 ? (
          <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
            <Text style={styles.nextButtonText}>Next</Text>
            <IconSymbol name="chevron.right" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={[styles.completeButton, loading && styles.completeButtonDisabled]} 
            onPress={handleComplete}
            disabled={loading}
          >
            {loading ? (
              <LoadingSpinner size={20} color="#FFFFFF" />
            ) : (
              <>
                <IconSymbol name="plus.app" size={20} color="#FFFFFF" />
                <Text style={styles.completeButtonText}>Create School</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepDotActive: {
    backgroundColor: '#8B5CF6',
  },
  stepDotCurrent: {
    backgroundColor: '#3B82F6',
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#6B7280',
  },
  stepNumberActive: {
    color: '#FFFFFF',
  },
  stepLine: {
    width: 40,
    height: 2,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 8,
  },
  stepLineActive: {
    backgroundColor: '#8B5CF6',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  stepContent: {
    flex: 1,
  },
  stepHeader: {
    marginBottom: 24,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 22,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: '#FFFFFF',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    marginTop: 4,
  },
  planSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  planOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  planOptionSelected: {
    borderColor: '#8B5CF6',
    backgroundColor: '#F3F4F6',
  },
  planText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  planTextSelected: {
    color: '#8B5CF6',
    fontWeight: '600',
  },
  preferencesContainer: {
    gap: 12,
  },
  preferenceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  preferenceCardSelected: {
    borderColor: '#8B5CF6',
    backgroundColor: '#F8F4FF',
  },
  preferenceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  preferenceToggle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleCircleActive: {
    backgroundColor: '#10B981',
  },
  preferenceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  preferenceDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 18,
  },
  colorSelector: {
    flexDirection: 'row',
    gap: 16,
  },
  colorOption: {
    alignItems: 'center',
    gap: 8,
  },
  colorLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  colorPreview: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  featureChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
  },
  featureChipSelected: {
    borderColor: '#8B5CF6',
    backgroundColor: '#8B5CF6',
  },
  featureChipText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  featureChipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  reviewSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  reviewSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  reviewItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  reviewLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
    minWidth: 80,
  },
  reviewValue: {
    fontSize: 14,
    color: '#1F2937',
    flex: 1,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  errorBannerText: {
    fontSize: 14,
    color: '#DC2626',
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 6,
  },
  backButtonText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  nextButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  completeButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  completeButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

export default TeacherPrincipalOnboarding;
