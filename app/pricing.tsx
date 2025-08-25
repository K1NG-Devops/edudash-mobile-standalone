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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { DesignSystem, getRoleColors } from '@/constants/DesignSystem';
import { SmartRoutingService } from '@/lib/services/smartRoutingService';

const { width, height } = Dimensions.get('window');

// Standalone Pricing Page - No Authentication Required
export default function PricingPage() {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'parent' | 'teacher' | 'principal' | null>(null);
  const [showInvitationPrompt, setShowInvitationPrompt] = useState(false);
  
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

  const pricingPlans = [
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

  const handleSelectPlan = (plan: typeof pricingPlans[0]) => {
    setSelectedPlan(plan.id);
    setShowRoleModal(true);
  };

  const handleRoleSelection = (role: 'parent' | 'teacher' | 'principal') => {
    setSelectedRole(role);
    const plan = pricingPlans.find(p => p.id === selectedPlan);
    if (!plan) {
      return;
    }

    setShowRoleModal(false);
    
    // Check if user might have an invitation code
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

  const handleInvitationCodeDecision = (hasCode: boolean) => {
    setShowInvitationPrompt(false);
    const plan = pricingPlans.find(p => p.id === selectedPlan);
    if (!plan || !selectedRole) return;
    
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
                >
                  <LinearGradient colors={plan.color} style={styles.pricingCardGradient}>
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
                      style={styles.selectPlanButton}
                      onPress={() => handleSelectPlan(plan)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.selectPlanText}>SELECT PLAN</Text>
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

      <RoleModal />
      
      {/* Invitation Code Prompt Modal */}
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
                    <Text style={styles.invitationChoiceTitle}>No, create new account</Text>
                    <Text style={styles.invitationChoiceSubtitle}>Individual/family account</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>
        </View>
      </Modal>
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
