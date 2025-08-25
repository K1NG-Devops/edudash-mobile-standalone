import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { DesignSystem } from '@/constants/DesignSystem';
import { useSubscription } from '@/lib/hooks/useSubscription';

export default function PaymentSuccessPage() {
  const { refreshSubscription, subscription } = useSubscription();
  const [loading, setLoading] = useState(true);
  const [animationValue] = useState(new Animated.Value(0));
  const searchParams = useLocalSearchParams();

  // Extract payment details from URL parameters
  const paymentId = searchParams.payment_id as string;
  const subscriptionId = searchParams.subscription_id as string;
  const planName = searchParams.plan_name as string;
  const amount = searchParams.amount as string;

  useEffect(() => {
    // Start success animation
    Animated.sequence([
      Animated.timing(animationValue, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(animationValue, {
        toValue: 0.8,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(animationValue, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    // Refresh subscription data
    const refreshData = async () => {
      try {
        await refreshSubscription();
        setLoading(false);
      } catch (error) {
        console.error('Error refreshing subscription:', error);
        setLoading(false);
      }
    };

    // Small delay to allow for webhook processing
    const timeout = setTimeout(refreshData, 2000);
    return () => clearTimeout(timeout);
  }, [refreshSubscription, animationValue]);

  const handleContinue = () => {
    // Navigate to the main app or dashboard
    router.replace('/(dashboard)');
  };

  const handleViewSubscription = () => {
    router.push('/(dashboard)/account/subscription');
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={DesignSystem.gradients.hero}
        style={styles.background}
      >
        <SafeAreaView style={styles.safeArea}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {/* Success Animation */}
            <Animated.View 
              style={[
                styles.successIconContainer,
                {
                  transform: [{ scale: animationValue }]
                }
              ]}
            >
              <View style={styles.successIcon}>
                <IconSymbol name="checkmark.circle.fill" size={80} color="#10b981" />
              </View>
            </Animated.View>

            {/* Success Message */}
            <View style={styles.messageContainer}>
              <Text style={styles.successTitle}>Payment Successful!</Text>
              <Text style={styles.successSubtitle}>
                Welcome to EduDash Pro! Your subscription is now active.
              </Text>
            </View>

            {/* Payment Details */}
            {(paymentId || subscriptionId || planName || amount) && (
              <View style={styles.detailsContainer}>
                <Text style={styles.detailsTitle}>Payment Details</Text>
                
                {planName && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Plan:</Text>
                    <Text style={styles.detailValue}>{planName}</Text>
                  </View>
                )}
                
                {amount && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Amount:</Text>
                    <Text style={styles.detailValue}>R{amount}</Text>
                  </View>
                )}
                
                {paymentId && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Payment ID:</Text>
                    <Text style={styles.detailValue}>{paymentId}</Text>
                  </View>
                )}
                
                {subscriptionId && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Subscription ID:</Text>
                    <Text style={styles.detailValue}>{subscriptionId}</Text>
                  </View>
                )}
              </View>
            )}

            {/* Subscription Information */}
            {subscription && !loading && (
              <View style={styles.subscriptionContainer}>
                <Text style={styles.subscriptionTitle}>Your Subscription</Text>
                <View style={styles.subscriptionCard}>
                  <View style={styles.subscriptionHeader}>
                    <Text style={styles.subscriptionPlan}>
                      {subscription.plan?.name || 'Active Plan'}
                    </Text>
                    <View style={[
                      styles.statusBadge,
                      subscription.status === 'trial' && styles.trialBadge,
                      subscription.status === 'active' && styles.activeBadge
                    ]}>
                      <Text style={styles.statusText}>
                        {subscription.status === 'trial' ? 'FREE TRIAL' : 'ACTIVE'}
                      </Text>
                    </View>
                  </View>
                  
                  {subscription.trial_end && subscription.status === 'trial' && (
                    <Text style={styles.trialInfo}>
                      Free trial until {new Date(subscription.trial_end).toLocaleDateString()}
                    </Text>
                  )}
                  
                  <Text style={styles.billingInfo}>
                    Next billing: {new Date(subscription.current_period_end).toLocaleDateString()}
                  </Text>
                </View>
              </View>
            )}

            {/* Next Steps */}
            <View style={styles.nextStepsContainer}>
              <Text style={styles.nextStepsTitle}>What's Next?</Text>
              <View style={styles.stepsList}>
                <View style={styles.stepItem}>
                  <IconSymbol name="1.circle.fill" size={20} color="#00f5ff" />
                  <Text style={styles.stepText}>
                    Explore your AI-powered lessons and features
                  </Text>
                </View>
                <View style={styles.stepItem}>
                  <IconSymbol name="2.circle.fill" size={20} color="#00f5ff" />
                  <Text style={styles.stepText}>
                    Set up your students and learning goals
                  </Text>
                </View>
                <View style={styles.stepItem}>
                  <IconSymbol name="3.circle.fill" size={20} color="#00f5ff" />
                  <Text style={styles.stepText}>
                    Start creating personalized learning experiences
                  </Text>
                </View>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.buttonsContainer}>
              <TouchableOpacity 
                style={styles.primaryButton}
                onPress={handleContinue}
              >
                <LinearGradient
                  colors={DesignSystem.gradients.primary}
                  style={styles.buttonGradient}
                >
                  <Text style={styles.primaryButtonText}>
                    Start Learning
                  </Text>
                  <IconSymbol name="arrow.right" size={20} color="#000000" />
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.secondaryButton}
                onPress={handleViewSubscription}
              >
                <Text style={styles.secondaryButtonText}>
                  View Subscription Details
                </Text>
              </TouchableOpacity>
            </View>

            {/* Support Information */}
            <View style={styles.supportContainer}>
              <Text style={styles.supportText}>
                Need help? Contact our support team at{' '}
                <Text style={styles.supportLink}>support@edudashpro.co.za</Text>
              </Text>
            </View>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 40,
  },

  // Success Animation
  successIconContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  successIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 2,
    borderColor: '#10b981',
  },

  // Success Message
  messageContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  successTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: 1,
  },
  successSubtitle: {
    fontSize: 18,
    color: '#CCCCCC',
    textAlign: 'center',
    lineHeight: 24,
  },

  // Payment Details
  detailsContainer: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  detailLabel: {
    fontSize: 14,
    color: '#CCCCCC',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },

  // Subscription Information
  subscriptionContainer: {
    marginBottom: 30,
  },
  subscriptionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  subscriptionCard: {
    backgroundColor: 'rgba(0,245,255,0.05)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,245,255,0.2)',
  },
  subscriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  subscriptionPlan: {
    fontSize: 18,
    fontWeight: '700',
    color: '#00f5ff',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  trialBadge: {
    backgroundColor: '#f59e0b',
  },
  activeBadge: {
    backgroundColor: '#10b981',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  trialInfo: {
    fontSize: 14,
    color: '#00f5ff',
    marginBottom: 8,
  },
  billingInfo: {
    fontSize: 14,
    color: '#CCCCCC',
  },

  // Next Steps
  nextStepsContainer: {
    marginBottom: 40,
  },
  nextStepsTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  stepsList: {
    gap: 12,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepText: {
    flex: 1,
    fontSize: 16,
    color: '#CCCCCC',
    lineHeight: 22,
  },

  // Action Buttons
  buttonsContainer: {
    gap: 16,
    marginBottom: 30,
  },
  primaryButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#000000',
    letterSpacing: 1,
  },
  secondaryButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },

  // Support
  supportContainer: {
    alignItems: 'center',
  },
  supportText: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
    lineHeight: 20,
  },
  supportLink: {
    color: '#00f5ff',
    fontWeight: '600',
  },
});
