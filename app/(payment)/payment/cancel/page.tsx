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

export default function PaymentCancelPage() {
  const [animationValue] = useState(new Animated.Value(0));
  const searchParams = useLocalSearchParams();

  // Extract any relevant details from URL parameters
  const reason = searchParams.reason as string;
  const planName = searchParams.plan_name as string;

  useEffect(() => {
    // Start animation
    Animated.timing(animationValue, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [animationValue]);

  const handleTryAgain = () => {
    // Go back to pricing page
    router.push('/pricing');
  };

  const handleContactSupport = () => {
    // Navigate to support or open email
    router.push('/(support)/contact');
  };

  const handleGoHome = () => {
    // Navigate to home or dashboard
    router.replace('/');
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={DesignSystem.gradients.hero}
        style={styles.background}
      >
        <SafeAreaView style={styles.safeArea}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {/* Cancel Animation */}
            <Animated.View 
              style={[
                styles.cancelIconContainer,
                {
                  transform: [{ scale: animationValue }],
                  opacity: animationValue
                }
              ]}
            >
              <View style={styles.cancelIcon}>
                <IconSymbol name="xmark.circle.fill" size={80} color="#ef4444" />
              </View>
            </Animated.View>

            {/* Cancel Message */}
            <View style={styles.messageContainer}>
              <Text style={styles.cancelTitle}>Payment Cancelled</Text>
              <Text style={styles.cancelSubtitle}>
                No worries! Your payment was cancelled and no charges were made.
              </Text>
            </View>

            {/* Cancellation Details */}
            {(reason || planName) && (
              <View style={styles.detailsContainer}>
                <Text style={styles.detailsTitle}>Cancellation Details</Text>
                
                {planName && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Plan:</Text>
                    <Text style={styles.detailValue}>{planName}</Text>
                  </View>
                )}
                
                {reason && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Reason:</Text>
                    <Text style={styles.detailValue}>{reason}</Text>
                  </View>
                )}
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Status:</Text>
                  <Text style={styles.detailValue}>No charges made</Text>
                </View>
              </View>
            )}

            {/* Why This Happened */}
            <View style={styles.reasonsContainer}>
              <Text style={styles.reasonsTitle}>Why might this have happened?</Text>
              <View style={styles.reasonsList}>
                <View style={styles.reasonItem}>
                  <IconSymbol name="person.fill" size={16} color="#00f5ff" />
                  <Text style={styles.reasonText}>
                    You decided to review your options before subscribing
                  </Text>
                </View>
                <View style={styles.reasonItem}>
                  <IconSymbol name="creditcard.fill" size={16} color="#00f5ff" />
                  <Text style={styles.reasonText}>
                    Payment method or bank declined the transaction
                  </Text>
                </View>
                <View style={styles.reasonItem}>
                  <IconSymbol name="wifi.slash" size={16} color="#00f5ff" />
                  <Text style={styles.reasonText}>
                    Network connection was interrupted during payment
                  </Text>
                </View>
                <View style={styles.reasonItem}>
                  <IconSymbol name="exclamationmark.triangle.fill" size={16} color="#00f5ff" />
                  <Text style={styles.reasonText}>
                    Technical issue with the payment provider
                  </Text>
                </View>
              </View>
            </View>

            {/* Still Interested */}
            <View style={styles.offerContainer}>
              <Text style={styles.offerTitle}>Still interested in EduDash Pro?</Text>
              <Text style={styles.offerText}>
                Don't miss out on transforming education with AI-powered learning experiences.
              </Text>

              {/* Plan Benefits Reminder */}
              <View style={styles.benefitsContainer}>
                <View style={styles.benefitItem}>
                  <IconSymbol name="checkmark.circle.fill" size={20} color="#10b981" />
                  <Text style={styles.benefitText}>
                    14-day free trial with no commitment
                  </Text>
                </View>
                <View style={styles.benefitItem}>
                  <IconSymbol name="checkmark.circle.fill" size={20} color="#10b981" />
                  <Text style={styles.benefitText}>
                    Cancel anytime with one click
                  </Text>
                </View>
                <View style={styles.benefitItem}>
                  <IconSymbol name="checkmark.circle.fill" size={20} color="#10b981" />
                  <Text style={styles.benefitText}>
                    AI-powered personalized learning
                  </Text>
                </View>
                <View style={styles.benefitItem}>
                  <IconSymbol name="checkmark.circle.fill" size={20} color="#10b981" />
                  <Text style={styles.benefitText}>
                    Dedicated support team
                  </Text>
                </View>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.buttonsContainer}>
              <TouchableOpacity 
                style={styles.primaryButton}
                onPress={handleTryAgain}
              >
                <LinearGradient
                  colors={DesignSystem.gradients.primary}
                  style={styles.buttonGradient}
                >
                  <IconSymbol name="arrow.clockwise" size={20} color="#000000" />
                  <Text style={styles.primaryButtonText}>
                    Try Again
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.secondaryButton}
                onPress={handleContactSupport}
              >
                <Text style={styles.secondaryButtonText}>
                  Contact Support
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.tertiaryButton}
                onPress={handleGoHome}
              >
                <Text style={styles.tertiaryButtonText}>
                  Return to Home
                </Text>
              </TouchableOpacity>
            </View>

            {/* Support Information */}
            <View style={styles.supportContainer}>
              <Text style={styles.supportTitle}>Need Help?</Text>
              <Text style={styles.supportText}>
                Our support team is here to help you resolve any payment issues.
                Contact us at{' '}
                <Text style={styles.supportLink}>support@edudashpro.co.za</Text>
                {' '}or use our live chat.
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

  // Cancel Animation
  cancelIconContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  cancelIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 2,
    borderColor: '#ef4444',
  },

  // Cancel Message
  messageContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  cancelTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: 1,
  },
  cancelSubtitle: {
    fontSize: 18,
    color: '#CCCCCC',
    textAlign: 'center',
    lineHeight: 24,
  },

  // Details
  detailsContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
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

  // Reasons
  reasonsContainer: {
    marginBottom: 30,
  },
  reasonsTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  reasonsList: {
    gap: 12,
  },
  reasonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  reasonText: {
    flex: 1,
    fontSize: 14,
    color: '#CCCCCC',
    lineHeight: 20,
  },

  // Offer
  offerContainer: {
    backgroundColor: 'rgba(0,245,255,0.05)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: 'rgba(0,245,255,0.2)',
  },
  offerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#00f5ff',
    marginBottom: 8,
  },
  offerText: {
    fontSize: 16,
    color: '#CCCCCC',
    lineHeight: 22,
    marginBottom: 20,
  },
  benefitsContainer: {
    gap: 8,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  benefitText: {
    flex: 1,
    fontSize: 14,
    color: '#FFFFFF',
    lineHeight: 20,
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
  tertiaryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  tertiaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999999',
    textAlign: 'center',
  },

  // Support
  supportContainer: {
    alignItems: 'center',
  },
  supportTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
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
