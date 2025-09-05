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
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, [animationValue]);

  const handleTryAgain = () => {
    // Go back to pricing page
    router.push('/pricing');
  };

  const handleContactSupport = () => {
    // Navigate to support or open email
    router.push('/support/contact');
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
                  Go Home
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
  cancelIconContainer: { alignItems: 'center', marginTop: 30 },
  cancelIcon: { backgroundColor: '#ffffff20', borderRadius: 60, padding: 10 },
  messageContainer: { alignItems: 'center', marginTop: 20 },
  cancelTitle: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
  cancelSubtitle: { fontSize: 16, color: '#ffffffb3', textAlign: 'center', marginTop: 8 },
  detailsContainer: { backgroundColor: '#ffffff10', borderRadius: 12, padding: 16, marginTop: 20 },
  detailsTitle: { fontSize: 18, fontWeight: '600', color: '#fff', marginBottom: 12 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  detailLabel: { color: '#ffffffb3' },
  detailValue: { color: '#fff', fontWeight: '600' },
  reasonsContainer: { marginTop: 24 },
  reasonsTitle: { fontSize: 18, fontWeight: '600', color: '#fff', marginBottom: 12 },
  reasonsList: { gap: 8 },
  reasonItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  reasonText: { color: '#ffffffd9' },
  offerContainer: { marginTop: 24 },
  offerTitle: { fontSize: 20, fontWeight: '700', color: '#fff', marginBottom: 8 },
  offerText: { color: '#ffffffcc', marginBottom: 12 },
  benefitsContainer: { gap: 8 },
  benefitItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  benefitText: { color: '#ffffffd9' },
  buttonsContainer: { marginTop: 24, gap: 12 },
  primaryButton: { borderRadius: 12, overflow: 'hidden' },
  buttonGradient: { paddingVertical: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  primaryButtonText: { color: '#000', fontWeight: '700' },
  secondaryButton: { padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#ffffff40', alignItems: 'center' },
  secondaryButtonText: { color: '#fff', fontWeight: '600' },
  tertiaryButton: { padding: 8, alignItems: 'center' },
  tertiaryButtonText: { color: '#ffffffb3' },
});
