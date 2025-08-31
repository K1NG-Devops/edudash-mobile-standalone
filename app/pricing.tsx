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
import { useAuth } from '@/contexts/SimpleWorkingAuth';
import AdZone from '@/components/ui/AdZone';
import { PricingComponent } from '@/components/pricing/PricingComponent';

const { width } = Dimensions.get('window');

// Standalone Pricing Page - No Authentication Required
export default function PricingPage() {
  const { user, profile } = useAuth();
  const roleStr = (profile?.role ?? undefined) as string | undefined;
  const isPrincipal = !!(roleStr === 'preschool_admin' || roleStr === 'principal');
  const floatingAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Floating animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatingAnimation, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(floatingAnimation, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ])
    ).start();
  }, []);


  return (
    <AdZone>
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
              onPress={() => {
                // Check if we can go back, otherwise navigate to home
                if (router.canGoBack()) {
                  router.back();
                } else {
                  router.push('/');
                }
              }}
              accessibilityRole="button"
              accessibilityLabel="Go back"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
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
                <Text style={styles.headerTitle}>Pricing</Text>
              </Animated.View>
            </View>
          </SafeAreaView>
        </LinearGradient>


        {/* Pricing Plans */}
        <View style={styles.pricingSection}>
          <LinearGradient colors={DesignSystem.gradients.professionalSubtle} style={styles.sectionGradient}>
            <Text style={styles.pricingTitle}>Pricing</Text>
            <Text style={styles.pricingSubtitle}>
              Transparent pricing • No hidden fees • Start free today
            </Text>

            <PricingComponent
              embedded={false}
              showRoles={true}
              showComparison={false}
              compactMode={width < 480}
              defaultSelectedRole={isPrincipal ? 'principal' : null}
              initialView={isPrincipal ? 'role-specific' : 'overview'}
              theme="professional"
              showUsageTracking={false}
            />
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

      </View>
    </AdZone>
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
    paddingBottom: 120, // ensure content doesn't collide with bottom nav
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
