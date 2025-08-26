import React, { useEffect, useState, useRef } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet, 
  Animated, 
  Dimensions,
  Platform,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { DesignSystem, getRoleColors } from '@/constants/DesignSystem';
import { shadow } from '@/lib/ui/shadow';
import { SmartRoutingService } from '@/lib/services/smartRoutingService';
import { useAuth } from '@/contexts/SimpleWorkingAuth';
import { useSubscription } from '@/lib/hooks/useSubscription';

const { width, height } = Dimensions.get('window');

// Standalone Pricing Page - No Authentication Required
export default function PricingPage() {
  const { user, profile } = useAuth();
  const { createSubscription } = useSubscription();
  const isLoggedIn = !!user;
  const roleStr = (profile?.role ?? undefined) as string | undefined;
  const isPrincipal = !!(roleStr === 'preschool_admin' || roleStr === 'principal');
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'parent' | 'teacher' | 'principal' | null>(null);
  const [showInvitationPrompt, setShowInvitationPrompt] = useState(false);
  const [processingPlanId, setProcessingPlanId] = useState<string | null>(null);
  const [hoveredPlanId, setHoveredPlanId] = useState<string | null>(null);
  
  // lightweight toast state
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'success' | 'error' } | null>(null);
  const toastOpacity = useRef(new Animated.Value(0)).current;

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ visible: true, message, type });
    toastOpacity.setValue(0);
    Animated.timing(toastOpacity, { toValue: 1, duration: 160, useNativeDriver: true }).start(() => {
      setTimeout(() => {
        Animated.timing(toastOpacity, { toValue: 0, duration: 180, useNativeDriver: true }).start(() => {
          setToast(null);
        });
      }, 2400);
    });
  };
  
  const floatingAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Floating animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatingAnimation, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: false, // Using false to avoid native driver warnings
        }),
        Animated.timing(floatingAnimation, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: false, // Using false to avoid native driver warnings
        }),
      ])
    ).start();
  }, []);

  const basePricingPlans = [
    {
      id: 'free-tier',
      name: "Free Tier",
      price: "R0",
      period: "/month",
      description: "Basic features with ads",
      features: [
        "⚡ 3 AI Lessons per week",
        "👥 Up to 3 students", 
        "🤖 1 Basic AI Tutor",
        "📊 Basic Analytics",
        "📱 Shows ads on non-learning pages"
      ],
      color: DesignSystem.gradients.primarySubtle,
      popular: false,
      targetRoles: ['parent', 'teacher'],
      value: 'free',
      trialInfo: "Always free • No credit card required"
    },
    {
      id: 'neural-starter',
      name: "Neural Starter",
      price: "R49",
      period: "/month",
      description: "Perfect for growing families & educators",
      features: [
        "⚡ 5 AI Lessons per day (25/week)",
        "👥 Up to 15 students",
        "🤖 2 Advanced AI Tutors", 
        "📊 Advanced Analytics",
        "🎮 Interactive 3D Lessons",
        "🚫 No ads",
        "📞 Email support"
      ],
      color: DesignSystem.gradients.secondary,
      popular: true,
      targetRoles: ['parent', 'teacher'],
      value: 'starter',
      trialInfo: "14-day free trial • Cancel anytime"
    },
    {
      id: 'quantum-pro',
      name: "Quantum Pro",
      price: "R149",
      period: "/month",
      description: "Advanced features for serious educators",
      features: [
        "⚡ Unlimited AI Lessons",
        "👥 Unlimited Students",
        "🤖 5 Advanced AI Tutors", 
        "🔮 Predictive Analytics",
        "🚀 3D Interactive Lessons",
        "🌐 Advanced Learning Paths",
        "📞 Priority support",
        "🔄 Coming Soon: Holographic lessons"
      ],
      color: DesignSystem.gradients.accent,
      popular: false,
      targetRoles: ['teacher', 'principal'],
      value: 'premium',
      trialInfo: "14-day free trial • Cancel anytime"
    },
    {
      id: 'singularity',
      name: "Enterprise",
      price: "R299",
      period: "/month",
      description: "Full-scale institution management", 
      features: [
        "♾️ Unlimited Everything",
        "🏢 Multi-school management",
        "🤖 Unlimited AI Tutors",
        "📊 Advanced institutional analytics",
        "🎯 Custom learning paths",
        "📞 24/7 dedicated support",
        "🔒 Advanced security & compliance",
        "⭐ Enterprise-only features"
      ],
      color: DesignSystem.gradients.primary,
      popular: false,
      targetRoles: ['principal'],
      value: 'enterprise',
      trialInfo: "30-day free trial • Custom contracts available"
    }
  ];

  // Role-aware plan filtering: principals see only Pro and Enterprise
  const pricingPlans = isPrincipal
    ? basePricingPlans.filter(p => p.id === 'quantum-pro' || p.id === 'singularity')
    : basePricingPlans;

  const roles = [
    {
      id: 'parent',
      title: 'Parent',
      subtitle: 'Monitor & Support',
      description: 'Track your child\'s progress, communicate with teachers, and stay involved in their education.',
      benefits: [
        'Real-time progress tracking',
        'Direct teacher communication', 
        'Activity insights',
        'Homework assistance'
      ],
      ...getRoleColors('parent')
    },
    {
      id: 'teacher', 
      title: 'Teacher',
      subtitle: 'Educate & Inspire',
      description: 'Create lessons, track student progress, and leverage AI-powered teaching tools.',
      benefits: [
        'AI lesson generation',
        'Automated grading',
        'Student analytics',
        'Parent communication tools'
      ],
      ...getRoleColors('teacher')
    },
    {
      id: 'principal',
      title: 'Principal/Admin',
      subtitle: 'Lead & Manage',
      description: 'Oversee your school, manage teachers and students, access detailed analytics.',
      benefits: [
        'School-wide analytics',
        'Teacher management',
        'Financial reporting',
        'System administration'
      ],
      ...getRoleColors('principal')
    }
  ];

const handleSelectPlan = async (plan: typeof pricingPlans[0]) => {
    setSelectedPlan(plan.id);
    setProcessingPlanId(plan.id);

    // If user is logged in, go directly to subscription creation
    // No invitation code prompts for existing users
    if (isLoggedIn) {
      try {
        const result = await createSubscription({
          plan_id: plan.id,
          billing_interval: 'monthly',
          payment_provider: 'payfast',
        });
        
        // Handle success
        if (result.success) {
          showToast('Redirecting to payment…', 'success');
          // If no payment URL (dev environment), go to success page
          if (!result.payment_url && !result.approval_url) {
            const amount = plan.price.replace(/[^0-9.]/g, '') || '0';
            router.push({ pathname: '/payment/success/page', params: { plan_name: plan.name, amount } } as any);
          }
          // Otherwise, the payment redirect is handled by createSubscription
        } else {
          // Show error to user
          console.error('Subscription creation failed:', result.error);
          showToast(result.error || 'Failed to create subscription. Please try again.', 'error');
        }
      } catch (e) {
        console.error('Subscription error:', e);
        showToast('An unexpected error occurred. Please try again.', 'error');
      } finally {
        setProcessingPlanId(null);
      }
      return;
    }

    // Only show role modal for non-authenticated users
    setShowRoleModal(true);
    setProcessingPlanId(null);
  };

  const handleRoleSelection = (role: 'parent' | 'teacher' | 'principal') => {
    setSelectedRole(role);
    const plan = pricingPlans.find(p => p.id === selectedPlan);
    if (!plan) {
      return;
    }

    setShowRoleModal(false);
    
    // Only check for invitation codes for non-logged-in users
    const shouldPromptForCode = SmartRoutingService.shouldPromptForInvitationCode(plan.id, role);
    
    if (shouldPromptForCode) {
      // Show invitation code prompt modal
      setShowInvitationPrompt(true);
      return;
    }
    
    // Use smart routing service to determine the best path
    try {
      SmartRoutingService.executeRouting(plan.id, role, false);
    } catch (error) {
      console.error('Routing error:', error);
      // Fallback to sign up page if routing fails
      router.push('/(auth)/sign-up');
    }
  };

const handleInvitationCodeDecision = async (hasCode: boolean) => {
    setShowInvitationPrompt(false);
    const plan = pricingPlans.find(p => p.id === selectedPlan);
    if (!plan || !selectedRole) return;
    
    // This function should only be called for non-logged-in users
    // Logged-in users should never see the invitation prompt
    if (isLoggedIn) {
      console.error('Invitation code decision called for logged-in user - this should not happen');
      return;
    }

    // Use smart routing service with invitation code decision
    SmartRoutingService.executeRouting(plan.id, selectedRole, hasCode);
  };

  const RoleModal = () => (
    <Modal
      visible={showRoleModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowRoleModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.roleModalContent}>
          <LinearGradient colors={DesignSystem.gradients.hero} style={styles.roleModalGradient}>
            <TouchableOpacity 
              style={styles.modalCloseButton}
              onPress={() => setShowRoleModal(false)}
            >
              <IconSymbol name="xmark" size={24} color="#ffffff" />
            </TouchableOpacity>
            
            <Text style={styles.roleModalTitle}>Choose Your Role</Text>
            <Text style={styles.roleModalSubtitle}>
              Select how you'll be using EduDash Pro
            </Text>

            <View style={styles.rolesGrid}>
              {roles.map((role) => (
                <TouchableOpacity
                  key={role.id}
                  style={styles.roleCard}
                  onPress={() => handleRoleSelection(role.id as any)}
                >
                  <LinearGradient
                    colors={role.background}
                    style={styles.roleCardGradient}
                  >
                    <Text style={styles.roleIcon}>{role.icon}</Text>
                    <Text style={styles.roleTitle}>{role.title}</Text>
                    <Text style={styles.roleSubtitle}>{role.subtitle}</Text>
                    <Text style={styles.roleDescription}>{role.description}</Text>
                    
                    <View style={styles.roleBenefits}>
                      {role.benefits.map((benefit, index) => (
                        <Text key={index} style={styles.roleBenefit}>• {benefit}</Text>
                      ))}
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="light" translucent />
      
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <LinearGradient
          colors={DesignSystem.gradients.hero}
          style={styles.header}
        >
          <SafeAreaView style={styles.headerContent}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <IconSymbol name="chevron.left" size={24} color="#ffffff" />
            </TouchableOpacity>
            
            <View style={styles.headerTitleContainer}>
              <Animated.View style={{
                transform: [{
                  translateY: floatingAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -10]
                  })
                }]
              }}>
                <Text style={styles.headerTitle}>QUANTUM PRICING</Text>
                <Text style={styles.headerSubtitle}>
                  Choose your reality • Transcend dimensions • Unlock infinite potential
                </Text>
              </Animated.View>
            </View>
          </SafeAreaView>
        </LinearGradient>

        {/* Role Comparison Section */}
        <View style={styles.roleComparisonSection}>
          <LinearGradient colors={DesignSystem.gradients.section} style={styles.sectionGradient}>
            <Text style={styles.comparisonTitle}>WHO IS EDUDASH PRO FOR?</Text>
            <Text style={styles.comparisonSubtitle}>
              Designed for every member of the education community
            </Text>
            
            <View style={styles.comparisonCards}>
              {roles.map((role) => (
                <View key={role.id} style={styles.comparisonCard}>
                  <LinearGradient
                    colors={[`${role.primary}20`, `${role.secondary}10`]}
                    style={styles.comparisonCardGradient}
                  >
                    <Text style={styles.comparisonIcon}>{role.icon}</Text>
                    <Text style={styles.comparisonRoleTitle}>{role.title}</Text>
                    <Text style={styles.comparisonRoleSubtitle}>{role.subtitle}</Text>
                    <Text style={styles.comparisonRoleDescription}>{role.description}</Text>
                  </LinearGradient>
                </View>
              ))}
            </View>
          </LinearGradient>
        </View>

        {/* Pricing Plans */}
        <View style={styles.pricingSection}>
          <LinearGradient colors={DesignSystem.gradients.section} style={styles.sectionGradient}>
            <Text style={styles.pricingTitle}>SELECT YOUR PLAN</Text>
            <Text style={styles.pricingSubtitle}>
              All plans include our core AI-powered features
            </Text>

            <View style={styles.pricingGrid}>
              {pricingPlans.map((plan) => (
                <View 
                  key={plan.id} 
                  style={styles.pricingCard}
                  onMouseEnter={() => setHoveredPlanId(plan.id)}
                  onMouseLeave={() => setHoveredPlanId(null)}
                >
                  <LinearGradient colors={plan.color} style={[
                    styles.pricingCardGradient,
                    shadow(hoveredPlanId === plan.id ? 4 : 2, '#000'),
                    Platform.OS === 'web' && hoveredPlanId === plan.id ? ({ transform: [{ scale: 1.01 }] } as any) : null,
                  ]}>
                    {plan.popular && (
                      <View style={styles.popularBadge}>
                        <Text style={styles.popularText}>MOST POPULAR</Text>
                      </View>
                    )}
                    <Text style={styles.planName}>{plan.name}</Text>
                    <Text style={styles.planPrice}>
                      {plan.price}
                      <Text style={styles.planPeriod}>{plan.period}</Text>
                    </Text>
                    {plan.trialInfo && (
                      <Text style={styles.planTrialInfo}>{plan.trialInfo}</Text>
                    )}
                    <Text style={styles.planDescription}>{plan.description}</Text>
                    
                    <View style={styles.featuresContainer}>
                      {plan.features.map((feature, i) => (
                        <Text key={i} style={styles.featureItem}>{feature}</Text>
                      ))}
                    </View>
                    
                    <View style={styles.planTargetRoles}>
                      <Text style={styles.targetRolesLabel}>Best for:</Text>
                      <View style={styles.targetRolesContainer}>
                        {plan.targetRoles.map((roleId) => {
                          const role = roles.find(r => r.id === roleId);
                          return role ? (
                            <Text key={roleId} style={styles.targetRole}>
                              {role.icon} {role.title}
                            </Text>
                          ) : null;
                        })}
                      </View>
                    </View>
                    
                    <TouchableOpacity 
                      style={[
                        styles.selectPlanButton,
                        Platform.OS === 'web' ? ({ cursor: (processingPlanId === plan.id ? 'not-allowed' : 'pointer') } as any) : null,
                        processingPlanId === plan.id ? styles.selectPlanButtonDisabled : null,
                      ]}
                      onPress={() => handleSelectPlan(plan)}
                      activeOpacity={0.8}
                      disabled={processingPlanId === plan.id}
                      accessibilityRole="button"
                      accessibilityLabel={`Select ${plan.name} plan`}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      {processingPlanId === plan.id ? (
                        <View style={styles.processingRow}>
                          <ActivityIndicator size="small" color="#000" />
                          <Text style={[styles.selectPlanText, { marginLeft: 8 }]}>PROCESSING…</Text>
                        </View>
                      ) : (
                        <Text style={styles.selectPlanText}>SELECT PLAN</Text>
                      )}
                    </TouchableOpacity>
                  </LinearGradient>
                </View>
              ))}
            </View>
          </LinearGradient>
        </View>

        {/* Features Comparison */}
        <View style={styles.featuresSection}>
          <LinearGradient colors={DesignSystem.gradients.section} style={styles.sectionGradient}>
            <Text style={styles.featuresTitle}>FEATURE COMPARISON</Text>
            <Text style={styles.featuresSubtitle}>
              Compare what's included in each plan
            </Text>
            
            <View style={styles.comparisonTable}>
              <View style={styles.comparisonHeader}>
                <Text style={styles.comparisonFeatureHeader}>Features</Text>
                <Text style={styles.comparisonPlanHeader}>Starter</Text>
                <Text style={styles.comparisonPlanHeader}>Pro</Text>
                <Text style={styles.comparisonPlanHeader}>Singularity</Text>
              </View>
              
              {[
                ['AI Students', '10', 'Unlimited', 'Infinite'],
                ['Neural Networks', 'Basic', 'Advanced', 'Quantum AI'],
                ['Robotic Tutors', '1', '5', 'Army'],
                ['Analytics', 'Basic', 'Predictive', 'Time Travel'],
                ['Lessons', 'Standard', 'Holographic', '4D Reality'],
                ['Support', 'Community', 'Priority', 'God Mode']
              ].map(([feature, starter, pro, singularity], index) => (
                <View key={index} style={styles.comparisonRow}>
                  <Text style={styles.comparisonFeature}>{feature}</Text>
                  <Text style={styles.comparisonValue}>{starter}</Text>
                  <Text style={styles.comparisonValue}>{pro}</Text>
                  <Text style={styles.comparisonValue}>{singularity}</Text>
                </View>
              ))}
            </View>
          </LinearGradient>
        </View>

        {/* Call to Action */}
        <View style={styles.ctaSection}>
          <LinearGradient colors={DesignSystem.gradients.primary} style={styles.ctaGradient}>
            <Text style={styles.ctaTitle}>Ready to Transcend Education?</Text>
            <Text style={styles.ctaSubtitle}>
              Join thousands of educators already using EduDash Pro
            </Text>
            <TouchableOpacity 
              style={styles.ctaButton}
              onPress={() => router.push('/(auth)/sign-up')}
            >
              <Text style={styles.ctaButtonText}>START FREE TRIAL</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </ScrollView>

      {/* Only render RoleModal and Invitation prompt for non-principal flows */}
      {!isPrincipal && <RoleModal />}
      
      {/* Invitation Code Prompt Modal */}
      {!isPrincipal && (
      <Modal
        visible={showInvitationPrompt}
        transparent
        animationType="fade"
        onRequestClose={() => setShowInvitationPrompt(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.roleModalContent}>
            <LinearGradient colors={DesignSystem.gradients.hero} style={styles.roleModalGradient}>
              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={() => setShowInvitationPrompt(false)}
              >
                <IconSymbol name="xmark" size={24} color="#ffffff" />
              </TouchableOpacity>
              
              <Text style={styles.roleModalTitle}>Do you have an invitation code?</Text>
              <Text style={styles.roleModalSubtitle}>
                Some users join through school or institutional invitations
              </Text>

              <View style={styles.invitationChoiceContainer}>
                <TouchableOpacity
                  style={styles.invitationChoiceButton}
                  onPress={() => handleInvitationCodeDecision(true)}
                >
                  <LinearGradient
                    colors={DesignSystem.gradients.primary}
                    style={styles.invitationChoiceGradient}
                  >
                    <IconSymbol name="ticket" size={24} color="#000000" />
                    <Text style={styles.invitationChoiceTitle}>Yes, I have a code</Text>
                    <Text style={styles.invitationChoiceSubtitle}>Join with invitation code</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.invitationChoiceButton}
                  onPress={() => handleInvitationCodeDecision(false)}
                >
                  <LinearGradient
                    colors={DesignSystem.gradients.secondary}
                    style={styles.invitationChoiceGradient}
                  >
                    <IconSymbol name="person.badge.plus" size={24} color="#000000" />
<Text style={styles.invitationChoiceTitle}>{isLoggedIn ? 'No, continue without code' : 'No, create new account'}</Text>
                    <Text style={styles.invitationChoiceSubtitle}>
                      {isLoggedIn ? 'Proceed to manage/upgrade in settings' : 'Individual/family account'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>
        </View>
      </Modal>
      )}
      {toast?.visible && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.toast,
            { opacity: toastOpacity },
            toast?.type === 'error' ? styles.toastError : styles.toastSuccess,
          ]}
        >
          <Text style={styles.toastText}>{toast?.message}</Text>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0f',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 50,
  },
  
  // Header Styles
  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: 30,
  },
  headerContent: {
    paddingHorizontal: 20,
  },
  backButton: {
    alignSelf: 'flex-start',
    padding: 8,
    marginBottom: 20,
  },
  headerTitleContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 2,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#00f5ff',
    textAlign: 'center',
    fontWeight: '600',
  },

  // Section Styles
  roleComparisonSection: {
    marginVertical: 20,
  },
  pricingSection: {
    marginVertical: 20,
  },
  featuresSection: {
    marginVertical: 20,
  },
  ctaSection: {
    marginVertical: 20,
    marginHorizontal: 20,
    borderRadius: 20,
    overflow: 'hidden',
  },
  sectionGradient: {
    paddingHorizontal: 20,
    paddingVertical: 30,
    gap: 12,
  },
  ctaGradient: {
    paddingHorizontal: 30,
    paddingVertical: 40,
    alignItems: 'center',
  },

  // Comparison Section
  comparisonTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 1,
    marginBottom: 8,
  },
  comparisonSubtitle: {
    fontSize: 16,
    color: '#00f5ff',
    textAlign: 'center',
    marginBottom: 30,
  },
  comparisonCards: {
    gap: 15,
  },
  comparisonCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  comparisonCardGradient: {
    padding: 20,
    alignItems: 'center',
  },
  comparisonIcon: {
    fontSize: 40,
    marginBottom: 10,
  },
  comparisonRoleTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  comparisonRoleSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#00f5ff',
    marginBottom: 8,
  },
  comparisonRoleDescription: {
    fontSize: 14,
    color: '#CCCCCC',
    textAlign: 'center',
    lineHeight: 20,
  },

  // Pricing Styles
  pricingTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 1,
    marginBottom: 8,
  },
  pricingSubtitle: {
    fontSize: 16,
    color: '#00f5ff',
    textAlign: 'center',
    marginBottom: 30,
  },
  pricingGrid: {
    gap: 20,
  },
  pricingCard: {
    borderRadius: 25,
    overflow: 'hidden',
  },
  pricingCardGradient: {
    padding: 25,
    position: 'relative',
    borderRadius: 25,
  },
  popularBadge: {
    position: 'absolute',
    top: 15,
    right: 15,
    backgroundColor: '#ff0080',
    borderRadius: 15,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  popularText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  planName: {
    fontSize: 24,
    fontWeight: '900',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 8,
  },
  planPrice: {
    fontSize: 32,
    fontWeight: '900',
    color: '#000000',
    textAlign: 'center',
  },
  planPeriod: {
    fontSize: 16,
    fontWeight: '600',
  },
  planTrialInfo: {
    fontSize: 12,
    color: 'rgba(0,0,0,0.6)',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 4,
    fontWeight: '500',
    fontStyle: 'italic',
  },
  planDescription: {
    fontSize: 14,
    color: 'rgba(0,0,0,0.7)',
    textAlign: 'center',
    marginVertical: 15,
  },
  featuresContainer: {
    marginVertical: 20,
  },
  featureItem: {
    fontSize: 14,
    color: 'rgba(0,0,0,0.8)',
    marginBottom: 8,
    textAlign: 'center',
  },
  planTargetRoles: {
    marginVertical: 15,
    alignItems: 'center',
  },
  targetRolesLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(0,0,0,0.6)',
    marginBottom: 8,
  },
  targetRolesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
  },
  targetRole: {
    fontSize: 12,
    color: 'rgba(0,0,0,0.8)',
    backgroundColor: 'rgba(0,0,0,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  selectPlanButton: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingVertical: 12,
    borderRadius: 20,
    marginTop: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  selectPlanButtonDisabled: {
    opacity: 0.6,
  },
  processingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectPlanText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#000000',
    textAlign: 'center',
    letterSpacing: 1,
  },

  // Features Comparison
  featuresTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 1,
    marginBottom: 8,
  },
  featuresSubtitle: {
    fontSize: 16,
    color: '#00f5ff',
    textAlign: 'center',
    marginBottom: 30,
  },
  comparisonTable: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    overflow: 'hidden',
  },
  comparisonHeader: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  comparisonFeatureHeader: {
    flex: 2,
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  comparisonPlanHeader: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#00f5ff',
    textAlign: 'center',
  },
  comparisonRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  comparisonFeature: {
    flex: 2,
    fontSize: 14,
    color: '#FFFFFF',
  },
  comparisonValue: {
    flex: 1,
    fontSize: 12,
    color: '#CCCCCC',
    textAlign: 'center',
  },

  // CTA Styles
  ctaTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 8,
  },
  ctaSubtitle: {
    fontSize: 16,
    color: 'rgba(0,0,0,0.7)',
    textAlign: 'center',
    marginBottom: 25,
  },
  ctaButton: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  ctaButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#000000',
    letterSpacing: 1,
  },

  // Toast styles
  toast: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 70 : 50,
    alignSelf: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    ...shadow(3),
  } as any,
  toastSuccess: {
    backgroundColor: 'rgba(34,197,94,0.95)',
  },
  toastError: {
    backgroundColor: 'rgba(239,68,68,0.95)',
  },
  toastText: {
    color: '#000',
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  roleModalContent: {
    width: '100%',
    maxWidth: 600,
    maxHeight: '90%',
    borderRadius: 25,
    overflow: 'hidden',
  },
  roleModalGradient: {
    padding: 30,
    position: 'relative',
  },
  modalCloseButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    zIndex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 15,
    padding: 8,
  },
  roleModalTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  roleModalSubtitle: {
    fontSize: 16,
    color: '#CCCCCC',
    textAlign: 'center',
    marginBottom: 25,
  },
  rolesGrid: {
    gap: 15,
  },
  roleCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  roleCardGradient: {
    padding: 20,
    alignItems: 'center',
  },
  roleIcon: {
    fontSize: 32,
    marginBottom: 10,
  },
  roleTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  roleSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  roleDescription: {
    fontSize: 14,
    color: '#374151',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 15,
  },
  roleBenefits: {
    alignItems: 'center',
  },
  roleBenefit: {
    fontSize: 12,
    color: '#4B5563',
    marginBottom: 4,
  },

  // Invitation Choice Styles
  invitationChoiceContainer: {
    gap: 15,
  },
  invitationChoiceButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  invitationChoiceGradient: {
    padding: 20,
    alignItems: 'center',
  },
  invitationChoiceTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
    marginTop: 10,
    marginBottom: 4,
  },
  invitationChoiceSubtitle: {
    fontSize: 14,
    color: 'rgba(0,0,0,0.7)',
    textAlign: 'center',
  },
});
