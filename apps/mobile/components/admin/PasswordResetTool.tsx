import { IconSymbol } from '@/components/ui/IconSymbol';
import { AuthConsumer } from '@/contexts/SimpleWorkingAuth';
import { checkUserExistsAndSendReset } from '@/utils/adminPasswordReset';
import React from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

interface PasswordResetToolState {
  email: string;
  loading: boolean;
  lastSentEmail: string | null;
  lastSentTime: Date | null;
}

export class PasswordResetTool extends React.Component<{}, PasswordResetToolState> {
  state: PasswordResetToolState = {
    email: '',
    loading: false,
    lastSentEmail: null,
    lastSentTime: null,
  };

  private validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  };

  private handleSendReset = async (adminUserId?: string) => {
    const { email } = this.state;
    
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter an email address');
      return;
    }

    if (!this.validateEmail(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    // Check if we just sent to this email (prevent spam)
    if (this.state.lastSentEmail === email.toLowerCase().trim() && 
        this.state.lastSentTime && 
        Date.now() - this.state.lastSentTime.getTime() < 60000) { // 1 minute cooldown
      Alert.alert(
        'Too Soon',
        'Please wait at least 1 minute before sending another reset email to the same address.'
      );
      return;
    }

    this.setState({ loading: true });

    try {
      const result = await checkUserExistsAndSendReset(email.trim(), adminUserId);
      
      if (result.success) {
        this.setState({
          lastSentEmail: email.toLowerCase().trim(),
          lastSentTime: new Date(),
          email: '', // Clear the input
        });
        
        Alert.alert(
          'Reset Email Sent! ✅',
          `Password reset email has been sent to ${email}. The user will receive a link that opens directly in the mobile app.`,
          [{ text: 'OK' }]
        );
      } else {
        let errorMessage = result.error || 'Failed to send reset email';
        
        if (!result.userFound) {
          errorMessage = `User with email "${email}" was not found in the system. Please verify the email address.`;
        } else if (result.error?.includes('inactive')) {
          errorMessage = `User account for "${email}" is inactive. Please activate the account first.`;
        }
        
        Alert.alert('Error', errorMessage);
      }
    } catch (error: any) {
      // Removed debug statement: console.error('Error sending password reset:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      this.setState({ loading: false });
    }
  };

  render() {
    const { email, loading, lastSentEmail, lastSentTime } = this.state;

    return (
      <AuthConsumer>
        {({ profile }) => (
          <View style={styles.container}>
            <View style={styles.header}>
              <IconSymbol name="key.fill" size={24} color="#3B82F6" />
              <Text style={styles.title}>Send Password Reset</Text>
            </View>
            
            <Text style={styles.description}>
              Send a password reset email to any user. The link will open directly in the mobile app.
            </Text>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>User Email Address</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail => this.setState({ email: setEmail })}
                placeholder="Enter user's email address"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
              />
            </View>

            <TouchableOpacity
              style={[styles.sendButton, loading && styles.disabledButton]}
              onPress={() => this.handleSendReset(profile?.auth_user_id)}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <>
                  <IconSymbol name="paperplane.fill" size={18} color="white" />
                  <Text style={styles.sendButtonText}>Send Reset Email</Text>
                </>
              )}
            </TouchableOpacity>

            {lastSentEmail && lastSentTime && (
              <View style={styles.lastSentContainer}>
                <Text style={styles.lastSentText}>
                  ✅ Last sent to: {lastSentEmail}
                </Text>
                <Text style={styles.lastSentTime}>
                  {lastSentTime.toLocaleString()}
                </Text>
              </View>
            )}

            <View style={styles.infoBox}>
              <IconSymbol name="info.circle" size={16} color="#6B7280" />
              <Text style={styles.infoText}>
                The reset link will be valid for 1 hour and will open the mobile app directly.
              </Text>
            </View>
          </View>
        )}
      </AuthConsumer>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 8,
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
    lineHeight: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#F9FAFB',
  },
  sendButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  disabledButton: {
    opacity: 0.6,
  },
  sendButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  lastSentContainer: {
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  lastSentText: {
    fontSize: 14,
    color: '#15803D',
    fontWeight: '500',
  },
  lastSentTime: {
    fontSize: 12,
    color: '#16A34A',
    marginTop: 2,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 12,
    alignItems: 'flex-start',
  },
  infoText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 8,
    flex: 1,
    lineHeight: 16,
  },
});
