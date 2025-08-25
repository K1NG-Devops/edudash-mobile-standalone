import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { DesignSystem } from '@/constants/DesignSystem';

interface PlanDetails {
  id: string;
  name: string;
  price: string;
  period: string;
  features: string[];
  color: string[];
}

export default function SignUpComplete() {
  const params = useLocalSearchParams();
  const plan = params?.plan as string;
  const role = params?.role as string;
  
  const [loading, setLoading] = useState(false);
  const [planDetails, setPlanDetails] = useState<PlanDetails | null>(null);

  const plans: { [key: string]: PlanDetails } = {
    'free': {
      id: 'free-tier',
      name: 'Free Tier',
      price: 'R0',
      period: '/month',
      features: [
        '⚡ 3 AI Lessons per week',
        '👥 Up to 3 students',
        '🤖 1 Basic AI Tutor',
        '📊 Basic Analytics',
        '📱 Shows ads on non-learning pages'
      ],
      color: DesignSystem.gradients.primarySubtle
    },
    'starter': {
      id: 'neural-starter',
      name: 'Neural Starter',
      price: 'R49',
      period: '/month',
      features: [
        '⚡ 5 AI Lessons per day (25/week)',
        '👥 Up to 15 students',
        '🤖 2 Advanced AI Tutors',
        '📊 Advanced Analytics',
        '🎮 Interactive 3D Lessons',
        '🚫 No ads',
        '📞 Email support'
      ],
      color: DesignSystem.gradients.secondary
    },
    'premium': {
      id: 'quantum-pro',
      name: 'Quantum Pro',
      price: 'R149',
      period: '/month',
      features: [
        '⚡ Unlimited AI Lessons',
        '👥 Unlimited Students',
        '🤖 5 Advanced AI Tutors',
        '🔮 Predictive Analytics',
        '🚀 3D Interactive Lessons',
        '🌐 Advanced Learning Paths',
        '📞 Priority support'
      ],
      color: DesignSystem.gradients.accent
    },
    'enterprise': {
      id: 'singularity',
      name: 'Enterprise',
      price: 'R299',
      period: '/month',
      features: [
        '♾️ Unlimited Everything',
        '🏢 Multi-school management',
        '🤖 Unlimited AI Tutors',
        '📊 Advanced institutional analytics',
        '🎯 Custom learning paths',
        '📞 24/7 dedicated support',
        '🔒 Advanced security & compliance'
      ],
      color: DesignSystem.gradients.primary
    }
  };

  useEffect(() => {
    if (plan && plans[plan]) {
      setPlanDetails(plans[plan]);
    } else {
      // Default to free plan if no valid plan specified
      setPlanDetails(plans.free);
    }
  }, [plan]);

  const handleContinueToPayment = async () => {
    if (!planDetails) return;
    
    setLoading(true);
    
    try {
      if (planDetails.id === 'free-tier') {
        // Free tier - go to welcome page first, then dashboard
        Alert.alert(
          'Welcome to EduDash Pro!',
          'Your free account has been created successfully.',
          [
            {
              text: 'Get Started',
              onPress: () => router.replace('/welcome-success')
            }
          ]
        );
      } else {
        // Paid plans - initiate payment flow
        // For now, we'll simulate a successful payment
        setTimeout(() => {
          Alert.alert(
            'Success!',
            'Your account has been created successfully. Welcome to EduDash Pro!',
            [
              {
                text: 'Get Started',
                onPress: () => router.replace('/(tabs)/dashboard')
              }
            ]
          );
        }, 2000);
      }
    } catch (error) {
      console.error('Payment flow error:', error);
      Alert.alert(
        'Error',
        'There was an issue processing your request. Please try again.',
        [
          {
            text: 'OK',
            onPress: () => setLoading(false)
          }
        ]
      );
    }
  };

  const handleStartTrial = () => {
    Alert.alert(
      'Start Free Trial',
      `Start your 14-day free trial of ${planDetails?.name}. You won't be charged until the trial ends.`,
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Start Trial',
          onPress: () => {
            router.replace('/welcome-success');
          }
        }
      ]
    );
  };

  if (!planDetails) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00f5ff" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  const roleDisplayName = role === 'parent' ? 'Parent' : role === 'teacher' ? 'Teacher' : role === 'principal' ? 'Principal' : 'User';
  const isFree = planDetails.id === 'free-tier';
  const hasTrialPeriod = ['starter', 'premium'].includes(plan || '');

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0a0a0f', '#1a0a2e', '#16213e']} style={styles.gradient}>
        <SafeAreaView style={styles.safeArea}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <IconSymbol name="chevron.left" size={24} color="#ffffff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Almost Done!</Text>
          </View>

          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            {/* Welcome Section */}
            <View style={styles.welcomeSection}>
              <View style={styles.checkmarkContainer}>
                <LinearGradient colors={DesignSystem.gradients.primary} style={styles.checkmarkGradient}>
                  <IconSymbol name="checkmark" size={32} color="#000000" />
                </LinearGradient>
              </View>
              <Text style={styles.welcomeTitle}>Welcome to EduDash Pro!</Text>
              <Text style={styles.welcomeSubtitle}>
                Your account is ready. Let's set up your {planDetails.name} plan.
              </Text>
            </View>

            {/* Plan Summary */}
            <View style={styles.planSummaryContainer}>
              <LinearGradient colors={planDetails.color} style={styles.planSummaryGradient}>
                <Text style={styles.planSummaryTitle}>{planDetails.name}</Text>
                <Text style={styles.planSummaryPrice}>
                  {planDetails.price}
                  <Text style={styles.planSummaryPeriod}>{planDetails.period}</Text>
                </Text>
                <Text style={styles.planSummaryRole}>Perfect for {roleDisplayName}s</Text>
                
                <View style={styles.featuresContainer}>
                  <Text style={styles.featuresTitle}>What's included:</Text>
                  {planDetails.features.map((feature, index) => (
                    <Text key={index} style={styles.featureItem}>{feature}</Text>
                  ))}
                </View>
              </LinearGradient>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionsContainer}>
              {isFree ? (
                <TouchableOpacity 
                  style={styles.primaryButton}
                  onPress={handleContinueToPayment}
                  disabled={loading}
                >
                  <LinearGradient colors={DesignSystem.gradients.primary} style={styles.buttonGradient}>
                    {loading ? (
                      <ActivityIndicator size="small" color="#000000" />
                    ) : (
                      <>
                        <IconSymbol name="bolt" size={20} color="#000000" />
                        <Text style={styles.primaryButtonText}>Start Using EduDash Pro</Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              ) : (
                <>
                  {hasTrialPeriod ? (
                    <TouchableOpacity 
                      style={styles.primaryButton}
                      onPress={handleStartTrial}
                    >
                      <LinearGradient colors={DesignSystem.gradients.primary} style={styles.buttonGradient}>
                        <IconSymbol name="gift" size={20} color="#000000" />
                        <Text style={styles.primaryButtonText}>Start 14-Day Free Trial</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  ) : null}
                  
                  <TouchableOpacity 
                    style={styles.secondaryButton}
                    onPress={handleContinueToPayment}
                    disabled={loading}
                  >
                    <LinearGradient 
                      colors={['rgba(0,245,255,0.1)', 'rgba(0,128,255,0.1)']} 
                      style={styles.buttonGradient}
                    >
                      {loading ? (
                        <ActivityIndicator size="small" color="#00f5ff" />
                      ) : (
                        <>
                          <IconSymbol name="creditcard" size={20} color="#00f5ff" />
                          <Text style={styles.secondaryButtonText}>Continue to Payment</Text>
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </>
              )}
              
              <TouchableOpacity 
                style={styles.skipButton}
                onPress={() => router.replace('/welcome-success')}
              >
                <Text style={styles.skipButtonText}>Skip for now</Text>
              </TouchableOpacity>
            </View>

            {/* Trust Indicators */}
            <View style={styles.trustIndicators}>
              <Text style={styles.trustTitle}>Trusted by thousands of educators</Text>
              <View style={styles.trustBadges}>
                <View style={styles.trustBadge}>
                  <Text style={styles.trustBadgeIcon}>🛡️</Text>
                  <Text style={styles.trustBadgeText}>Secure</Text>
                </View>
                <View style={styles.trustBadge}>
                  <Text style={styles.trustBadgeIcon}>🔒</Text>
                  <Text style={styles.trustBadgeText}>GDPR</Text>
                </View>
                <View style={styles.trustBadge}>
                  <Text style={styles.trustBadgeIcon}>👶</Text>
                  <Text style={styles.trustBadgeText}>Child Safe</Text>
                </View>
                <View style={styles.trustBadge}>
                  <Text style={styles.trustBadgeIcon}>🇿🇦</Text>
                  <Text style={styles.trustBadgeText}>SA Approved</Text>
                </View>
              </View>
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
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a0a0f',
  },
  loadingText: {
    marginTop: 16,
    color: '#ffffff',
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  backButton: {
    padding: 8,
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  welcomeSection: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  checkmarkContainer: {
    marginBottom: 20,
  },
  checkmarkGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#cccccc',
    textAlign: 'center',
    lineHeight: 22,
  },
  planSummaryContainer: {
    marginBottom: 30,
  },
  planSummaryGradient: {
    padding: 25,
    borderRadius: 20,
    alignItems: 'center',
  },
  planSummaryTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 8,
  },
  planSummaryPrice: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 4,
  },
  planSummaryPeriod: {
    fontSize: 16,
    fontWeight: '600',
  },
  planSummaryRole: {
    fontSize: 14,
    color: 'rgba(0,0,0,0.7)',
    marginBottom: 20,
  },
  featuresContainer: {
    width: '100%',
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(0,0,0,0.8)',
    marginBottom: 12,
    textAlign: 'center',
  },
  featureItem: {
    fontSize: 14,
    color: 'rgba(0,0,0,0.8)',
    marginBottom: 6,
    textAlign: 'center',
  },
  actionsContainer: {
    marginBottom: 30,
  },
  primaryButton: {
    marginBottom: 16,
  },
  secondaryButton: {
    marginBottom: 16,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#00f5ff',
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  skipButtonText: {
    fontSize: 16,
    color: '#888888',
    textDecorationLine: 'underline',
  },
  trustIndicators: {
    alignItems: 'center',
    marginBottom: 40,
  },
  trustTitle: {
    fontSize: 16,
    color: '#cccccc',
    marginBottom: 16,
  },
  trustBadges: {
    flexDirection: 'row',
    gap: 20,
  },
  trustBadge: {
    alignItems: 'center',
  },
  trustBadgeIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  trustBadgeText: {
    fontSize: 12,
    color: '#888888',
  },
});
