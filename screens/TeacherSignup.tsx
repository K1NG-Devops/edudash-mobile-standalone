import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { PrincipalService } from '@/lib/services/principalService';
import { InvitationService } from '@/lib/services/invitationService';

interface TeacherSignupProps {
  invitationCode?: string;
}

export default function TeacherSignup({ invitationCode }: TeacherSignupProps) {
  const [step, setStep] = useState<'code' | 'details'>('code');
  const [code, setCode] = useState(invitationCode || '');
  const [invitation, setInvitation] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (invitationCode) {
      handleVerifyCode(invitationCode);
    }
  }, [invitationCode]);

  const handleVerifyCode = async (inviteCode: string = code) => {
    if (!inviteCode.trim()) {
      Alert.alert('Error', 'Please enter an invitation code');
      return;
    }

    setLoading(true);
    try {
      const invitationData = await InvitationService.getInvitationByCode(inviteCode);
      
      if (!invitationData) {
        Alert.alert('Error', 'Invalid or expired invitation code');
        return;
      }

      setInvitation(invitationData);
      setFormData(prev => ({ ...prev, name: invitationData.name || '' }));
      setStep('details');
    } catch (error) {
      console.error('Error verifying code:', error);
      Alert.alert('Error', 'Failed to verify invitation code');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteSignup = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }

    if (!formData.password || formData.password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      // In a real app, you would create an auth account first
      const authUserId = 'temp-auth-id-' + Date.now();
      
      // Use the invitation code to create the teacher account
      await InvitationService.useInvitationCode(
        invitation.code,
        authUserId,
        formData.name,
        formData.phone
      );

      Alert.alert(
        'Welcome! 🎉',
        'Your teacher account has been created successfully. You can now access the teacher dashboard.',
        [
          {
            text: 'Continue',
            onPress: () => {
              // Navigate to teacher dashboard
              console.log('Navigate to teacher dashboard');
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error completing signup:', error);
      Alert.alert('Error', 'Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderCodeVerification = () => (
    <View style={styles.stepContainer}>
      <View style={styles.headerSection}>
        <IconSymbol name="graduationcap.fill" size={60} color="#10B981" />
        <Text style={styles.title}>Join as Teacher</Text>
        <Text style={styles.subtitle}>
          Enter your invitation code to get started
        </Text>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Invitation Code</Text>
        <TextInput
          style={styles.textInput}
          value={code}
          onChangeText={setCode}
          placeholder="Enter 8-digit code"
          placeholderTextColor="#9CA3AF"
          maxLength={8}
          autoCapitalize="characters"
          autoCorrect={false}
        />
      </View>

      <TouchableOpacity
        style={[styles.primaryButton, loading && styles.disabledButton]}
        onPress={() => handleVerifyCode()}
        disabled={loading}
      >
        <LinearGradient
          colors={['#10B981', '#059669']}
          style={styles.buttonGradient}
        >
          <Text style={styles.primaryButtonText}>
            {loading ? 'Verifying...' : 'Verify Code'}
          </Text>
        </LinearGradient>
      </TouchableOpacity>

      <View style={styles.helpSection}>
        <Text style={styles.helpText}>
          Don't have a code? Contact your school administrator.
        </Text>
      </View>
    </View>
  );

  const renderDetailsForm = () => (
    <View style={styles.stepContainer}>
      <View style={styles.headerSection}>
        <IconSymbol name="person.badge.plus" size={60} color="#10B981" />
        <Text style={styles.title}>Welcome to {invitation?.preschool_name || 'EduDash'}!</Text>
        <Text style={styles.subtitle}>
          Complete your profile to get started
        </Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Full Name *</Text>
          <TextInput
            style={styles.textInput}
            value={formData.name}
            onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
            placeholder="Enter your full name"
            placeholderTextColor="#9CA3AF"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Phone Number</Text>
          <TextInput
            style={styles.textInput}
            value={formData.phone}
            onChangeText={(text) => setFormData(prev => ({ ...prev, phone: text }))}
            placeholder="Enter your phone number"
            placeholderTextColor="#9CA3AF"
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Create Password *</Text>
          <TextInput
            style={styles.textInput}
            value={formData.password}
            onChangeText={(text) => setFormData(prev => ({ ...prev, password: text }))}
            placeholder="Enter password (min 6 characters)"
            placeholderTextColor="#9CA3AF"
            secureTextEntry
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Confirm Password *</Text>
          <TextInput
            style={styles.textInput}
            value={formData.confirmPassword}
            onChangeText={(text) => setFormData(prev => ({ ...prev, confirmPassword: text }))}
            placeholder="Confirm your password"
            placeholderTextColor="#9CA3AF"
            secureTextEntry
          />
        </View>
      </View>

      <TouchableOpacity
        style={[styles.primaryButton, loading && styles.disabledButton]}
        onPress={handleCompleteSignup}
        disabled={loading}
      >
        <LinearGradient
          colors={['#10B981', '#059669']}
          style={styles.buttonGradient}
        >
          <Text style={styles.primaryButtonText}>
            {loading ? 'Creating Account...' : 'Complete Setup'}
          </Text>
        </LinearGradient>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={() => setStep('code')}
      >
        <Text style={styles.secondaryButtonText}>Back to Code</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient
        colors={['#F0FDF4', '#DCFCE7']}
        style={styles.background}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {step === 'code' ? renderCodeVerification() : renderDetailsForm()}
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  stepContainer: {
    maxWidth: 400,
    alignSelf: 'center',
    width: '100%',
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1F2937',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  form: {
    marginBottom: 32,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: '#FFFFFF',
    fontWeight: '500',
  },
  primaryButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#10B981',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.5,
  },
  helpSection: {
    marginTop: 24,
    alignItems: 'center',
  },
  helpText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});
