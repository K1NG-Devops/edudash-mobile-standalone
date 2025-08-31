import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
  Animated,
  Alert,
  ActivityIndicator,
  Pressable,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { IconSymbol } from '@/components/ui/IconSymbol';
import WebSafeModal from '@/components/ui/WebSafeModal';
import { DesignSystem, getRoleColors, trackRevenue, formatCurrency } from '@/constants/DesignSystem';
import { getOfferingsSafe, purchaseDefault } from '@/lib/services/revenuecat';
import { useSubscription } from '@/lib/hooks/useSubscription';
import { SubscriptionService } from '@/lib/services/subscriptionService';
import { useAuth } from '@/contexts/SimpleWorkingAuth';
import { useOverageTrackingMultiple } from '@/hooks/useOverageTracking';
import { UsageWarningBanner, UsageProgressIndicator } from '@/components/overage/OverageComponents';
import OverageBillingCard from '@/components/overage/OverageBillingCard';
import { overageBillingService } from '@/lib/services/overageBillingService';
import type { OverageBillingRecord, UsageQuota } from '@/lib/services/overageBillingService';

const { width } = Dimensions.get('window');

import { ColorValue } from 'react-native';

interface PricingPlan {
  id: string;
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  color: readonly [ColorValue, ColorValue, ...ColorValue[]];
  popular: boolean;
  targetRoles: ('parent' | 'teacher' | 'principal')[];
  value: 'free' | 'starter' | 'basic' | 'premium' | 'enterprise';
  trialInfo?: string | null;
  realWorldBenefits: {
    parent: string[];
    teacher: string[];
    principal: string[];
  };
}

interface Role {
  id: 'parent' | 'teacher' | 'principal';
  title: string;
  subtitle: string;
  description: string;
  benefits: string[];
  icon: string;
  primary: string;
  secondary: string;
  background: readonly [ColorValue, ColorValue, ...ColorValue[]];
}

export const PricingComponent = ({
  embedded = false,
  showRoles = true,
  defaultSelectedRole = null,
  onPlanSelect,
  showComparison = true,
  compactMode = false,
  initialView = 'overview',
  theme = 'futuristic',
  showUsageTracking = true,
}: {
  embedded?: boolean;
  showRoles?: boolean;
  defaultSelectedRole?: 'parent' | 'teacher' | 'principal' | null;
  onPlanSelect?: (plan: PricingPlan, role: string) => void;
  showComparison?: boolean;
  compactMode?: boolean;
  initialView?: 'overview' | 'role-specific';
  theme?: 'professional' | 'futuristic';
  showUsageTracking?: boolean;
}) => {
  const { user, session } = useAuth();
  const isProfessional = theme === 'professional';
  const { subscription, createSubscription, loading: subscriptionLoading, error: subscriptionError, plans, isSubscriptionActive } = useSubscription();
  
  // Track usage for authenticated users
  const { 
    getOverageStatuses, 
    usage, 
    loading: usageLoading 
  } = useOverageTrackingMultiple(
    ['aiGenerations', 'studentsPerClass', 'monthlyLessons', 'storageGB'],
    { enabled: showUsageTracking && !!user }
  );
  const overageStatuses = user ? getOverageStatuses() : {};
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'parent' | 'teacher' | 'principal' | null>(defaultSelectedRole);
  const [viewMode, setViewMode] = useState<'overview' | 'role-specific'>(initialView ?? 'overview');
  const [creatingSubscription, setCreatingSubscription] = useState(false);
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'annual'>('monthly');
  const [expandedPlans, setExpandedPlans] = useState<Record<string, boolean>>({});
  const [rcOfferingLoaded, setRcOfferingLoaded] = useState(false);
  const [rcHasOffering, setRcHasOffering] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [effectivePremiumPrice, setEffectivePremiumPrice] = useState<number | null>(null);
  
  const floatingAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Floating animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatingAnimation, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: false, // Using false for transform animations that may not be supported
        }),
        Animated.timing(floatingAnimation, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: false, // Using false for transform animations that may not be supported
        }),
      ])
    ).start();
  }, []);

  // Load effective pricing for Quantum Pro (promo-aware)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await SubscriptionService.getEffectivePricing('quantum-pro', billingInterval);
        if (!cancelled && res && res.price) {
          setEffectivePremiumPrice(res.price);
        }
      } catch {}
    })();
    return () => {
      cancelled = true;
    };
  }, [billingInterval]);

  // Try to fetch RevenueCat default offering on mobile (so we can purchase)
  useEffect(() => {
    let cancelled = false;
    if (Platform.OS === 'web') {
      setRcOfferingLoaded(true);
      setRcHasOffering(false);
      return;
    }
    (async () => {
      const res = await getOfferingsSafe();
      if (!cancelled) {
        setRcOfferingLoaded(true);
        setRcHasOffering(!!res?.current);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const [basePlans] = useState<PricingPlan[]>([
    {
      id: 'free-tier',
      name: "Free Tier",
      price: "R0",
      period: "/month",
      description: "Basic features with ads",
      features: [
        "✨ 5 AI lessons per month",
        "👨‍👩‍👧‍👦 Up to 3 students",
        "📊 Basic progress tracking",
        "💬 Parent-teacher messaging",
        "📱 Mobile app access",
        "📱 Shows ads on non-learning pages"
      ],
      color: DesignSystem.gradients.surfaceCard,
      popular: false,
      targetRoles: ['parent', 'teacher'],
      value: 'free',
      trialInfo: "Always free • No credit card required",
      realWorldBenefits: {
        parent: [
          'Basic tracking of your child\'s progress',
          'Limited teacher communication',
          'Access to basic learning activities',
        ],
        teacher: [
'Create up to 5 AI-powered lessons monthly',
          'Manage up to 3 students',
          'Basic parent communication',
        ],
        principal: [
          'Test platform with very limited features',
          'Evaluate basic functionality',
        ],
      },
    },
    {
      id: 'neural-starter',
      name: "Neural Starter",
      price: "R49",
      period: "/month",
      description: "Perfect for getting started with AI education",
      features: [
        "✨ 25 AI lessons per month",
        "👨‍👩‍👧‍👦 Up to 15 students",
        "📊 Advanced progress tracking",
        "💬 Parent-teacher messaging",
        "📱 Mobile app access",
        "🚫 No ads"
      ],
      color: DesignSystem.gradients.secondary,
      popular: true,
      targetRoles: ['parent', 'teacher'],
      value: 'starter',
      trialInfo: "14-day free trial • Cancel anytime",
      realWorldBenefits: {
        parent: [
          'Track your child\'s daily progress',
          'Communicate directly with teachers',
          'Access learning activities at home',
        ],
        teacher: [
'Create up to 25 AI-powered lessons monthly',
          'Manage small class sizes effectively',
          'Connect with parents instantly',
        ],
        principal: [
          'Test platform with limited features',
          'Evaluate teacher and parent adoption',
        ],
      },
    },
    {
      id: 'quantum-pro',
      name: "Quantum Pro",
      price: "R149",
      period: "/month",
      description: "Advanced AI features for growing schools",
      features: [
        "🚀 Unlimited AI lesson generation",
        "👥 Up to 50 students per school",
        "📈 Advanced analytics & insights",
        "🎯 Personalized learning paths",
        "🤖 AI homework grading",
        "☁️ Cloud storage & backup",
        "🎨 Custom school branding"
      ],
      color: DesignSystem.gradients.secondary,
      popular: true,
      targetRoles: ['teacher', 'principal'],
      value: 'premium',
      trialInfo: "14-day free trial • Cancel anytime",
      realWorldBenefits: {
        parent: [
          'Detailed insights into learning patterns',
          'Personalized activities for your child',
          'AI-powered homework assistance',
          'Progress predictions and recommendations',
        ],
        teacher: [
          'Unlimited lesson creation with AI',
          'Automated grading saves 10+ hours/week',
          'Data-driven teaching insights',
          'Professional development recommendations',
        ],
        principal: [
          'School-wide performance analytics',
          'Teacher productivity insights',
          'Parent engagement metrics',
          'Custom branding for your school',
        ],
      },
    },
    {
      id: 'singularity',
      name: "Enterprise",
      price: "R999",
      period: "/month",
      description: "Complete solution for large educational institutions",
      features: [
        "♾️ Unlimited everything",
        "🏢 Multi-school management",
        "🧠 Advanced AI tutoring",
        "📊 Predictive analytics",
        "🌐 API access & integrations",
        "👨‍💻 Dedicated support team",
        "🔐 Enterprise security",
        "📈 Custom reporting dashboards"
      ],
      color: DesignSystem.gradients.accent,
      popular: false,
      targetRoles: ['principal'],
      value: 'enterprise',
      trialInfo: "30-day free trial • Custom contracts available",
      realWorldBenefits: {
        parent: [
          'Premium family dashboard',
          'Priority customer support',
          'Advanced child development insights',
          'Integration with external learning tools',
        ],
        teacher: [
          'AI teaching assistant',
          'Advanced classroom management',
          'Professional development tracking',
          'Curriculum alignment tools',
        ],
        principal: [
          'Multi-campus management',
          'Advanced financial reporting',
          'Staff performance analytics',
          'Custom integration capabilities',
          'White-label options',
        ],
      },
    }
  ]);

  // Compute displayed plans with DB pricing and promo-aware price for Quantum Pro
  const computedPricingPlans: PricingPlan[] = React.useMemo(() => {
    const getDbPrice = (tier: 'free' | 'starter' | 'premium' | 'enterprise'): number | null => {
      const p = plans.find(pl => pl.tier === tier);
      if (!p) return null;
      return billingInterval === 'monthly' ? p.price_monthly : p.price_annual;
    };

    const toPriceStr = (n: number | null | undefined, fallback: string): string => {
      if (typeof n === 'number' && !Number.isNaN(n)) return `R${n.toFixed(2)}`;
      return fallback;
    };

    const period = billingInterval === 'monthly' ? '/month' : '/year';

    return basePlans.map(bp => {
      let price = bp.price;
      if (bp.id === 'free-tier') {
        price = toPriceStr(getDbPrice('free'), 'R0');
      } else if (bp.id === 'neural-starter') {
        price = toPriceStr(getDbPrice('starter'), 'R49.00');
      } else if (bp.id === 'quantum-pro') {
        const premium = typeof effectivePremiumPrice === 'number' ? effectivePremiumPrice : getDbPrice('premium');
        price = toPriceStr(premium ?? null, 'R149.99');
      } else if (bp.id === 'singularity') {
        price = toPriceStr(getDbPrice('enterprise'), 'R999.00');
      }
      return { ...bp, price, period };
    });
  }, [basePlans, plans, billingInterval, effectivePremiumPrice]);

  const roles: Role[] = [
    {
      id: 'parent',
      title: 'Parent/Guardian',
      subtitle: 'Monitor & Support',
      description: 'Stay connected with your child\'s educational journey. Track progress, communicate with teachers, and support learning at home.',
      benefits: [
        'Real-time progress notifications',
        'Direct teacher communication',
        'Home learning activity suggestions',
        'Development milestone tracking',
        'Homework assistance tools',
      ],
      ...getRoleColors('parent'),
      icon: '👨‍👩‍👧‍👦',
    },
    {
      id: 'teacher',
      title: 'Teacher/Educator',
      subtitle: 'Educate & Inspire',
      description: 'Transform your classroom with AI-powered teaching tools. Create engaging lessons, track student progress, and save hours of preparation time.',
      benefits: [
        'AI lesson plan generation',
        'Automated homework grading',
        'Student progress analytics',
        'Parent communication tools',
        'Curriculum alignment assistance',
      ],
      ...getRoleColors('teacher'),
      icon: '👩‍🏫',
    },
    {
      id: 'principal',
      title: 'Principal/Admin',
      subtitle: 'Lead & Manage',
      description: 'Oversee your educational institution with comprehensive management tools. Get insights into school performance, manage staff, and drive growth.',
      benefits: [
        'School-wide analytics dashboard',
        'Teacher and student management',
        'Financial reporting and insights',
        'Parent engagement metrics',
        'System administration tools',
      ],
      ...getRoleColors('principal'),
      icon: '👩‍💼',
    }
  ];

  const handleSelectPlan = async (plan: PricingPlan) => {
    
    // If running on mobile (iOS/Android), attempt in-app purchase via RevenueCat for paid tiers
    if (Platform.OS !== 'web' && plan.value !== 'free') {
      try {
        const res = await getOfferingsSafe();
        if (res?.current) {
          const result = await purchaseDefault(res.current, billingInterval);
          if (result.success) {
            Alert.alert('Success', 'Your purchase was completed successfully.');
            // Optionally, trigger a refresh of subscription context via a callback or event
            return;
          } else {
            Alert.alert('Purchase cancelled', 'No changes were made.');
            return;
          }
        }
      } catch {}
      // If no offering available, fall through to web flow below (or show informative message)
    }

    // For embedded pricing, allow plan selection without auth
    // Users will be prompted to create accounts during the flow
    if (!session || !user) {
      // Store the selected plan and show role selection
      setSelectedPlan(plan.id);
      if (showRoles) {
        setShowRoleModal(true);
      } else {
        // If no roles needed, go directly to auth with plan params
        router.push(`/(auth)/sign-up?plan=${plan.value}&role=parent&flow_type=individual_family`);
      }
      return;
    }

    // Check if user already has an active subscription
    if (subscription && isSubscriptionActive()) {
      setShowSubscriptionModal(true);
      return;
    }

    // Track pricing interaction
    trackRevenue({
      type: 'subscription',
      value: parseFloat(plan.price.replace('R', '')) || 0,
      source: embedded ? 'embedded-pricing' : 'standalone-pricing',
      userId: user.id,
      metadata: {
        plan_name: plan.name,
        plan_value: plan.value,
        embedded: embedded,
      }
    });

    setSelectedPlan(plan.id);
    
    if (onPlanSelect && selectedRole) {
      onPlanSelect(plan, selectedRole);
      return;
    }
    
    if (showRoles && !selectedRole) {
      setShowRoleModal(true);
    } else {
      await processPlanSelection(plan, selectedRole || 'parent');
    }
  };

  const processPlanSelection = async (plan: PricingPlan, role: string) => {
    // Handle free tier - no payment required
    if (plan.value === 'free') {
      // Create free subscription directly
      setCreatingSubscription(true);
      try {
        const result = await createSubscription({
          plan_id: plan.id,
          billing_interval: 'monthly',
          payment_provider: 'payfast' // Default provider, though not used for free
        });

      if (result.success) {
          router.push({ pathname: '/payment/success/page', params: { plan_name: 'Free Tier', amount: '0' } } as const);
        } else {
          Alert.alert('Error', result.error || 'Failed to activate free tier');
        }
      } catch (error) {
        Alert.alert('Error', 'An unexpected error occurred');
      } finally {
        setCreatingSubscription(false);
      }
      return;
    }

    // For paid plans, create subscription and redirect to payment
    setCreatingSubscription(true);
    try {
      const result = await createSubscription({
        plan_id: plan.id,
        billing_interval: billingInterval,
        payment_provider: 'payfast', // Default to PayFast for South African market
      });

      if (result.success && result.payment_url) {
        // Redirect to PayFast payment page
        if (typeof window !== 'undefined') {
          window.location.href = result.payment_url;
        }
      } else if (result.success) {
        // Fallback: navigate to success screen when no payment URL is provided (e.g., dev environments)
        const amount = plan.price.replace(/[^0-9.]/g, '') || '0';
        router.push({ pathname: '/payment/success/page', params: { plan_name: plan.name, amount } } as const);
      } else {
        Alert.alert('Payment Error', result.error || 'Failed to initiate payment');
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred while processing your subscription');
    } finally {
      setCreatingSubscription(false);
    }
  };

  // Remove the old navigateToPlan function as we're handling it in processPlanSelection

  const handleRoleSelection = async (role: 'parent' | 'teacher' | 'principal') => {
    setSelectedRole(role);
    const plan = computedPricingPlans.find(p => p.id === selectedPlan);
    if (!plan) return;

    setShowRoleModal(false);
    
    if (onPlanSelect) {
      onPlanSelect(plan, role);
    } else if (!session || !user) {
      // User not authenticated, route to sign-up with plan and role params
      router.push(`/(auth)/sign-up?plan=${plan.value}&role=${role}&flow_type=individual_family`);
    } else {
      // User authenticated, proceed with plan selection
      await processPlanSelection(plan, role);
    }
  };

  const getPlanForRole = (roleId: string) => {
    return computedPricingPlans.filter(plan => 
      plan.targetRoles.includes(roleId as any) || plan.value === 'enterprise'
    );
  };

  const RoleSelectionModal = () => (
    <WebSafeModal
      visible={showRoleModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowRoleModal(false)}
      statusBarTranslucent
      hardwareAccelerated
    >
      <View style={styles.modalOverlay}>
        {/* Disable click-away to close on web to prevent accidental dismiss during scroll */}
        {Platform.OS !== 'web' && (
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowRoleModal(false)} />
        )}

        <View style={styles.roleModalContent}>
          <LinearGradient colors={DesignSystem.gradients.hero} style={styles.roleModalGradient}>
            <TouchableOpacity 
              style={styles.modalCloseButton}
              onPress={() => setShowRoleModal(false)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <IconSymbol name="xmark" size={24} color="#ffffff" />
            </TouchableOpacity>
            
            <Text style={styles.roleModalTitle}>Choose Your Role</Text>
            <Text style={styles.roleModalSubtitle}>
              Help us customize your EduDash Pro experience
            </Text>

            <ScrollView 
              style={[
                styles.scrollArea,
                Platform.OS === 'web'
                  ? ({ maxHeight: '70vh', overscrollBehavior: 'contain', touchAction: 'pan-y' } as any)
                  : { maxHeight: '80%' }
              ]} 
              contentContainerStyle={{ paddingBottom: 12 }} 
              showsVerticalScrollIndicator={false} 
              keyboardShouldPersistTaps="handled" 
              nestedScrollEnabled
            >
              <View style={styles.rolesGrid}>
                {roles.map((role) => (
                  <TouchableOpacity
                    key={role.id}
                    style={[styles.roleCard, Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : undefined]
                    }
                    accessibilityRole="button"
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    onPress={() => handleRoleSelection(role.id)}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={[`${role.primary}20`, `${role.secondary}10`]}
                      style={styles.roleCardGradient}
                    >
                      <Text style={styles.roleIcon}>{role.icon}</Text>
                      <Text style={styles.roleTitle}>{role.title}</Text>
                      <Text style={styles.roleSubtitle}>{role.subtitle}</Text>
                      <Text style={styles.roleDescription}>{role.description}</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </LinearGradient>
        </View>
      </View>
    </WebSafeModal>
  );

  const AuthRequiredModal = () => (
    <WebSafeModal
      visible={showAuthModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowAuthModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.alertModalContent}>
          <LinearGradient colors={DesignSystem.gradients.primary} style={styles.alertModalGradient}>
            <Text style={styles.alertTitle}>Account Required</Text>
            <Text style={styles.alertMessage}>
              Create an account or sign in to subscribe to a plan and unlock all features.
            </Text>
            
            <View style={styles.authButtonsContainer}>
              <TouchableOpacity 
                style={[styles.alertButton, styles.alertButtonPrimary]}
                onPress={() => {
                  setShowAuthModal(false);
                  router.push('/(auth)/sign-up');
                }}
              >
                <Text style={styles.alertButtonTextPrimary}>Create Account</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.alertButton, styles.alertButtonSecondary]}
                onPress={() => {
                  setShowAuthModal(false);
                  router.push('/(auth)/sign-in');
                }}
              >
                <Text style={styles.alertButtonTextSecondary}>Sign In</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.alertButtonCancel}
                onPress={() => {
                  setShowAuthModal(false);
                }}
              >
                <Text style={styles.alertButtonTextCancel}>Maybe Later</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      </View>
    </WebSafeModal>
  );

  const SubscriptionActiveModal = () => (
    <WebSafeModal
      visible={showSubscriptionModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowSubscriptionModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.alertModalContent}>
          <LinearGradient colors={DesignSystem.gradients.secondary} style={styles.alertModalGradient}>
            <Text style={styles.alertTitle}>Subscription Active</Text>
            <Text style={styles.alertMessage}>
              You already have an active subscription. Would you like to manage your current subscription?
            </Text>
            
            <View style={styles.alertButtons}>
              <TouchableOpacity 
                style={[styles.alertButton, styles.alertButtonSecondary]}
                onPress={() => setShowSubscriptionModal(false)}
              >
                <Text style={styles.alertButtonTextSecondary}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.alertButton, styles.alertButtonPrimary]}
                onPress={() => {
                  setShowSubscriptionModal(false);
                  router.push('/screens/subscription-management');
                }}
              >
                <Text style={styles.alertButtonTextPrimary}>Manage</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      </View>
    </WebSafeModal>
  );

  const RoleBasedView = () => {
    if (!selectedRole) return null;
    const role = roles.find(r => r.id === selectedRole)!;
    const relevantPlans = getPlanForRole(selectedRole);

    return (
      <View style={styles.roleBasedSection}>
        <LinearGradient 
          colors={[`${role.primary}15`, `${role.secondary}05`]}
          style={styles.roleBasedGradient}
        >
          <View style={styles.roleHeader}>
            <Text style={styles.roleHeaderIcon}>{role.icon}</Text>
            <Text style={styles.roleHeaderTitle}>Perfect for {role.title}s</Text>
            <Text style={styles.roleHeaderDescription}>{role.description}</Text>
          </View>

          <View style={styles.roleSpecificPlans}>
            {relevantPlans.map((plan) => (
              <View
                key={plan.id}
                style={styles.roleSpecificPlan}
              >
                <LinearGradient colors={(isProfessional ? (DesignSystem.gradients.surfaceCard as any) : plan.color)} style={styles.planCardGradient}>
                  {plan.popular && (
                    <View style={styles.popularBadge}>
                      <Text style={styles.popularText}>RECOMMENDED</Text>
                    </View>
                  )}
                  
                  <Text style={[styles.planName, isProfessional && ({ textShadowColor: 'transparent', textShadowRadius: 0 } as any)]}>{plan.name}</Text>
                  <Text style={[styles.planPrice, isProfessional && ({ textShadowColor: 'transparent', textShadowRadius: 0 } as any)]}>
                    {plan.price}<Text style={[styles.planPeriod, isProfessional && ({ textShadowColor: 'transparent' } as any)]}>{plan.period}</Text>
                  </Text>
                  
                  <View style={styles.roleSpecificBenefits}>
                    <Text style={styles.benefitsTitle}>What you get:</Text>
                    {plan.realWorldBenefits[selectedRole!].map((benefit, index) => (
                      <Text key={index} style={styles.roleBenefit}>
                        ✓ {benefit}
                      </Text>
                    ))}
                  </View>
                  
                  <TouchableOpacity 
                    style={[styles.selectPlanButton, Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : undefined]}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    onPress={() => handleSelectPlan(plan)}
                  >
                    <Text style={styles.selectPlanText}>
                      {plan.value === 'free' ? 'START FREE' : 'CHOOSE PLAN'}
                    </Text>
                  </TouchableOpacity>
                </LinearGradient>
              </View>
            ))}
          </View>
        </LinearGradient>
      </View>
    );
  };

  const OverviewPlans = () => (
    <View style={styles.pricingGrid}>
      {computedPricingPlans.map((plan) => (
        <View 
          key={plan.id}
          style={styles.pricingCard}
        >
          <LinearGradient colors={plan.color} style={styles.pricingCardGradient}>
            {plan.popular && (
              <View style={[styles.popularBadge, isProfessional && { backgroundColor: DesignSystem.colors.primary }]}>
                <Text style={styles.popularText}>MOST POPULAR</Text>
              </View>
            )}
            
                  <Text style={styles.planName}>{plan.name}</Text>
                  <Text style={styles.planPrice}>
                    {plan.price}<Text style={styles.planPeriod}>{plan.period}</Text>
                  </Text>
                  {plan.trialInfo && (
                    <Text style={styles.planTrialInfo}>{plan.trialInfo}</Text>
                  )}
                  {(!compactMode || expandedPlans[plan.id]) && (
                    <Text style={styles.planDescription}>{plan.description}</Text>
                  )}
            
            {(!compactMode || expandedPlans[plan.id]) && (
              <View style={styles.featuresContainer}>
                {plan.features.map((feature, i) => (
                  <Text key={i} style={styles.featureItem}>{feature}</Text>
                ))}
              </View>
            )}

            {compactMode && (
              <TouchableOpacity
                style={styles.readMoreButton}
                onPress={() => setExpandedPlans(prev => ({ ...prev, [plan.id]: !prev[plan.id] }))}
              >
                <Text style={styles.readMoreText}>{expandedPlans[plan.id] ? 'Read less' : 'Read more'}</Text>
              </TouchableOpacity>
            )}
            
            <View style={styles.planTargetRoles}>
              <Text style={styles.targetRolesLabel}>Perfect for:</Text>
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
              style={[styles.selectPlanButton, (creatingSubscription && selectedPlan === plan.id) && styles.selectPlanButtonLoading, Platform.OS === 'web' ? ({ cursor: creatingSubscription ? 'not-allowed' : 'pointer' } as any) : undefined]}
              activeOpacity={0.7}
              accessibilityRole="button"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              onPress={() => handleSelectPlan(plan)}
              disabled={creatingSubscription}
            >
              {creatingSubscription && selectedPlan === plan.id ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={[styles.selectPlanText, isProfessional && ({ textShadowColor: 'transparent' } as any)]}>
                  {plan.value === 'free' ? 'START FREE' : 'CHOOSE PLAN'}
                </Text>
              )}
            </TouchableOpacity>
          </LinearGradient>
        </View>
      ))}
    </View>
  );

  const ComparisonTable = () => {
    if (!showComparison) return null;

    return (
      <View style={styles.comparisonSection}>
        <Text style={styles.comparisonTitle}>Feature Comparison</Text>
        <View style={styles.comparisonTable}>
          <View style={styles.comparisonHeader}>
            <Text style={styles.comparisonFeatureHeader}>Features</Text>
            <Text style={styles.comparisonPlanHeader}>Free</Text>
            <Text style={styles.comparisonPlanHeader}>Pro</Text>
            <Text style={styles.comparisonPlanHeader}>Enterprise</Text>
          </View>
          
          {[
            ['AI Lessons/Day', '5', 'Unlimited', 'Unlimited'],
            ['Students', '10', '50', 'Unlimited'],
            ['Analytics', 'Basic', 'Advanced', 'Predictive'],
            ['Homework Grading', '❌', '✅', '✅ + AI Tutoring'],
            ['Custom Branding', '❌', '✅', '✅ + White Label'],
            ['Support', 'Community', 'Priority', 'Dedicated Team'],
            ['API Access', '❌', 'Basic', 'Full Access'],
            ['Multi-School', '❌', '❌', '✅'],
          ].map(([feature, free, pro, enterprise], index) => (
            <View key={index} style={styles.comparisonRow}>
              <Text style={styles.comparisonFeature}>{feature}</Text>
              <Text style={[styles.comparisonValue, { color: free === '❌' ? '#ef4444' : '#10b981' }]}>
                {free}
              </Text>
              <Text style={[styles.comparisonValue, { color: pro === '❌' ? '#ef4444' : '#10b981' }]}>
                {pro}
              </Text>
              <Text style={[styles.comparisonValue, { color: enterprise === '❌' ? '#ef4444' : '#10b981' }]}>
                {enterprise}
              </Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  return (
    <View style={embedded ? styles.embeddedContainer : styles.standaloneContainer}>
      {/* Show usage warnings for authenticated users */}
      {user && showUsageTracking && (
        <View style={styles.usageWarningsSection}>
          {Object.entries(overageStatuses).map(([quotaType, status]) => (
            <UsageWarningBanner
              key={quotaType}
              quotaType={quotaType as keyof typeof overageStatuses}
              overageStatus={status}
              compact={embedded}
              onUpgrade={() => router.push('/pricing')}
            />
          ))}
        </View>
      )}
      
      {/* Show overage billing card for authenticated users with overages */}
      {user && showUsageTracking && (
        <OverageBillingCard
          userId={user.id}
          compact={embedded}
          showPayButton={true}
          onPaymentStarted={(paymentUrl) => {
            // Redirect to PayFast payment
            if (typeof window !== 'undefined') {
              window.location.href = paymentUrl;
            }
          }}
        />
      )}
      
      {!embedded && (
        <View style={styles.pricingHeader}>
          <Animated.View style={{
            transform: [{
              translateY: floatingAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [0, -10]
              })
            }]
          }}>
            <Text style={styles.pricingTitle}>Choose Your Plan</Text>
            <Text style={styles.pricingSubtitle}>
              Transparent pricing • No hidden fees • Cancel anytime
            </Text>
          </Animated.View>
        </View>
      )}

      {/* Billing Interval Toggle */}
      <View style={styles.billingToggle}>
          <TouchableOpacity
            style={[styles.billingButton, billingInterval === 'monthly' && styles.billingButtonActive, Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : undefined]}
            accessibilityRole="button"
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            onPress={() => setBillingInterval('monthly')}
          >
          <Text style={[styles.billingButtonText, billingInterval === 'monthly' && styles.billingButtonTextActive]}>
            Monthly
          </Text>
        </TouchableOpacity>
          <TouchableOpacity
            style={[styles.billingButton, billingInterval === 'annual' && styles.billingButtonActive, Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : undefined]}
            accessibilityRole="button"
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            onPress={() => setBillingInterval('annual')}
          >
          <Text style={[styles.billingButtonText, billingInterval === 'annual' && styles.billingButtonTextActive]}>
            Annual (Save 17%)
          </Text>
        </TouchableOpacity>
      </View>

      {showRoles && (
        <View style={styles.viewToggle}>
          <TouchableOpacity
            style={[styles.toggleButton, viewMode === 'overview' && styles.toggleButtonActive, Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : undefined]}
            accessibilityRole="button"
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            onPress={() => setViewMode('overview')}
          >
            <Text style={[styles.toggleButtonText, viewMode === 'overview' && styles.toggleButtonTextActive]}>
              All Plans
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleButton, viewMode === 'role-specific' && styles.toggleButtonActive, Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : undefined]}
            accessibilityRole="button"
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            onPress={() => setViewMode('role-specific')}
          >
            <Text style={[styles.toggleButtonText, viewMode === 'role-specific' && styles.toggleButtonTextActive]}>
              For My Role
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {showRoles && !selectedRole && viewMode === 'role-specific' && (
        <View style={styles.roleSelectionPrompt}>
          <Text style={styles.rolePromptText}>First, tell us your role:</Text>
          <View style={styles.roleQuickSelect}>
            {roles.map((role) => (
              <TouchableOpacity
                key={role.id}
                style={styles.roleQuickButton}
                onPress={() => setSelectedRole(role.id)}
              >
                <Text style={styles.roleQuickIcon}>{role.icon}</Text>
                <Text style={styles.roleQuickText}>{role.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {viewMode === 'overview' ? <OverviewPlans /> : <RoleBasedView />}
      
      <ComparisonTable />
      
      {!embedded && (
        <View style={styles.trustSignals}>
          <View style={styles.trustSignal}>
            <Text style={styles.trustIcon}>🔒</Text>
            <Text style={styles.trustText}>Secure Payment</Text>
          </View>
          <View style={styles.trustSignal}>
            <Text style={styles.trustIcon}>📞</Text>
            <Text style={styles.trustText}>24/7 Support</Text>
          </View>
          <View style={styles.trustSignal}>
            <Text style={styles.trustIcon}>💝</Text>
            <Text style={styles.trustText}>30-Day Guarantee</Text>
          </View>
        </View>
      )}

      <RoleSelectionModal />
      <AuthRequiredModal />
      <SubscriptionActiveModal />
    </View>
  );
};

const styles = StyleSheet.create({
  standaloneContainer: {
    flex: 1,
  },
  embeddedContainer: {
    marginVertical: DesignSystem.spacing.xl,
  },

  // Usage Warnings Section
  usageWarningsSection: {
    marginBottom: DesignSystem.spacing.lg,
  },

  // Header Styles
  pricingHeader: {
    alignItems: 'center',
    marginBottom: DesignSystem.spacing.xl,
    paddingHorizontal: DesignSystem.spacing.lg,
  },
  pricingTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: DesignSystem.colors.text.primary,
    textAlign: 'center',
    letterSpacing: 2,
    marginBottom: 8,
  },
  pricingSubtitle: {
    fontSize: 16,
    color: DesignSystem.colors.text.quantum,
    textAlign: 'center',
    fontWeight: '600',
  },

  // Billing Toggle
  billingToggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,245,255,0.1)',
    borderRadius: DesignSystem.borderRadius.xxl,
    padding: 4,
    marginHorizontal: DesignSystem.spacing.xl,
    marginBottom: DesignSystem.spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(0,245,255,0.2)',
  },
  billingButton: {
    flex: 1,
    paddingVertical: DesignSystem.spacing.sm,
    borderRadius: DesignSystem.borderRadius.xl,
    alignItems: 'center',
  },
  billingButtonActive: {
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  billingButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: DesignSystem.colors.text.secondary,
  },
  billingButtonTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },

  // View Toggle
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: DesignSystem.borderRadius.xxl,
    padding: 4,
    marginHorizontal: DesignSystem.spacing.xl,
    marginBottom: DesignSystem.spacing.xl,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: DesignSystem.spacing.sm,
    borderRadius: DesignSystem.borderRadius.xl,
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  toggleButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: DesignSystem.colors.text.secondary,
  },
  toggleButtonTextActive: {
    color: '#ffffff',
  },

  // Role Selection Prompt
  roleSelectionPrompt: {
    alignItems: 'center',
    marginHorizontal: DesignSystem.spacing.xl,
    marginBottom: DesignSystem.spacing.xl,
  },
  rolePromptText: {
    fontSize: 18,
    fontWeight: '600',
    color: DesignSystem.colors.text.primary,
    marginBottom: DesignSystem.spacing.lg,
  },
  roleQuickSelect: {
    flexDirection: 'row',
    gap: DesignSystem.spacing.md,
  },
  roleQuickButton: {
    alignItems: 'center',
    padding: DesignSystem.spacing.md,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: DesignSystem.borderRadius.lg,
    minWidth: 80,
  },
  roleQuickIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  roleQuickText: {
    fontSize: 12,
    fontWeight: '600',
    color: DesignSystem.colors.text.primary,
    textAlign: 'center',
  },

  // Plans Grid
  pricingGrid: {
    paddingHorizontal: DesignSystem.spacing.lg,
    gap: DesignSystem.spacing.lg,
  },
  pricingCard: {
    borderRadius: DesignSystem.borderRadius.xxl,
    overflow: 'hidden',
  },
  pricingCardGradient: {
    padding: DesignSystem.spacing.xxl,
    paddingTop: 15, // Reduced top padding since we're adding margin to planName
    position: 'relative',
  },
  
  // Role-Based View
  roleBasedSection: {
    marginHorizontal: DesignSystem.spacing.lg,
    borderRadius: DesignSystem.borderRadius.xl,
    overflow: 'hidden',
    marginBottom: DesignSystem.spacing.xl,
  },
  roleBasedGradient: {
    padding: DesignSystem.spacing.xl,
  },
  roleHeader: {
    alignItems: 'center',
    marginBottom: DesignSystem.spacing.xl,
  },
  roleHeaderIcon: {
    fontSize: 48,
    marginBottom: DesignSystem.spacing.sm,
  },
  roleHeaderTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: DesignSystem.colors.text.primary,
    marginBottom: DesignSystem.spacing.sm,
  },
  roleHeaderDescription: {
    fontSize: 16,
    color: DesignSystem.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  roleSpecificPlans: {
    gap: DesignSystem.spacing.lg,
  },
  roleSpecificPlan: {
    borderRadius: DesignSystem.borderRadius.xl,
    overflow: 'hidden',
  },
  planCardGradient: {
    padding: DesignSystem.spacing.xl,
    paddingTop: 15, // Reduced top padding since we're adding margin to planName
    position: 'relative',
  },

  // Plan Card Content
  popularBadge: {
    position: 'absolute',
    top: 15,
    right: 15,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 15,
    paddingHorizontal: 12,
    paddingVertical: 6,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  popularText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 1,
  },
  planName: {
    fontSize: 24,
    fontWeight: '900',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
    marginTop: 45, // Add top margin to avoid overlap with popular badge
    ...({ textShadow: { color: 'rgba(0,0,0,0.8)', offset: { width: 1, height: 1 }, radius: 2 } } as any),
  },
  planPrice: {
    fontSize: 32,
    fontWeight: '900',
    color: '#ffffff',
    textAlign: 'center',
    ...({ textShadow: { color: 'rgba(0,0,0,0.8)', offset: { width: 1, height: 1 }, radius: 2 } } as any),
  },
  planPeriod: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  planTrialInfo: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 4,
    fontWeight: '500',
    fontStyle: 'italic',
  },
  planDescription: {
    fontSize: 14,
    color: '#ffffff',
    textAlign: 'center',
    marginVertical: 15,
    lineHeight: 18,
    opacity: 0.9,
  },
  featuresContainer: {
    marginVertical: 20,
  },
  featureItem: {
    fontSize: 14,
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
    opacity: 0.9,
  },
  planTargetRoles: {
    marginVertical: 15,
    alignItems: 'center',
  },
  targetRolesLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
    opacity: 0.8,
  },
  targetRolesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  targetRole: {
    fontSize: 11,
    color: '#ffffff',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  readMoreButton: {
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 8,
  },
  readMoreText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.9,
  },
  
  // Role-Specific Benefits
  roleSpecificBenefits: {
    marginVertical: DesignSystem.spacing.md,
  },
  benefitsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: DesignSystem.spacing.sm,
    ...(Platform.OS !== 'web' ? {
      textShadowColor: 'rgba(0,0,0,0.6)',
      textShadowOffset: { width: 1, height: 1 },
      textShadowRadius: 1,
    } : {}),
  },
  roleBenefit: {
    fontSize: 14,
    color: '#ffffff',
    marginBottom: 6,
    textAlign: 'center',
    opacity: 0.9,
  },
  
  selectPlanButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 12,
    borderRadius: 20,
    marginTop: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  selectPlanButtonLoading: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderColor: 'rgba(255,255,255,0.2)',
  },
  selectPlanText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
    letterSpacing: 1,
    ...(Platform.OS !== 'web' ? {
      textShadowColor: 'rgba(0,0,0,0.6)',
      textShadowOffset: { width: 1, height: 1 },
      textShadowRadius: 2,
    } : {}),
  },

  // Comparison Table
  comparisonSection: {
    marginHorizontal: DesignSystem.spacing.lg,
    marginVertical: DesignSystem.spacing.xl,
  },
  comparisonTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: DesignSystem.colors.text.primary,
    textAlign: 'center',
    marginBottom: DesignSystem.spacing.lg,
  },
  comparisonTable: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: DesignSystem.borderRadius.lg,
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
    color: DesignSystem.colors.text.primary,
  },
  comparisonPlanHeader: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: DesignSystem.colors.text.quantum,
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
    color: DesignSystem.colors.text.primary,
  },
  comparisonValue: {
    flex: 1,
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '600',
  },

  // Trust Signals
  trustSignals: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginHorizontal: DesignSystem.spacing.xl,
    marginVertical: DesignSystem.spacing.xl,
  },
  trustSignal: {
    alignItems: 'center',
  },
  trustIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  trustText: {
    fontSize: 12,
    fontWeight: '600',
    color: DesignSystem.colors.text.secondary,
    textAlign: 'center',
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 1000,
    elevation: 1000, // For Android
    position: 'relative',
  },
  roleModalContent: {
    width: '100%',
    maxWidth: 600,
    maxHeight: '90%',
    borderRadius: DesignSystem.borderRadius.xxl,
    overflow: 'hidden',
    zIndex: 1001,
    elevation: 1001, // For Android
  },
  roleModalGradient: {
    padding: 30,
    position: 'relative',
  },
  scrollArea: {
    width: '100%',
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
    color: DesignSystem.colors.text.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  roleModalSubtitle: {
    fontSize: 16,
    color: DesignSystem.colors.text.secondary,
    textAlign: 'center',
    marginBottom: 25,
  },
  rolesGrid: {
    gap: 15,
  },
  roleCard: {
    borderRadius: DesignSystem.borderRadius.lg,
    overflow: 'hidden',
  },
  roleCardGradient: {
    padding: DesignSystem.spacing.xl,
    alignItems: 'center',
  },
  roleIcon: {
    fontSize: 32,
    marginBottom: 10,
  },
  roleTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
    ...(Platform.OS !== 'web' ? {
      textShadowColor: 'rgba(0,0,0,0.4)',
      textShadowOffset: { width: 0.5, height: 0.5 },
      textShadowRadius: 1,
    } : {}),
  },
  roleSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 8,
  },
  roleDescription: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    lineHeight: 18,
  },

  // Alert Modal Styles
  alertModalContent: {
    width: '90%',
    maxWidth: 400,
    borderRadius: DesignSystem.borderRadius.xl,
    overflow: 'hidden',
  },
  alertModalGradient: {
    padding: 30,
    alignItems: 'center',
  },
  alertTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 12,
  },
  alertMessage: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 30,
  },
  alertButtons: {
    flexDirection: 'row',
    gap: 15,
    width: '100%',
  },
  authButtonsContainer: {
    gap: 12,
    width: '100%',
  },
  alertButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: DesignSystem.borderRadius.lg,
    alignItems: 'center',
  },
  alertButtonPrimary: {
    backgroundColor: '#ffffff',
  },
  alertButtonSecondary: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  alertButtonTextPrimary: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
  },
  alertButtonTextSecondary: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  alertButtonCancel: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  alertButtonTextCancel: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.7)',
    textDecorationLine: 'underline',
  },
});

export default PricingComponent;
