import { IconSymbol } from '@/components/ui/IconSymbol';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { createOnboardingRequest } from '@/lib/services/onboardingService';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import { 
  Alert, 
  Dimensions, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView, 
  StatusBar, 
  StyleSheet, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  View 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: screenWidth } = Dimensions.get('window');

type Step = 1 | 2 | 3 | 4;

interface FormData {
  // Step 1 - School Information  
  schoolName: string;
  schoolType: string;
  expectedStudents: string;
  expectedTeachers: string;
  
  // Step 2 - Administrator Details
  adminName: string;
  adminEmail: string;
  adminPhone: string;
  
  // Step 3 - Location & Additional Info
  schoolAddress: string;
  schoolWebsite: string;
  specialPrograms: string;
  additionalNotes: string;
}

export default function SchoolOnboarding() {
  const [step, setStep] = useState<Step>(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Form data
  const [formData, setFormData] = useState<FormData>({
    // Step 1 - School Information  
    schoolName: '',
    schoolType: 'Preschool',
    expectedStudents: '',
    expectedTeachers: '',
    
    // Step 2 - Administrator Details
    adminName: '',
    adminEmail: '',
    adminPhone: '',
    
    // Step 3 - Location & Additional Info
    schoolAddress: '',
    schoolWebsite: '',
    specialPrograms: '',
    additionalNotes: '',
  });

  const updateFormData = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateStep = (currentStep: Step): boolean => {
    const stepErrors: { [key: string]: string } = {};
    
    if (currentStep === 1) {
      // Step 1 - School Information
      if (!formData.schoolName.trim()) {
        stepErrors.schoolName = 'School name is required';
      } else if (formData.schoolName.trim().length < 3) {
        stepErrors.schoolName = 'School name must be at least 3 characters';
      }
      
      if (!formData.schoolType.trim()) {
        stepErrors.schoolType = 'School type is required';
      }
      
      if (!formData.expectedStudents.trim()) {
        stepErrors.expectedStudents = 'Expected number of students is required';
      } else if (isNaN(Number(formData.expectedStudents)) || Number(formData.expectedStudents) < 1) {
        stepErrors.expectedStudents = 'Please enter a valid number greater than 0';
      }
      
      if (formData.expectedTeachers.trim() && (isNaN(Number(formData.expectedTeachers)) || Number(formData.expectedTeachers) < 1)) {
        stepErrors.expectedTeachers = 'Please enter a valid number greater than 0';
      }
    }
    
    if (currentStep === 2) {
      // Step 2 - Administrator Details
      if (!formData.adminName.trim()) {
        stepErrors.adminName = 'Administrator name is required';
      } else if (formData.adminName.trim().length < 2) {
        stepErrors.adminName = 'Administrator name must be at least 2 characters';
      }
      
      if (!formData.adminEmail.trim()) {
        stepErrors.adminEmail = 'Administrator email is required';
      } else {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.adminEmail.trim())) {
          stepErrors.adminEmail = 'Please enter a valid email address';
        }
      }
      
      if (formData.adminPhone.trim()) {
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
        if (!phoneRegex.test(formData.adminPhone.trim().replace(/\s/g, ''))) {
          stepErrors.adminPhone = 'Please enter a valid phone number';
        }
      }
    }
    
    if (currentStep === 3) {
      // Step 3 - Optional validations
      if (formData.schoolWebsite.trim()) {
        const urlRegex = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
        if (!urlRegex.test(formData.schoolWebsite.trim())) {
          stepErrors.schoolWebsite = 'Please enter a valid website URL';
        }
      }
    }
    
    setErrors(stepErrors);
    return Object.keys(stepErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(prev => Math.min(4, prev + 1) as Step);
    }
  };

  const handleBack = () => {
    setStep(prev => Math.max(1, prev - 1) as Step);
  };

  const handleSubmit = async () => {
    // Validate all steps before submission
    const step1Valid = validateStep(1);
    const step2Valid = validateStep(2);
    const step3Valid = validateStep(3);
    
    if (!step1Valid || !step2Valid || !step3Valid) {
      Alert.alert(
        'Incomplete Information', 
        'Please review and complete all required fields.',
        [{ text: 'OK', onPress: () => setStep(1) }]
      );
      return;
    }

    try {
      setSubmitting(true);
      
      const response = await createOnboardingRequest({
        preschoolName: formData.schoolName.trim(),
        adminName: formData.adminName.trim(),
        adminEmail: formData.adminEmail.trim(),
        phone: formData.adminPhone.trim() || undefined,
        address: formData.schoolAddress.trim() || undefined,
        numberOfStudents: formData.expectedStudents.trim(),
        numberOfTeachers: formData.expectedTeachers.trim() || undefined,
        message: [
          formData.schoolWebsite.trim() && `Website: ${formData.schoolWebsite.trim()}`,
          formData.specialPrograms.trim() && `Special Programs: ${formData.specialPrograms.trim()}`,
          formData.additionalNotes.trim() && `Additional Notes: ${formData.additionalNotes.trim()}`
        ].filter(Boolean).join('\n\n') || undefined,
      });
      
      // Show success alert immediately
      Alert.alert(
        '🎉 Request Submitted Successfully!',
        `Thank you for registering ${formData.schoolName.trim()} with EduDash Pro!\n\nYour school registration request has been submitted and is now under review.\n\nYou'll receive an email confirmation at ${formData.adminEmail.trim()} shortly.`,
        [
          {
            text: 'Continue to Sign In',
            onPress: () => {
              setSubmitted(true);
              setStep(4);
            }
          }
        ],
        { cancelable: false }
      );
      
    } catch (error: any) {
      console.error('Onboarding submission error:', error);
      Alert.alert(
        'Submission Failed', 
        error.message || 'Unable to submit your school registration. Please check your connection and try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setSubmitting(false);
    }
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {[1, 2, 3].map((stepNum) => (
        <View key={stepNum} style={styles.stepIndicatorRow}>
          <View
            style={[
              styles.stepDot,
              stepNum <= step && styles.stepDotActive,
              stepNum === step && styles.stepDotCurrent
            ]}
          >
            {stepNum < step ? (
              <IconSymbol name="checkmark" size={12} color="#FFFFFF" />
            ) : (
              <Text style={[styles.stepNumber, stepNum <= step && styles.stepNumberActive]}>
                {stepNum}
              </Text>
            )}
          </View>
          {stepNum < 3 && <View style={[styles.stepLine, stepNum < step && styles.stepLineActive]} />}
        </View>
      ))}
    </View>
  );

  const renderStep1 = () => (
    <View style={styles.stepContent}>
      <View style={styles.stepHeader}>
        <IconSymbol name="building.2" size={32} color="#FFFFFF" />
        <Text style={styles.stepTitle}>School Information</Text>
        <Text style={styles.stepDescription}>Tell us about your educational institution</Text>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>School Name *</Text>
        <View style={[styles.inputContainer, errors.schoolName && styles.inputError]}>
          <IconSymbol name="building.2" size={20} color="#FFFFFF80" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Enter your school name"
            placeholderTextColor="#FFFFFF80"
            value={formData.schoolName}
            onChangeText={(text) => updateFormData('schoolName', text)}
            returnKeyType="next"
          />
        </View>
        {errors.schoolName && <Text style={styles.errorText}>{errors.schoolName}</Text>}
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>School Type *</Text>
        <View style={[styles.inputContainer, errors.schoolType && styles.inputError]}>
          <IconSymbol name="doc.text.fill" size={20} color="#FFFFFF80" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="e.g., Preschool, Kindergarten, Daycare"
            placeholderTextColor="#FFFFFF80"
            value={formData.schoolType}
            onChangeText={(text) => updateFormData('schoolType', text)}
            returnKeyType="next"
          />
        </View>
        {errors.schoolType && <Text style={styles.errorText}>{errors.schoolType}</Text>}
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Expected Number of Students *</Text>
        <View style={[styles.inputContainer, errors.expectedStudents && styles.inputError]}>
          <IconSymbol name="graduationcap.fill" size={20} color="#FFFFFF80" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Number of students you expect to enroll"
            placeholderTextColor="#FFFFFF80"
            value={formData.expectedStudents}
            onChangeText={(text) => updateFormData('expectedStudents', text)}
            keyboardType="number-pad"
            returnKeyType="next"
          />
        </View>
        {errors.expectedStudents && <Text style={styles.errorText}>{errors.expectedStudents}</Text>}
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Expected Number of Teachers</Text>
        <View style={[styles.inputContainer, errors.expectedTeachers && styles.inputError]}>
          <IconSymbol name="person.3.fill" size={20} color="#FFFFFF80" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Number of teachers (optional)"
            placeholderTextColor="#FFFFFF80"
            value={formData.expectedTeachers}
            onChangeText={(text) => updateFormData('expectedTeachers', text)}
            keyboardType="number-pad"
            returnKeyType="done"
          />
        </View>
        {errors.expectedTeachers && <Text style={styles.errorText}>{errors.expectedTeachers}</Text>}
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContent}>
      <View style={styles.stepHeader}>
        <IconSymbol name="person.fill" size={32} color="#FFFFFF" />
        <Text style={styles.stepTitle}>Administrator Details</Text>
        <Text style={styles.stepDescription}>Primary contact information for your school</Text>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Administrator Full Name *</Text>
        <View style={[styles.inputContainer, errors.adminName && styles.inputError]}>
          <IconSymbol name="person.fill" size={20} color="#FFFFFF80" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Full name of the school administrator"
            placeholderTextColor="#FFFFFF80"
            value={formData.adminName}
            onChangeText={(text) => updateFormData('adminName', text)}
            returnKeyType="next"
            autoCapitalize="words"
          />
        </View>
        {errors.adminName && <Text style={styles.errorText}>{errors.adminName}</Text>}
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Administrator Email *</Text>
        <View style={[styles.inputContainer, errors.adminEmail && styles.inputError]}>
          <IconSymbol name="envelope.fill" size={20} color="#FFFFFF80" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="admin@yourschool.com"
            placeholderTextColor="#FFFFFF80"
            value={formData.adminEmail}
            onChangeText={(text) => updateFormData('adminEmail', text)}
            keyboardType="email-address"
            autoCapitalize="none"
            returnKeyType="next"
          />
        </View>
        {errors.adminEmail && <Text style={styles.errorText}>{errors.adminEmail}</Text>}
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Phone Number</Text>
        <View style={[styles.inputContainer, errors.adminPhone && styles.inputError]}>
          <IconSymbol name="phone.fill" size={20} color="#FFFFFF80" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Contact phone number (optional)"
            placeholderTextColor="#FFFFFF80"
            value={formData.adminPhone}
            onChangeText={(text) => updateFormData('adminPhone', text)}
            keyboardType="phone-pad"
            returnKeyType="done"
          />
        </View>
        {errors.adminPhone && <Text style={styles.errorText}>{errors.adminPhone}</Text>}
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContent}>
      <View style={styles.stepHeader}>
        <IconSymbol name="location.fill" size={32} color="#FFFFFF" />
        <Text style={styles.stepTitle}>Additional Information</Text>
        <Text style={styles.stepDescription}>Help us better understand your school</Text>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>School Address</Text>
        <View style={[styles.inputContainer, errors.schoolAddress && styles.inputError]}>
          <IconSymbol name="location.fill" size={20} color="#FFFFFF80" style={styles.inputIcon} />
          <TextInput
            style={[styles.input, styles.multilineInput]}
            placeholder="Full address of your school"
            placeholderTextColor="#FFFFFF80"
            value={formData.schoolAddress}
            onChangeText={(text) => updateFormData('schoolAddress', text)}
            multiline
            numberOfLines={2}
            returnKeyType="next"
          />
        </View>
        {errors.schoolAddress && <Text style={styles.errorText}>{errors.schoolAddress}</Text>}
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>School Website</Text>
        <View style={[styles.inputContainer, errors.schoolWebsite && styles.inputError]}>
          <IconSymbol name="globe" size={20} color="#FFFFFF80" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="https://www.yourschool.com (optional)"
            placeholderTextColor="#FFFFFF80"
            value={formData.schoolWebsite}
            onChangeText={(text) => updateFormData('schoolWebsite', text)}
            keyboardType="url"
            autoCapitalize="none"
            returnKeyType="next"
          />
        </View>
        {errors.schoolWebsite && <Text style={styles.errorText}>{errors.schoolWebsite}</Text>}
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Special Programs</Text>
        <View style={styles.inputContainer}>
          <IconSymbol name="star.fill" size={20} color="#FFFFFF80" style={styles.inputIcon} />
          <TextInput
            style={[styles.input, styles.multilineInput]}
            placeholder="Any special programs, certifications, or unique offerings"
            placeholderTextColor="#FFFFFF80"
            value={formData.specialPrograms}
            onChangeText={(text) => updateFormData('specialPrograms', text)}
            multiline
            numberOfLines={2}
            returnKeyType="next"
          />
        </View>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Additional Notes</Text>
        <View style={styles.inputContainer}>
          <IconSymbol name="doc.text.fill" size={20} color="#FFFFFF80" style={styles.inputIcon} />
          <TextInput
            style={[styles.input, styles.multilineInput]}
            placeholder="Anything else you'd like us to know about your school"
            placeholderTextColor="#FFFFFF80"
            value={formData.additionalNotes}
            onChangeText={(text) => updateFormData('additionalNotes', text)}
            multiline
            numberOfLines={3}
            returnKeyType="done"
          />
        </View>
      </View>
    </View>
  );

  const renderStep4 = () => (
    <View style={styles.successContainer}>
      <IconSymbol name="checkmark.circle.fill" size={80} color="#10B981" />
      <Text style={styles.successTitle}>Request Submitted Successfully!</Text>
      <Text style={styles.successMessage}>
        Thank you for registering {formData.schoolName} with EduDash Pro.{'\n\n'}
        Your school registration request has been submitted and is now under review by our team.{'\n\n'}
        You will receive an email confirmation at {formData.adminEmail} shortly, and we'll notify you once your school has been approved.
      </Text>
      
      <TouchableOpacity style={styles.successButton} onPress={() => router.replace('/(auth)/sign-in')}>
        <IconSymbol name="arrow.right" size={20} color="#FFFFFF" />
        <Text style={styles.successButtonText}>Go to Sign In</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.secondarySuccessButton} onPress={() => router.replace('/')}>
        <Text style={styles.secondarySuccessButtonText}>Back to Home</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#1e3c72', '#2a5298']} style={styles.container}>
        <KeyboardAvoidingView 
          style={styles.flex} 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <SafeAreaView style={styles.flex}>
            <View style={styles.header}>
              <TouchableOpacity 
                style={styles.backButton} 
                onPress={() => step === 1 ? router.back() : handleBack()}
              >
                <IconSymbol name="chevron.left" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <Text style={styles.title}>
                {step === 4 ? 'Registration Complete' : 'Register Your School'}
              </Text>
              {step < 4 && (
                <Text style={styles.stepCounter}>Step {step} of 3</Text>
              )}
            </View>

            <ScrollView 
              contentContainerStyle={styles.scrollContent} 
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {step < 4 && renderStepIndicator()}
              
              {step === 1 && renderStep1()}
              {step === 2 && renderStep2()}
              {step === 3 && renderStep3()}
              {step === 4 && renderStep4()}

              {step < 4 && (
                <View style={styles.actions}>
                  {step < 3 ? (
                    <TouchableOpacity style={styles.primaryButton} onPress={handleNext}>
                      <Text style={styles.primaryButtonText}>Continue</Text>
                      <IconSymbol name="chevron.right" size={20} color="#1e3c72" />
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity 
                      style={[styles.primaryButton, submitting && styles.buttonDisabled]} 
                      onPress={handleSubmit}
                      disabled={submitting}
                    >
                      {submitting ? (
                        <LoadingSpinner size={20} color="#1e3c72" />
                      ) : (
                        <>
                          <IconSymbol name="paperplane.fill" size={20} color="#1e3c72" />
                          <Text style={styles.primaryButtonText}>Submit for Review</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </ScrollView>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  header: {
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 10,
    alignItems: 'center',
  },
  backButton: {
    position: 'absolute',
    left: 20,
    top: 20,
    padding: 8,
    zIndex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 4,
  },
  stepCounter: {
    fontSize: 14,
    color: '#FFFFFF80',
    textAlign: 'center',
  },
  scrollContent: {
    padding: 20,
    paddingTop: 10,
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  stepIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF30',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF30',
  },
  stepDotActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },
  stepDotCurrent: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  stepNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF80',
  },
  stepNumberActive: {
    color: '#1e3c72',
  },
  stepLine: {
    width: 40,
    height: 2,
    backgroundColor: '#FFFFFF30',
    marginHorizontal: 8,
  },
  stepLineActive: {
    backgroundColor: '#FFFFFF',
  },
  stepContent: {
    marginBottom: 30,
  },
  stepHeader: {
    alignItems: 'center',
    marginBottom: 30,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 16,
    color: '#FFFFFF80',
    textAlign: 'center',
    lineHeight: 22,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF20',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#FFFFFF30',
  },
  inputError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  inputIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF',
    minHeight: 20,
  },
  multilineInput: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  errorText: {
    color: '#FCA5A5',
    fontSize: 14,
    marginTop: 6,
    marginLeft: 4,
  },
  actions: {
    marginTop: 20,
    marginBottom: 20,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  primaryButtonText: {
    color: '#1e3c72',
    fontSize: 18,
    fontWeight: 'bold',
  },
  buttonDisabled: {
    backgroundColor: '#FFFFFF80',
    opacity: 0.7,
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 16,
  },
  successMessage: {
    fontSize: 16,
    color: '#FFFFFF90',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
  },
  successButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    gap: 8,
    marginBottom: 16,
    minWidth: 200,
  },
  successButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  secondarySuccessButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  secondarySuccessButtonText: {
    color: '#FFFFFF80',
    fontSize: 16,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
});
