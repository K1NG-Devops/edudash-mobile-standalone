import { IconSymbol } from '@/components/ui/IconSymbol';
import { useAuth } from '@/contexts/SimpleWorkingAuth';
import { supabase } from '@/lib/supabase';
import { useT } from '@/i18n';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const { signIn } = useAuth();
  const params = useLocalSearchParams();
  const { t } = useT();

  // Check for password reset success parameter
  useEffect(() => {
    if (params.passwordReset === 'success') {
      setShowSuccessMessage(true);
      // Auto-hide success message after 5 seconds
      const timer = setTimeout(() => {
        setShowSuccessMessage(false);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [params.passwordReset]);

  const handleSignIn = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert(t('common.error'), t('auth.fillAllFields', {defaultValue: 'Please fill in all fields'}));
      return;
    }

    setLoading(true);
    let navigated = false;
    const safeNavigate = (path: string) => {
      if (navigated) return;
      navigated = true;
      try { router.replace(path as any); } catch { try { router.push(path as any); } catch {} }
    };

    // Absolute safety timeout: never leave the user spinning on web if anything stalls
    const safetyTimer = setTimeout(() => {
      if (!navigated) {
        safeNavigate('/(tabs)/dashboard');
        setLoading(false);
      }
    }, 2500);

    try {
      const result = await signIn(email.trim(), password);
      if (result.error) {
        Alert.alert(t('auth.signInFailed', {defaultValue: 'Sign In Failed'}), result.error);
      } else {
        // After sign-in, decide destination by role and check if password reset is needed
        // Wait briefly for profile to be available to avoid race with auth listener/RLS
        try {
          const { data: userResult } = await supabase.auth.getUser();
          const authUser = userResult.user;
          const authId = authUser?.id;

          // Fast-path: trust JWT/user_metadata for role when DB profile may be blocked by RLS
          const mdRole = (authUser as any)?.user_metadata?.role;
          if (mdRole && String(mdRole).toLowerCase() === 'superadmin') {
            safeNavigate('/screens/super-admin-dashboard');
            return;
          }

          const waitForProfile = async (
            id: string,
            attempts = 8,
            delayMs = 200
          ): Promise<{ role: string; passwordResetRequired: boolean } | null> => {
            for (let i = 0; i < attempts; i++) {
              const { data: profile, error: roleErr } = await supabase
                .from('users')
                .select('role, password_reset_required')
                .eq('auth_user_id', id)
                .maybeSingle();
              if (!roleErr && profile?.role) {
                return {
                  role: profile.role as string,
                  passwordResetRequired: (profile as any)?.password_reset_required || false
                };
              }
              await new Promise((r) => setTimeout(r, delayMs));
            }
            return null;
          };

          if (authId) {
            const profileData = await waitForProfile(authId);

            // Check if user needs to reset their password
            if (profileData?.passwordResetRequired) {
              Alert.alert(
                t('auth.passwordResetRequired'),
                t('auth.passwordResetRequiredMessage'),
                [
                  {
                    text: t('auth.setNewPassword'),
                    onPress: () => safeNavigate('/reset-password')
                  }
                ]
              );
              return;
            }

            if (profileData?.role === 'superadmin') {
              safeNavigate('/screens/super-admin-dashboard');
              return;
            }
          }
        } catch {
          // ignore; fall back below
        }
        // Fallback route for non-superadmin or if lookup fails
        safeNavigate('/(tabs)/dashboard');
      }
    } catch (error) {
      Alert.alert(t('common.error'), t('auth.unexpectedError'));
    } finally {
      clearTimeout(safetyTimer);
      setLoading(false);
    }
  };

  return (
    <>
      <StatusBar barStyle="light-content" translucent />
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
              <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                <IconSymbol name="chevron.left" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <Text style={styles.title}>{t('auth.welcomeBack', {defaultValue: 'Welcome Back'})}</Text>
            </View>

            <View style={styles.content}>
              <Text style={styles.subtitle}>{t('auth.signInSubtitle', { defaultValue: 'Sign in to your EduDash Pro account' })}</Text>

              {/* Success Message Banner */}
              {showSuccessMessage && (
                <View style={styles.successBanner}>
                  <View style={styles.successContent}>
                    <IconSymbol name="checkmark.circle.fill" size={24} color="#10b981" />
                    <View style={styles.successTextContainer}>
                      <Text style={styles.successTitle}>{t('auth.passwordUpdatedTitle', { defaultValue: 'Password Updated! 🎉' })}</Text>
                      <Text style={styles.successMessage}>
                        {t('auth.passwordUpdatedMessage', { defaultValue: 'Your password has been successfully updated. You can now sign in with your new password.' })}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.dismissButton}
                    onPress={() => setShowSuccessMessage(false)}
                  >
                    <IconSymbol name="xmark" size={18} color="#6b7280" />
                  </TouchableOpacity>
                </View>
              )}

              <View style={styles.inputContainer}>
                <IconSymbol name="envelope.fill" size={20} color="#FFFFFF80" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder={t('auth.emailPlaceholder', {defaultValue: 'Email Address'})}
                  placeholderTextColor="#FFFFFF80"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputContainer}>
                <IconSymbol name="lock.fill" size={20} color="#FFFFFF80" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder={t('auth.passwordPlaceholder', {defaultValue: 'Password'})}
                  placeholderTextColor="#FFFFFF80"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword((v) => !v)}>
                  <Text style={styles.toggleText}>{showPassword ? t('auth.hidePassword', { defaultValue: 'Hide' }) : t('auth.showPassword', { defaultValue: 'Show' })}</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.forgotPasswordButton} onPress={() => router.push('/(auth)/forgot-password')}>
                <Text style={styles.forgotPasswordText}>{t('auth.forgotPassword')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleSignIn}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color="#1e3c72" size="small" />
                ) : (
                  <Text style={styles.buttonText}>{t('auth.signIn')}</Text>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.footer}>
              <Text style={styles.linkText}>{t('auth.contactAdminForSetup', {defaultValue: 'Contact your administrator for account setup'})}</Text>
            </View>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </>
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
    paddingTop: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButton: {
    position: 'absolute',
    left: 20,
    top: 20,
    padding: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  subtitle: {
    fontSize: 16,
    color: '#FFFFFF90',
    textAlign: 'center',
    marginBottom: 40,
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
  toggleText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    color: '#FFFFFF90',
    fontSize: 14,
  },
  button: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 10,
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
  footer: {
    paddingBottom: 40,
    alignItems: 'center',
  },
  linkText: {
    textAlign: 'center',
    color: '#FFFFFF90',
    fontSize: 14,
  },
  boldLink: {
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  successBanner: {
    backgroundColor: '#ecfdf5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
    shadowColor: '#10b981',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  successContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  successTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  successTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#047857',
    marginBottom: 4,
  },
  successMessage: {
    fontSize: 14,
    color: '#065f46',
    lineHeight: 20,
  },
  dismissButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    padding: 8,
  },
});
