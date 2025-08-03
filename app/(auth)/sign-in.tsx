import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { AuthConsumer } from '@/contexts/SimpleWorkingAuth';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface SignInState {
  email: string;
  password: string;
  loading: boolean;
  showPassword: boolean;
}

class SignInScreen extends React.Component<{}, SignInState> {
  constructor(props: {}) {
    super(props);
    this.state = {
      email: '',
      password: '',
      loading: false,
      showPassword: false,
    };
  }

  handleSignIn = async (signIn: (email: string, password: string) => Promise<{ error?: string }>) => {
    const { email, password } = this.state;
    
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    this.setState({ loading: true });
    
    try {
      const { error } = await signIn(email.trim(), password);
      
      if (error) {
        Alert.alert('Sign In Failed', error);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.replace('/(tabs)');
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      this.setState({ loading: false });
    }
  };

  renderContent = (auth: any) => {
    const { signIn } = auth;
    const { email, password, loading } = this.state;

    if (loading) {
      return <LoadingSpinner message="Signing you in..." showGradient={true} />;
    }

    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={styles.gradient}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardView}
          >
            <ScrollView 
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Header with Back Button */}
              <View style={styles.headerRow}>
                <TouchableOpacity 
                  style={styles.backButton}
                  onPress={() => router.back()}
                >
                  <Ionicons name="arrow-back" size={24} color="white" />
                </TouchableOpacity>
                <View style={styles.logoContainer}>
                  <Ionicons name="school" size={32} color="white" />
                </View>
                <View style={styles.placeholder} />
              </View>

              <View style={styles.header}>
                <Text style={styles.title}>Welcome Back</Text>
                <Text style={styles.subtitle}>Sign in to continue your educational journey</Text>
              </View>

              {/* Form Card */}
              <View style={styles.formCard}>
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Email Address</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="mail-outline" size={20} color="#64748b" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      value={email}
                      onChangeText={(text) => this.setState({ email: text })}
                      placeholder="Enter your email"
                      placeholderTextColor="#94a3b8"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      editable={!loading}
                    />
                  </View>
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Password</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="lock-closed-outline" size={20} color="#64748b" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      value={password}
                      onChangeText={(text) => this.setState({ password: text })}
                      placeholder="Enter your password"
                      placeholderTextColor="#94a3b8"
                      secureTextEntry={!this.state.showPassword}
                      editable={!loading}
                    />
                    <TouchableOpacity
                      onPress={() => this.setState({ showPassword: !this.state.showPassword })}
                      disabled={loading}
                      style={styles.eyeButton}
                    >
                      <Ionicons name={this.state.showPassword ? 'eye-off' : 'eye'} size={20} color="#64748b" />
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.forgotPasswordButton}
                  onPress={() => router.push('/(auth)/forgot-password')}
                  disabled={loading}
                >
                  <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.signInButton, loading && styles.disabledButton]}
                  onPress={() => this.handleSignIn(signIn)}
                  disabled={loading}
                >
                  <LinearGradient
                    colors={['#667eea', '#764ba2']}
                    style={styles.signInButtonGradient}
                  >
                    {loading ? (
                      <ActivityIndicator color="white" size="small" />
                    ) : (
                      <>
                        <Text style={styles.signInButtonText}>Sign In</Text>
                        <Ionicons name="arrow-forward" size={20} color="white" style={styles.buttonIcon} />
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>or continue with</Text>
                  <View style={styles.dividerLine} />
                </View>

                <TouchableOpacity
                  style={styles.createAccountButton}
                  onPress={() => router.push('/(auth)/sign-up')}
                  disabled={loading}
                >
                  <Text style={styles.createAccountText}>Create New Account</Text>
                  <Ionicons name="person-add-outline" size={20} color="#667eea" style={styles.buttonIcon} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.parentSignupButton}
                  onPress={() => router.push('/(auth)/parent-signup')}
                  disabled={loading}
                >
                  <Text style={styles.parentSignupText}>Join as Parent</Text>
                  <Ionicons name="heart-outline" size={16} color="#64748b" style={styles.parentIcon} />
                </TouchableOpacity>

                {/* Quick Demo Access */}
                <View style={styles.demoSection}>
                  <Text style={styles.demoTitle}>Quick Demo Access</Text>
                  <View style={styles.demoCredentials}>
                    <View style={styles.demoItem}>
                      <Text style={styles.demoLabel}>Principal:</Text>
                      <Text style={styles.demoValue}>admin@school.edu</Text>
                    </View>
                    <View style={styles.demoItem}>
                      <Text style={styles.demoLabel}>Password:</Text>
                      <Text style={styles.demoValue}>demo123</Text>
                    </View>
                  </View>
                </View>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </LinearGradient>
      </SafeAreaView>
    );
  };

  render() {
    return (
      <AuthConsumer>
        {(auth) => this.renderContent(auth)}
      </AuthConsumer>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  gradient: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  
  // Header Section
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
  },
  placeholder: {
    width: 44,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: 'white',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    fontWeight: '400',
  },
  
  // Form Card
  formCard: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 24,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: '#1e293b',
  },
  eyeButton: {
    padding: 4,
  },
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginBottom: 32,
    paddingVertical: 4,
  },
  forgotPasswordText: {
    color: '#667eea',
    fontSize: 14,
    fontWeight: '500',
  },
  signInButton: {
    marginBottom: 24,
    borderRadius: 12,
    shadowColor: '#667eea',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  signInButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  disabledButton: {
    opacity: 0.6,
  },
  signInButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  buttonIcon: {
    marginLeft: 8,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e2e8f0',
  },
  dividerText: {
    color: '#64748b',
    marginHorizontal: 16,
    fontSize: 14,
    fontWeight: '500',
  },
  createAccountButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#667eea',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    marginBottom: 16,
    backgroundColor: 'transparent',
  },
  createAccountText: {
    color: '#667eea',
    fontSize: 16,
    fontWeight: '600',
  },
  parentSignupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginBottom: 24,
  },
  parentSignupText: {
    color: '#64748b',
    fontSize: 16,
    fontWeight: '500',
  },
  parentIcon: {
    marginLeft: 8,
  },
  
  // Demo Section
  demoSection: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  demoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 12,
    textAlign: 'center',
  },
  demoCredentials: {
    gap: 8,
  },
  demoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  demoLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748b',
  },
  demoValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1e293b',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
});

export default SignInScreen;
