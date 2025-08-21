import React, { useState } from 'react';
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';

import { sendForgotPasswordEmail, isPasswordStrong, getPasswordRequirements } from '@/lib/utils/authUtils';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('forgot-password');

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [errors, setErrors] = useState<{email?: string}>({});

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSendResetEmail = async () => {
    // Clear previous errors
    setErrors({});

    // Validate email
    if (!email.trim()) {
      setErrors({ email: 'Email address is required' });
      return;
    }

    if (!validateEmail(email.trim())) {
      setErrors({ email: 'Please enter a valid email address' });
      return;
    }

    setLoading(true);
    try {
      log.info('🔐 Requesting password reset for:', email);
      
      const result = await sendForgotPasswordEmail(email.trim().toLowerCase());
      
      if (result.success) {
        setEmailSent(true);
        log.info('✅ Password reset email sent successfully');
      } else {
        Alert.alert('Error', result.error || 'Failed to send reset email');
        log.error('❌ Failed to send reset email:', result.error);
      }
    } catch (error) {
      log.error('❌ Error in forgot password flow:', error);
      Alert.alert('Error', 'Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendEmail = () => {
    setEmailSent(false);
    handleSendResetEmail();
  };

  const handleBackToLogin = () => {
    router.replace('/(auth)/sign-in');
  };

  const handleGoHome = () => {
    router.replace('/');
  };

  if (emailSent) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={['#3b82f6', '#1d4ed8']}
          style={styles.header}
        >
          <Pressable 
            style={styles.backButton}
            onPress={handleBackToLogin}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </Pressable>
          <Text style={styles.headerTitle}>Check Your Email</Text>
          <Text style={styles.headerSubtitle}>Password reset instructions sent</Text>
        </LinearGradient>

        <ScrollView contentContainerStyle={styles.contentContainer}>
          <View style={styles.successCard}>
            <View style={styles.successIcon}>
              <Ionicons name="mail-outline" size={64} color="#10b981" />
            </View>
            
            <Text style={styles.successTitle}>Email Sent Successfully!</Text>
            <Text style={styles.successMessage}>
              We've sent password reset instructions to:
            </Text>
            
            <View style={styles.emailBox}>
              <Text style={styles.emailText}>{email}</Text>
            </View>
            
            <Text style={styles.instructionText}>
              Please check your email and follow the instructions to reset your password. 
              The reset link will expire in 1 hour for security.
            </Text>
            
            <View style={styles.checklistContainer}>
              <Text style={styles.checklistTitle}>📋 Next Steps:</Text>
              <View style={styles.checklistItem}>
                <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                <Text style={styles.checklistText}>Check your email inbox</Text>
              </View>
              <View style={styles.checklistItem}>
                <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                <Text style={styles.checklistText}>Look for email from EduDash Pro</Text>
              </View>
              <View style={styles.checklistItem}>
                <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                <Text style={styles.checklistText}>Click the reset password link</Text>
              </View>
              <View style={styles.checklistItem}>
                <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                <Text style={styles.checklistText}>Create your new password</Text>
              </View>
            </View>
            
            <View style={styles.troubleshootContainer}>
              <Text style={styles.troubleshootTitle}>🔍 Don't see the email?</Text>
              <Text style={styles.troubleshootText}>
                • Check your spam/junk folder{'\n'}
                • Make sure the email address is correct{'\n'}
                • Try resending the email
              </Text>
            </View>
            
            <View style={styles.buttonContainer}>
              <Pressable 
                style={styles.resendButton}
                onPress={handleResendEmail}
              >
                <Ionicons name="refresh" size={20} color="#3b82f6" />
                <Text style={styles.resendButtonText}>Resend Email</Text>
              </Pressable>
              
              <Pressable 
                style={styles.backToLoginButton}
                onPress={handleBackToLogin}
              >
                <Text style={styles.backToLoginButtonText}>Back to Login</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#dc2626', '#b91c1c']}
        style={styles.header}
      >
        <Pressable 
          style={styles.backButton}
          onPress={handleBackToLogin}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </Pressable>
        <Text style={styles.headerTitle}>Forgot Password?</Text>
        <Text style={styles.headerSubtitle}>Reset your EduDash Pro password</Text>
      </LinearGradient>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}
      >
        <ScrollView contentContainerStyle={styles.contentContainer}>
          <View style={styles.formCard}>
            <View style={styles.iconContainer}>
              <Ionicons name="key-outline" size={48} color="#dc2626" />
            </View>
            
            <Text style={styles.formTitle}>Reset Your Password</Text>
            <Text style={styles.formDescription}>
              Enter your email address and we'll send you instructions to reset your password.
            </Text>
            
            <View style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <Ionicons name="mail-outline" size={20} color="#6b7280" style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, errors.email && styles.inputError]}
                  placeholder="Enter your email address"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="send"
                  onSubmitEditing={handleSendResetEmail}
                />
              </View>
              {errors.email && (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle" size={16} color="#ef4444" />
                  <Text style={styles.errorText}>{errors.email}</Text>
                </View>
              )}
            </View>
            
            <Pressable 
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleSendResetEmail}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <Ionicons name="send" size={20} color="white" />
                  <Text style={styles.submitButtonText}>Send Reset Email</Text>
                </>
              )}
            </Pressable>
            
            <View style={styles.securityInfo}>
              <View style={styles.securityItem}>
                <Ionicons name="shield-checkmark" size={16} color="#10b981" />
                <Text style={styles.securityText}>Secure password reset process</Text>
              </View>
              <View style={styles.securityItem}>
                <Ionicons name="time-outline" size={16} color="#6b7280" />
                <Text style={styles.securityText}>Reset link expires in 1 hour</Text>
              </View>
              <View style={styles.securityItem}>
                <Ionicons name="lock-closed-outline" size={16} color="#6b7280" />
                <Text style={styles.securityText}>Your account remains secure</Text>
              </View>
            </View>
            
            <View style={styles.divider} />
            
            <View style={styles.helpSection}>
              <Text style={styles.helpTitle}>💡 Password Requirements</Text>
              <Text style={styles.helpText}>
                When you create your new password, make sure it meets these requirements:
              </Text>
              {getPasswordRequirements().map((requirement, index) => (
                <View key={index} style={styles.requirementItem}>
                  <Ionicons name="checkmark-circle-outline" size={14} color="#6b7280" />
                  <Text style={styles.requirementText}>{requirement}</Text>
                </View>
              ))}
            </View>
            
            <View style={styles.supportSection}>
              <Text style={styles.supportTitle}>🆘 Need Help?</Text>
              <Text style={styles.supportText}>
                If you continue to have trouble resetting your password, please contact our support team:
              </Text>
              <View style={styles.contactInfo}>
                <View style={styles.contactItem}>
                  <Ionicons name="mail-outline" size={16} color="#3b82f6" />
                  <Text style={styles.contactText}>support@edudashpro.org.za</Text>
                </View>
                <View style={styles.contactItem}>
                  <Ionicons name="call-outline" size={16} color="#3b82f6" />
                  <Text style={styles.contactText}>+27 67 477 0975</Text>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  keyboardContainer: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 20,
    top: 20,
    zIndex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginTop: 40,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
    textAlign: 'center',
  },
  contentContainer: {
    flexGrow: 1,
    padding: 20,
  },
  formCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  formDescription: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f9fafb',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: '#1f2937',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
  },
  errorText: {
    fontSize: 14,
    color: '#ef4444',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#dc2626',
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
    marginBottom: 24,
  },
  submitButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  securityInfo: {
    marginBottom: 24,
    gap: 12,
  },
  securityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  securityText: {
    fontSize: 14,
    color: '#6b7280',
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 24,
  },
  helpSection: {
    marginBottom: 24,
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  helpText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  requirementText: {
    fontSize: 13,
    color: '#6b7280',
  },
  supportSection: {
    marginBottom: 8,
  },
  supportTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  supportText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  contactInfo: {
    gap: 8,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  contactText: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '500',
  },
  // Success screen styles
  successCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  successIcon: {
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  successMessage: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  emailBox: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#10b981',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  emailText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10b981',
    textAlign: 'center',
  },
  instructionText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  checklistContainer: {
    alignSelf: 'stretch',
    marginBottom: 24,
  },
  checklistTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  checklistText: {
    fontSize: 14,
    color: '#6b7280',
  },
  troubleshootContainer: {
    alignSelf: 'stretch',
    backgroundColor: '#fef3c7',
    borderRadius: 8,
    padding: 16,
    marginBottom: 32,
  },
  troubleshootTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400e',
    marginBottom: 8,
  },
  troubleshootText: {
    fontSize: 13,
    color: '#92400e',
    lineHeight: 18,
  },
  buttonContainer: {
    alignSelf: 'stretch',
    gap: 12,
  },
  resendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#3b82f6',
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
  },
  resendButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3b82f6',
  },
  backToLoginButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    paddingVertical: 14,
  },
  backToLoginButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});
