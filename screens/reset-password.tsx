import React, { useState, useEffect } from 'react';
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

import { resetPasswordWithToken, isPasswordStrong, getPasswordRequirements } from '@/lib/utils/authUtils';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('reset-password');

interface ResetPasswordProps {
  navigation: any;
  route: any;
}

export default function ResetPassword({ navigation, route }: ResetPasswordProps) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resetComplete, setResetComplete] = useState(false);
  const [errors, setErrors] = useState<{
    newPassword?: string;
    confirmPassword?: string;
    general?: string;
  }>({});

  // Get token and email from route params or URL
  const { token, email } = route.params || {};

  useEffect(() => {
    if (!token || !email) {
      Alert.alert(
        'Invalid Reset Link',
        'This password reset link is invalid or expired. Please request a new one.',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('ForgotPassword'),
          },
        ]
      );
    }
  }, [token, email, navigation]);

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    // Validate new password
    if (!newPassword.trim()) {
      newErrors.newPassword = 'Password is required';
    } else if (!isPasswordStrong(newPassword)) {
      newErrors.newPassword = 'Password does not meet security requirements';
    }

    // Validate confirm password
    if (!confirmPassword.trim()) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleResetPassword = async () => {
    if (!validateForm()) {
      return;
    }

    if (!token || !email) {
      Alert.alert('Error', 'Invalid reset token. Please request a new password reset.');
      return;
    }

    setLoading(true);
    try {
      log.info('🔐 Resetting password for:', email);
      
      const result = await resetPasswordWithToken({
        token,
        newPassword,
        email,
      });
      
      if (result.success) {
        setResetComplete(true);
        log.info('✅ Password reset completed successfully');
      } else {
        setErrors({ general: result.error || 'Failed to reset password' });
        log.error('❌ Failed to reset password:', result.error);
      }
    } catch (error) {
      log.error('❌ Error in password reset:', error);
      setErrors({ general: 'Failed to reset password. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigation.navigate('Login');
  };

  const getPasswordStrengthIndicator = (password: string) => {
    if (!password) return null;

    const checks = [
      { test: password.length >= 8, label: 'At least 8 characters' },
      { test: /[A-Z]/.test(password), label: 'Uppercase letter' },
      { test: /[a-z]/.test(password), label: 'Lowercase letter' },
      { test: /\d/.test(password), label: 'Number' },
      { test: /[!@#$%^&*()_+\-=\[\]{}|;':"\\|,.<>\/?]/.test(password), label: 'Special character' },
    ];

    const passedChecks = checks.filter(check => check.test).length;
    const strength = passedChecks / checks.length;

    let color = '#ef4444';
    let label = 'Weak';

    if (strength >= 0.8) {
      color = '#10b981';
      label = 'Strong';
    } else if (strength >= 0.6) {
      color = '#f59e0b';
      label = 'Medium';
    }

    return (
      <View style={styles.strengthContainer}>
        <View style={styles.strengthBarContainer}>
          <View 
            style={[
              styles.strengthBar, 
              { width: `${strength * 100}%`, backgroundColor: color }
            ]} 
          />
        </View>
        <Text style={[styles.strengthLabel, { color }]}>{label}</Text>
      </View>
    );
  };

  if (resetComplete) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={['#10b981', '#059669']}
          style={styles.header}
        >
          <Text style={styles.headerTitle}>Password Reset Complete!</Text>
          <Text style={styles.headerSubtitle}>Your password has been updated</Text>
        </LinearGradient>

        <ScrollView contentContainerStyle={styles.contentContainer}>
          <View style={styles.successCard}>
            <View style={styles.successIcon}>
              <Ionicons name="checkmark-circle" size={80} color="#10b981" />
            </View>
            
            <Text style={styles.successTitle}>Success!</Text>
            <Text style={styles.successMessage}>
              Your password has been reset successfully. You can now log in with your new password.
            </Text>
            
            <View style={styles.successInfo}>
              <View style={styles.infoItem}>
                <Ionicons name="shield-checkmark" size={20} color="#10b981" />
                <Text style={styles.infoText}>Your account is secure</Text>
              </View>
              <View style={styles.infoItem}>
                <Ionicons name="key" size={20} color="#10b981" />
                <Text style={styles.infoText}>New password is active</Text>
              </View>
              <View style={styles.infoItem}>
                <Ionicons name="time" size={20} color="#10b981" />
                <Text style={styles.infoText}>All sessions have been logged out</Text>
              </View>
            </View>
            
            <Pressable 
              style={styles.loginButton}
              onPress={handleBackToLogin}
            >
              <Ionicons name="log-in" size={20} color="white" />
              <Text style={styles.loginButtonText}>Continue to Login</Text>
            </Pressable>
            
            <View style={styles.securityTips}>
              <Text style={styles.tipsTitle}>🛡️ Security Tips</Text>
              <Text style={styles.tipsText}>
                • Keep your password private and secure{'\n'}
                • Don't share your login credentials{'\n'}
                • Log out from shared devices{'\n'}
                • Contact support if you notice suspicious activity
              </Text>
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
        <Text style={styles.headerTitle}>Reset Password</Text>
        <Text style={styles.headerSubtitle}>Create a new secure password</Text>
      </LinearGradient>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}
      >
        <ScrollView contentContainerStyle={styles.contentContainer}>
          <View style={styles.formCard}>
            <View style={styles.iconContainer}>
              <Ionicons name="lock-closed-outline" size={48} color="#dc2626" />
            </View>
            
            <Text style={styles.formTitle}>Create New Password</Text>
            <Text style={styles.formDescription}>
              {email && (
                <>
                  Resetting password for:{'\n'}
                  <Text style={styles.emailHighlight}>{email}</Text>
                  {'\n\n'}
                </>
              )}
              Choose a strong password that meets our security requirements.
            </Text>
            
            {errors.general && (
              <View style={styles.generalErrorContainer}>
                <Ionicons name="alert-circle" size={20} color="#ef4444" />
                <Text style={styles.generalErrorText}>{errors.general}</Text>
              </View>
            )}
            
            {/* New Password Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>New Password</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={20} color="#6b7280" style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, errors.newPassword && styles.inputError]}
                  placeholder="Enter your new password"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <Pressable 
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeButton}
                >
                  <Ionicons 
                    name={showPassword ? "eye-off" : "eye"} 
                    size={20} 
                    color="#6b7280" 
                  />
                </Pressable>
              </View>
              {errors.newPassword && (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle" size={16} color="#ef4444" />
                  <Text style={styles.errorText}>{errors.newPassword}</Text>
                </View>
              )}
              {newPassword && getPasswordStrengthIndicator(newPassword)}
            </View>
            
            {/* Confirm Password Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Confirm Password</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={20} color="#6b7280" style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, errors.confirmPassword && styles.inputError]}
                  placeholder="Confirm your new password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="done"
                  onSubmitEditing={handleResetPassword}
                />
                <Pressable 
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.eyeButton}
                >
                  <Ionicons 
                    name={showConfirmPassword ? "eye-off" : "eye"} 
                    size={20} 
                    color="#6b7280" 
                  />
                </Pressable>
              </View>
              {errors.confirmPassword && (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle" size={16} color="#ef4444" />
                  <Text style={styles.errorText}>{errors.confirmPassword}</Text>
                </View>
              )}
              {confirmPassword && newPassword === confirmPassword && (
                <View style={styles.successContainer}>
                  <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                  <Text style={styles.successText}>Passwords match</Text>
                </View>
              )}
            </View>
            
            <Pressable 
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleResetPassword}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <Ionicons name="checkmark" size={20} color="white" />
                  <Text style={styles.submitButtonText}>Reset Password</Text>
                </>
              )}
            </Pressable>
            
            <View style={styles.divider} />
            
            <View style={styles.requirementsSection}>
              <Text style={styles.requirementsTitle}>🔒 Password Requirements</Text>
              <Text style={styles.requirementsDescription}>
                Your new password must meet these security requirements:
              </Text>
              {getPasswordRequirements().map((requirement, index) => {
                const isValid = newPassword && (
                  (requirement.includes('8 characters') && newPassword.length >= 8) ||
                  (requirement.includes('uppercase') && /[A-Z]/.test(newPassword)) ||
                  (requirement.includes('lowercase') && /[a-z]/.test(newPassword)) ||
                  (requirement.includes('number') && /\d/.test(newPassword)) ||
                  (requirement.includes('special') && /[!@#$%^&*()_+\-=\[\]{}|;':"\\|,.<>\/?]/.test(newPassword))
                );
                
                return (
                  <View key={index} style={styles.requirementItem}>
                    <Ionicons 
                      name={isValid ? "checkmark-circle" : "checkmark-circle-outline"} 
                      size={16} 
                      color={isValid ? "#10b981" : "#6b7280"} 
                    />
                    <Text style={[
                      styles.requirementText,
                      isValid && styles.requirementTextValid
                    ]}>
                      {requirement}
                    </Text>
                  </View>
                );
              })}
            </View>
            
            <Pressable 
              style={styles.backButton}
              onPress={() => navigation.navigate('ForgotPassword')}
            >
              <Text style={styles.backButtonText}>← Back to Reset Request</Text>
            </Pressable>
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
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
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
    marginBottom: 24,
  },
  emailHighlight: {
    fontWeight: '600',
    color: '#3b82f6',
  },
  generalErrorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    gap: 8,
  },
  generalErrorText: {
    fontSize: 14,
    color: '#dc2626',
    flex: 1,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
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
  eyeButton: {
    padding: 4,
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
  successContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
  },
  successText: {
    fontSize: 14,
    color: '#10b981',
  },
  strengthContainer: {
    marginTop: 8,
  },
  strengthBarContainer: {
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
    overflow: 'hidden',
  },
  strengthBar: {
    height: '100%',
    borderRadius: 2,
  },
  strengthLabel: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'right',
    marginTop: 4,
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
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginBottom: 24,
  },
  requirementsSection: {
    marginBottom: 24,
  },
  requirementsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  requirementsDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  requirementText: {
    fontSize: 14,
    color: '#6b7280',
  },
  requirementTextValid: {
    color: '#10b981',
    fontWeight: '500',
  },
  backButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  backButtonText: {
    fontSize: 16,
    color: '#6b7280',
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
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 12,
  },
  successMessage: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  successInfo: {
    alignSelf: 'stretch',
    gap: 16,
    marginBottom: 32,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoText: {
    fontSize: 16,
    color: '#374151',
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    gap: 8,
    marginBottom: 32,
    alignSelf: 'stretch',
  },
  loginButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  securityTips: {
    alignSelf: 'stretch',
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#166534',
    marginBottom: 8,
  },
  tipsText: {
    fontSize: 14,
    color: '#166534',
    lineHeight: 20,
  },
});
