import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Platform,
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
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(animationValue, {
        toValue: 0.8,
        duration: 200,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(animationValue, {
        toValue: 1,
        duration: 200,
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]).start();

    // Refresh subscription data
    const refreshData = async () => {
      try {
        await refreshSubscription();
        setLoading(false);
      } catch (error) {
        setLoading(false);
      }
    };

    // Small delay to allow for webhook processing
    const timeout = setTimeout(refreshData, 2000);
    return () => clearTimeout(timeout);
  }, [refreshSubscription, animationValue]);

  const handleContinue = () => {
    // Navigate to the main app or dashboard
    router.replace('/(tabs)/dashboard');
  };

  const handleViewSubscription = () => {
    router.push('/screens/subscription-management');
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
                  <IconSymbol name="arrow.right.circle" size={20} color="#000000" />
                  <Text style={styles.primaryButtonText}>
                    Continue
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.secondaryButton}
                onPress={handleViewSubscription}
              >
                <Text style={styles.secondaryButtonText}>
                  View Subscription
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  background: { flex: 1 },
  safeArea: { flex: 1 },
  scrollContent: { padding: 20 },
  successIconContainer: { alignItems: 'center', marginTop: 30 },
  successIcon: { backgroundColor: '#ffffff20', borderRadius: 60, padding: 10 },
  messageContainer: { alignItems: 'center', marginTop: 20 },
  successTitle: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
  successSubtitle: { fontSize: 16, color: '#ffffffb3', textAlign: 'center', marginTop: 8 },
  detailsContainer: { backgroundColor: '#ffffff10', borderRadius: 12, padding: 16, marginTop: 20 },
  detailsTitle: { fontSize: 18, fontWeight: '600', color: '#fff', marginBottom: 12 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  detailLabel: { color: '#ffffffb3' },
  detailValue: { color: '#fff', fontWeight: '600' },
  subscriptionContainer: { marginTop: 24 },
  subscriptionTitle: { fontSize: 18, fontWeight: '600', color: '#fff', marginBottom: 12 },
  subscriptionCard: { backgroundColor: '#ffffff10', borderRadius: 12, padding: 16 },
  subscriptionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  subscriptionPlan: { color: '#fff', fontWeight: '700' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 9999 },
  trialBadge: { backgroundColor: '#f59e0b' },
  activeBadge: { backgroundColor: '#10b981' },
  statusText: { color: '#000', fontWeight: '700' },
  trialInfo: { color: '#ffffffcc', marginTop: 8 },
  billingInfo: { color: '#ffffffcc', marginTop: 8 },
  nextStepsContainer: { marginTop: 24 },
  nextStepsTitle: { fontSize: 20, fontWeight: '700', color: '#fff', marginBottom: 8 },
  stepsList: { gap: 8 },
  stepItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stepText: { color: '#ffffffd9' },
  buttonsContainer: { marginTop: 24, gap: 12 },
  primaryButton: { borderRadius: 12, overflow: 'hidden' },
  buttonGradient: { paddingVertical: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  primaryButtonText: { color: '#000', fontWeight: '700' },
  secondaryButton: { padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#ffffff40', alignItems: 'center' },
  secondaryButtonText: { color: '#fff', fontWeight: '600' },
});
