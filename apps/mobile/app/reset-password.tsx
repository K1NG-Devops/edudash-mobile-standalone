import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [sessionStatus, setSessionStatus] = useState<'loading' | 'valid' | 'invalid'>('loading');
  const params = useLocalSearchParams();

  // Check for recovery token and session on mount
  useEffect(() => {
    const checkSessionAndToken = async () => {
      // Check URL hash for recovery token
      if (typeof window !== 'undefined') {
        const hash = window.location.hash;

        if (hash && hash.includes('access_token') && hash.includes('type=recovery')) {

          // Parse the hash parameters
          const hashParams = new URLSearchParams(hash.substring(1));
          const accessToken = hashParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token');

          if (accessToken && refreshToken) {
            try {
              // Set the session with the tokens
              const { data, error } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken
              });

              if (error) {
                console.error('❌ Error setting session:', error);
                setSessionStatus('invalid');
                return;
              }

              if (data?.session) {
                setSessionStatus('valid');
                return;
              }
            } catch (error) {
              console.error('❌ Exception setting session:', error);
              setSessionStatus('invalid');
              return;
            }
          }
        }
      }

      // Check current session
      try {
        const { data } = await supabase.auth.getSession();
        if (data?.session) {
          setSessionStatus('valid');
        } else {
          setSessionStatus('invalid');
        }
      } catch (error) {
        console.error('❌ Error checking session:', error);
        setSessionStatus('invalid');
      }
    };

    checkSessionAndToken();
  }, []);

  // Real-time validation
  useEffect(() => {
    const errors: string[] = [];

    if (password && password.length < 6) {
      errors.push('Password must be at least 6 characters');
    }

    if (password && confirmPassword && password !== confirmPassword) {
      errors.push('Passwords do not match');
    }

    setValidationErrors(errors);
  }, [password, confirmPassword]);

  const handlePasswordReset = async () => {
    if (!password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      // Check current session first
      const { data, error: sessionError } = await supabase.auth.getSession();
      const session = data?.session;

      if (sessionError) {
        console.error('❌ Session error:', sessionError);
        Alert.alert('Session Error', `Unable to verify session: ${sessionError.message}. Please use the password reset link from your email.`);
        setLoading(false);
        return;
      }

      if (!session) {
        console.error('❌ No active session found');
        Alert.alert(
          'Session Required',
          'No active session found. Please use the password reset link from your email to access this page.',
          [
            {
              text: 'Go Back',
              onPress: () => router.replace('/(auth)/sign-in')
            }
          ]
        );
        setLoading(false);
        return;
      }

      const { data: updateData, error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        console.error('❌ Password update failed:', error);
        Alert.alert('Password Update Failed', `Failed to update password: ${error.message}`);
      } else {

        // Show brief success message then auto-redirect
        Alert.alert(
          'Success! 🎉',
          'Your password has been updated successfully!',
          [
            {
              text: 'Continue to Sign In',
              onPress: () => {
                // Navigate with success parameter
                router.replace('/(auth)/sign-in?passwordReset=success');
              }
            }
          ]
        );

        // Also auto-redirect after 3 seconds if user doesn't click
        setTimeout(() => {
          router.replace('/(auth)/sign-in?passwordReset=success');
        }, 3000);
      }
    } catch (error: any) {
      console.error('❌ Exception in password reset:', error);
      Alert.alert('Error', `An unexpected error occurred: ${error.message || 'Please try again.'}`);
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = password.length >= 6 && password === confirmPassword;

  return (
    <LinearGradient
      colors={['#1e3c72', '#2a5298']}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <SafeAreaView style={styles.flex}>
          <View style={styles.header}>
            <Ionicons name="lock-closed" size={48} color="#FFFFFF" />
            <Text style={styles.title}>Reset Password</Text>
            <Text style={styles.subtitle}>Create your new secure password</Text>
          </View>

          <View style={styles.content}>
            {/* Session Status Indicator */}
            {sessionStatus === 'loading' && (
              <View style={styles.statusContainer}>
                <Text style={styles.statusText}>Verifying password reset link...</Text>
              </View>
            )}

            {sessionStatus === 'invalid' && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={20} color="#ff6b6b" />
                <Text style={styles.errorStatusText}>
                  Invalid or expired password reset link. Please request a new password reset email.
                </Text>
              </View>
            )}

            {sessionStatus === 'valid' && (
              <>
                {/* New Password Input */}
                <View style={styles.inputContainer}>
                  <Ionicons name="lock-closed" size={20} color="#FFFFFF80" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="New Password"
                    placeholderTextColor="#FFFFFF80"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <Ionicons
                      name={showPassword ? "eye-off" : "eye"}
                      size={20}
                      color="#FFFFFF80"
                    />
                  </TouchableOpacity>
                </View>

                {/* Confirm Password Input */}
                <View style={styles.inputContainer}>
                  <Ionicons name="lock-closed" size={20} color="#FFFFFF80" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Confirm New Password"
                    placeholderTextColor="#FFFFFF80"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                    <Ionicons
                      name={showConfirmPassword ? "eye-off" : "eye"}
                      size={20}
                      color="#FFFFFF80"
                    />
                  </TouchableOpacity>
                </View>

                {/* Validation Messages */}
                {validationErrors.length > 0 && (
                  <View style={styles.validationContainer}>
                    {validationErrors.map((error, index) => (
                      <View key={index} style={styles.errorRow}>
                        <Ionicons name="alert-circle" size={16} color="#ff6b6b" />
                        <Text style={styles.errorText}>{error}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Success Indicator */}
                {password.length >= 6 && password === confirmPassword && password && confirmPassword && (
                  <View style={styles.validationContainer}>
                    <View style={styles.successRow}>
                      <Ionicons name="checkmark-circle" size={16} color="#51cf66" />
                      <Text style={styles.successText}>Password is valid!</Text>
                    </View>
                  </View>
                )}

                {/* Update Password Button */}
                <TouchableOpacity
                  style={[styles.button, (loading || !isFormValid) && styles.buttonDisabled]}
                  onPress={handlePasswordReset}
                  disabled={loading || !isFormValid}
                >
                  <Text style={styles.buttonText}>
                    {loading ? 'Updating Password...' : 'Update Password'}
                  </Text>
                </TouchableOpacity>
              </>
            )}

            {/* Back to Sign In */}
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.replace('/(auth)/sign-in')}
            >
              <Text style={styles.backText}>Back to Sign In</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 40,
    paddingHorizontal: 32,
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#FFFFFF90',
    textAlign: 'center',
    marginTop: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    justifyContent: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF20',
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#FFFFFF30',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 50,
    color: '#FFFFFF',
    fontSize: 16,
  },
  button: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonDisabled: {
    backgroundColor: '#FFFFFF80',
  },
  buttonText: {
    color: '#1e3c72',
    fontSize: 18,
    fontWeight: 'bold',
  },
  backButton: {
    alignItems: 'center',
    marginTop: 24,
  },
  backText: {
    color: '#FFFFFF90',
    fontSize: 16,
  },
  validationContainer: {
    marginBottom: 16,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ff6b6b20',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 4,
    borderLeftWidth: 3,
    borderLeftColor: '#ff6b6b',
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 14,
    marginLeft: 8,
    fontWeight: '500',
  },
  successRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#51cf6620',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#51cf66',
  },
  successText: {
    color: '#51cf66',
    fontSize: 14,
    marginLeft: 8,
    fontWeight: '500',
  },
  statusContainer: {
    alignItems: 'center',
    marginBottom: 24,
    paddingVertical: 16,
  },
  statusText: {
    color: '#FFFFFF90',
    fontSize: 16,
    textAlign: 'center',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ff6b6b20',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#ff6b6b',
  },
  errorStatusText: {
    color: '#ff6b6b',
    fontSize: 14,
    marginLeft: 12,
    fontWeight: '500',
    flex: 1,
  },
});
