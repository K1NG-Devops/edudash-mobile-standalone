import React, { useEffect, useState } from 'react';
import {
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { IconSymbol } from '@/components/ui/IconSymbol';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { SchoolConfigurationData, SchoolManagementService } from '@/lib/services/schoolManagementService';

interface SchoolOnboardingProps {
  schoolId: string;
  onComplete: () => void;
}

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
}

const { width: screenWidth } = Dimensions.get('window');

const SchoolOnboardingScreen: React.FC<SchoolOnboardingProps> = ({
  schoolId,
  onComplete,
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [onboardingStatus, setOnboardingStatus] = useState<any>(null);

  // Configuration data
  const [config, setConfig] = useState<SchoolConfigurationData>({
    school_hours: '07:00 - 17:00',
    grade_levels: [],
    curriculum_type: 'montessori',
    academic_year_start: '',
    academic_year_end: '',
    enable_video_calls: true,
    enable_homework_ai: true,
    enable_lesson_generator: true,
    enable_parent_messaging: true,
    welcome_message: '',
  });

  const steps: OnboardingStep[] = [
    {
      id: 'basic_info',
      title: 'Basic Information',
      description: 'Set up your school hours and academic calendar',
      completed: currentStep > 1,
    },
    {
      id: 'curriculum',
      title: 'Curriculum & Programs',
      description: 'Choose your teaching approach and grade levels',
      completed: currentStep > 2,
    },
    {
      id: 'features',
      title: 'Platform Features',
      description: 'Enable features for your school',
      completed: currentStep > 3,
    },
    {
      id: 'customization',
      title: 'Branding & Messages',
      description: 'Customize your school\'s appearance',
      completed: currentStep > 4,
    },
  ];

  useEffect(() => {
    loadOnboardingStatus();
  }, [schoolId]);

  const loadOnboardingStatus = async () => {
    try {
      setLoading(true);
      const result = await SchoolManagementService.getOnboardingStatus(schoolId);

      if (result.success) {
        setOnboardingStatus(result);

        // Set current step based on status
        if (result.status === 'principal_created') {
          setCurrentStep(1);
        } else if (result.status === 'configured') {
          setCurrentStep(4); // Skip to final step
        }
      }
    } catch (error: any) {
      console.error('Error loading onboarding status:', error);
      Alert.alert('Error', 'Failed to load onboarding status');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = async () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    } else {
      await completeOnboarding();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const completeOnboarding = async () => {
    setSaving(true);
    try {
      // Save configuration
      const configResult = await SchoolManagementService.configureSchool(schoolId, config);

      if (!configResult.success) {
        throw new Error(configResult.error || 'Failed to save configuration');
      }

      // Complete onboarding
      const onboardingResult = await SchoolManagementService.completeOnboarding(schoolId);

      if (!onboardingResult.success) {
        throw new Error(onboardingResult.error || 'Failed to complete onboarding');
      }

      Alert.alert(
        'Congratulations! 🎉',
        'Your school setup is complete! You can now start inviting teachers and parents to join your school.',
        [
          {
            text: 'Continue to Dashboard',
            onPress: onComplete,
          },
        ]
      );

    } catch (error: any) {
      console.error('Error completing onboarding:', error);
      Alert.alert('Error', error.message || 'Failed to complete onboarding');
    } finally {
      setSaving(false);
    }
  };

  const updateConfig = (field: keyof SchoolConfigurationData, value: any) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const toggleGradeLevel = (grade: string) => {
    const currentGrades = config.grade_levels || [];
    const newGrades = currentGrades.includes(grade)
      ? currentGrades.filter(g => g !== grade)
      : [...currentGrades, grade];

    updateConfig('grade_levels', newGrades);
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {steps.map((step, index) => (
        <View key={step.id} style={styles.stepItem}>
          <View
            style={[
              styles.stepCircle,
              currentStep > index + 1 && styles.stepCircleCompleted,
              currentStep === index + 1 && styles.stepCircleActive,
            ]}
          >
            {currentStep > index + 1 ? (
              <IconSymbol name="checkmark" size={16} color="white" />
            ) : (
              <Text
                style={[
                  styles.stepNumber,
                  currentStep === index + 1 && styles.stepNumberActive,
                ]}
              >
                {index + 1}
              </Text>
            )}
          </View>
          <Text style={styles.stepLabel}>{step.title}</Text>
        </View>
      ))}
    </View>
  );

  const renderStep1 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>🏫 Basic School Information</Text>
      <Text style={styles.stepDescription}>
        Let's set up your school's basic operating information
      </Text>

      <View style={styles.formSection}>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>School Hours</Text>
          <TextInput
            style={styles.textInput}
            value={config.school_hours}
            onChangeText={(value) => updateConfig('school_hours', value)}
            placeholder="e.g. 07:00 - 17:00"
            placeholderTextColor="#9CA3AF"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Academic Year Start</Text>
          <TextInput
            style={styles.textInput}
            value={config.academic_year_start}
            onChangeText={(value) => updateConfig('academic_year_start', value)}
            placeholder="e.g. January 2024"
            placeholderTextColor="#9CA3AF"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Academic Year End</Text>
          <TextInput
            style={styles.textInput}
            value={config.academic_year_end}
            onChangeText={(value) => updateConfig('academic_year_end', value)}
            placeholder="e.g. December 2024"
            placeholderTextColor="#9CA3AF"
          />
        </View>
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>📚 Curriculum & Programs</Text>
      <Text style={styles.stepDescription}>
        Choose your teaching approach and grade levels
      </Text>

      <View style={styles.formSection}>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Curriculum Type</Text>
          <View style={styles.radioGroup}>
            {[
              { value: 'montessori', label: 'Montessori Method' },
              { value: 'waldorf', label: 'Waldorf/Steiner' },
              { value: 'reggio', label: 'Reggio Emilia' },
              { value: 'traditional', label: 'Traditional Academic' },
              { value: 'play_based', label: 'Play-Based Learning' },
            ].map((option) => (
              <TouchableOpacity
                key={option.value}
                style={styles.radioOption}
                onPress={() => updateConfig('curriculum_type', option.value)}
              >
                <View
                  style={[
                    styles.radioCircle,
                    config.curriculum_type === option.value && styles.radioCircleSelected,
                  ]}
                >
                  {config.curriculum_type === option.value && (
                    <IconSymbol name="checkmark" size={12} color="white" />
                  )}
                </View>
                <Text style={styles.radioLabel}>{option.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Grade Levels (Select all that apply)</Text>
          <View style={styles.checkboxGroup}>
            {[
              'Babies (0-1 year)',
              'Toddlers (1-2 years)',
              'Twos (2-3 years)',
              'Preschool (3-4 years)',
              'Pre-K (4-5 years)',
              'Kindergarten (5-6 years)',
            ].map((grade) => (
              <TouchableOpacity
                key={grade}
                style={styles.checkboxOption}
                onPress={() => toggleGradeLevel(grade)}
              >
                <View
                  style={[
                    styles.checkbox,
                    (config.grade_levels || []).includes(grade) && styles.checkboxSelected,
                  ]}
                >
                  {(config.grade_levels || []).includes(grade) && (
                    <IconSymbol name="checkmark" size={12} color="white" />
                  )}
                </View>
                <Text style={styles.checkboxLabel}>{grade}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>⚡ Platform Features</Text>
      <Text style={styles.stepDescription}>
        Choose which features to enable for your school
      </Text>

      <View style={styles.formSection}>
        {[
          {
            key: 'enable_video_calls',
            title: 'Video Calls',
            description: 'Virtual parent meetings and online classes',
            icon: 'video',
          },
          {
            key: 'enable_homework_ai',
            title: 'AI Homework Assistant',
            description: 'Intelligent homework creation and grading',
            icon: 'brain.head.profile',
          },
          {
            key: 'enable_lesson_generator',
            title: 'AI Lesson Generator',
            description: 'Generate lesson plans with AI assistance',
            icon: 'book.pages',
          },
          {
            key: 'enable_parent_messaging',
            title: 'Parent Messaging',
            description: 'Direct communication with parents',
            icon: 'message',
          },
        ].map((feature) => (
          <TouchableOpacity
            key={feature.key}
            style={styles.featureCard}
            onPress={() => updateConfig(feature.key as keyof SchoolConfigurationData, !config[feature.key as keyof SchoolConfigurationData])}
          >
            <View style={styles.featureIcon}>
              <IconSymbol name={feature.icon as any} size={24} color="#8B5CF6" />
            </View>
            <View style={styles.featureInfo}>
              <Text style={styles.featureTitle}>{feature.title}</Text>
              <Text style={styles.featureDescription}>{feature.description}</Text>
            </View>
            <View
              style={[
                styles.toggle,
                config[feature.key as keyof SchoolConfigurationData] && styles.toggleActive,
              ]}
            >
              <View
                style={[
                  styles.toggleThumb,
                  config[feature.key as keyof SchoolConfigurationData] && styles.toggleThumbActive,
                ]}
              />
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderStep4 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>🎨 Branding & Welcome Message</Text>
      <Text style={styles.stepDescription}>
        Customize your school's appearance and welcome message
      </Text>

      <View style={styles.formSection}>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Welcome Message for Parents</Text>
          <TextInput
            style={[styles.textInput, styles.textInputMultiline]}
            value={config.welcome_message}
            onChangeText={(value) => updateConfig('welcome_message', value)}
            placeholder="Welcome to our school! We're excited to partner with you in your child's educational journey..."
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={4}
          />
        </View>

        <View style={styles.completionInfo}>
          <IconSymbol name="checkmark.circle.fill" size={32} color="#10B981" />
          <Text style={styles.completionTitle}>Almost Done!</Text>
          <Text style={styles.completionText}>
            After completing this setup, you'll be able to:
          </Text>
          <View style={styles.completionList}>
            <Text style={styles.completionItem}>• Invite teachers to your school</Text>
            <Text style={styles.completionItem}>• Generate parent invitation codes</Text>
            <Text style={styles.completionItem}>• Create classes and manage students</Text>
            <Text style={styles.completionItem}>• Access all platform features</Text>
          </View>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return <LoadingSpinner message="Loading school setup..." />;
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>School Setup</Text>
        <Text style={styles.headerSubtitle}>Step {currentStep} of 4</Text>
      </View>

      {renderStepIndicator()}

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
        {currentStep === 4 && renderStep4()}
      </ScrollView>

      <View style={styles.footer}>
        {currentStep > 1 && (
          <TouchableOpacity
            style={[styles.button, styles.buttonSecondary]}
            onPress={handlePrevious}
            disabled={saving}
          >
            <Text style={styles.buttonSecondaryText}>Previous</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.button, styles.buttonPrimary]}
          onPress={handleNext}
          disabled={saving}
        >
          <Text style={styles.buttonPrimaryText}>
            {saving ? 'Saving...' : currentStep === 4 ? 'Complete Setup' : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 4,
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 40,
    paddingVertical: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  stepItem: {
    alignItems: 'center',
    flex: 1,
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
  stepCircleCompleted: {
    backgroundColor: '#10B981',
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
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '500',
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  stepContent: {
    padding: 20,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 24,
  },
  formSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
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
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#111827',
    backgroundColor: 'white',
  },
  textInputMultiline: {
    height: 100,
    textAlignVertical: 'top',
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
  radioCircleSelected: {
    backgroundColor: '#8B5CF6',
    borderColor: '#8B5CF6',
  },
  radioLabel: {
    fontSize: 14,
    color: '#374151',
  },
  checkboxGroup: {
    gap: 12,
  },
  checkboxOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkboxSelected: {
    backgroundColor: '#8B5CF6',
    borderColor: '#8B5CF6',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#374151',
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  featureInfo: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  toggle: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#D1D5DB',
    paddingHorizontal: 2,
    justifyContent: 'center',
  },
  toggleActive: {
    backgroundColor: '#8B5CF6',
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleThumbActive: {
    transform: [{ translateX: 20 }],
  },
  completionInfo: {
    alignItems: 'center',
    paddingTop: 20,
  },
  completionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginTop: 12,
    marginBottom: 8,
  },
  completionText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  completionList: {
    alignSelf: 'stretch',
  },
  completionItem: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 8,
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

export default SchoolOnboardingScreen;
