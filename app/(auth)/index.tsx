import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, Animated } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthConsumer } from '@/contexts/NoHooksAuthContext';
import { Ionicons } from '@expo/vector-icons';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

class AuthWelcomeScreen extends React.Component {
  render() {
    return (
      <AuthConsumer>
        {({ user, loading }) => {
          // Auto-redirect if user is logged in
          if (user && !loading) {
            setTimeout(() => router.replace('/(tabs)'), 100);
          }

          if (loading) {
            return <LoadingSpinner message="Loading EduDash Pro..." showGradient={true} />;
          }

          return (
            <SafeAreaView style={styles.container}>
              <ScrollView 
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
              >
                <LinearGradient
                  colors={['#1e3a8a', '#1e40af', '#3b82f6']}
                  style={styles.headerGradient}
                >
                  {/* Hero Section */}
                  <View style={styles.heroSection}>
                    <View style={styles.logoContainer}>
                      <LinearGradient
                        colors={['#ffffff20', '#ffffff10']}
                        style={styles.logoWrapper}
                      >
                        <Ionicons name="school" size={50} color="white" />
                      </LinearGradient>
                      <Text style={styles.appName}>EduDash Pro</Text>
                      <Text style={styles.tagline}>AI-Powered Educational Platform</Text>
                    </View>

                    <View style={styles.heroContent}>
                      <Text style={styles.heroTitle}>
                        Transform Education with AI
                      </Text>
                      <Text style={styles.heroSubtitle}>
                        Connect principals, teachers, and parents in one intelligent ecosystem
                      </Text>
                    </View>
                  </View>
                </LinearGradient>

                {/* Features Section */}
                <View style={styles.featuresSection}>
                  <Text style={styles.featuresTitle}>Why Choose EduDash Pro?</Text>
                  
                  <View style={styles.featureGrid}>
                    <View style={styles.featureCard}>
                      <View style={styles.featureIcon}>
                        <Ionicons name="bulb" size={24} color="#1e40af" />
                      </View>
                      <Text style={styles.featureTitle}>AI-Generated Lessons</Text>
                      <Text style={styles.featureDescription}>
                        Create personalized lessons with Claude AI integration
                      </Text>
                    </View>

                    <View style={styles.featureCard}>
                      <View style={styles.featureIcon}>
                        <Ionicons name="analytics" size={24} color="#1e40af" />
                      </View>
                      <Text style={styles.featureTitle}>Smart Analytics</Text>
                      <Text style={styles.featureDescription}>
                        Track progress with intelligent insights and reports
                      </Text>
                    </View>

                    <View style={styles.featureCard}>
                      <View style={styles.featureIcon}>
                        <Ionicons name="people" size={24} color="#1e40af" />
                      </View>
                      <Text style={styles.featureTitle}>Multi-Tenant Support</Text>
                      <Text style={styles.featureDescription}>
                        Manage multiple schools with role-based access
                      </Text>
                    </View>

                    <View style={styles.featureCard}>
                      <View style={styles.featureIcon}>
                        <Ionicons name="phone-portrait" size={24} color="#1e40af" />
                      </View>
                      <Text style={styles.featureTitle}>Mobile-First Design</Text>
                      <Text style={styles.featureDescription}>
                        Native-like experience across all devices
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Role Selection Section */}
                <View style={styles.roleSection}>
                  <Text style={styles.roleSectionTitle}>Choose Your Role</Text>
                  <Text style={styles.roleSectionSubtitle}>
                    Get started with the perfect dashboard for your needs
                  </Text>

                  <View style={styles.roleCards}>
                    <View style={styles.principalCardContainer}>
                      <TouchableOpacity 
                        style={[styles.roleCard, styles.principalCard]}
                        onPress={() => router.push('/(auth)/request-access')}
                        activeOpacity={0.8}
                      >
                        <LinearGradient
                          colors={['#1e40af', '#3b82f6', '#60a5fa']}
                          style={[styles.roleCardGradient, styles.principalCardGradient]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                        >
                          {/* Sparkle Animation Container */}
                          <View style={styles.sparkleContainer}>
                            <Ionicons name="sparkles" size={20} color="rgba(255,255,255,0.7)" style={styles.sparkle1} />
                            <Ionicons name="sparkles" size={16} color="rgba(255,255,255,0.5)" style={styles.sparkle2} />
                            <Ionicons name="sparkles" size={12} color="rgba(255,255,255,0.6)" style={styles.sparkle3} />
                          </View>
                          
                          <View style={styles.iconContainer}>
                            <Ionicons name="school" size={36} color="white" />
                          </View>
                          
                          <Text style={styles.roleCardTitle}>🎓 Principal</Text>
                          <Text style={styles.principalHook}>Own a Preschool?</Text>
                          
                          <View style={styles.ctaContainer}>
                            <Text style={styles.requestAccessText}>🚀 JOIN THE REVOLUTION</Text>
                            <Text style={styles.requestSubtext}>Get Your School On Board</Text>
                          </View>
                          
                          <View style={styles.benefitBadge}>
                            <Text style={styles.benefitText}>✨ FREE SETUP</Text>
                          </View>
                        </LinearGradient>
                      </TouchableOpacity>
                      
                      <View style={styles.principalNoteContainer}>
                        <Text style={styles.principalNote}>
                          💡 <Text style={styles.principalNoteHighlight}>Already approved?</Text> <Text 
                            style={styles.signInLink}
                            onPress={() => router.push('/(auth)/sign-in')}
                          >
                            Sign in here →
                          </Text>
                        </Text>
                      </View>
                    </View>

                    <TouchableOpacity 
                      style={styles.roleCard}
                      onPress={() => router.push('/(auth)/sign-up')}
                    >
                      <LinearGradient
                        colors={['#374151', '#4b5563', '#6b7280']}
                        style={styles.roleCardGradient}
                      >
                        <Ionicons name="person-outline" size={32} color="white" />
                        <Text style={styles.roleCardTitle}>Teacher</Text>
                        <Text style={styles.roleCardSubtitle}>Create lessons and track progress</Text>
                      </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={styles.roleCard}
                      onPress={() => router.push('/(auth)/parent-signup')}
                    >
                      <LinearGradient
                        colors={['#1f2937', '#374151', '#4b5563']}
                        style={styles.roleCardGradient}
                      >
                        <Ionicons name="heart-outline" size={32} color="white" />
                        <Text style={styles.roleCardTitle}>Parent</Text>
                        <Text style={styles.roleCardSubtitle}>Monitor child's progress</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Auth Buttons */}
                <View style={styles.authSection}>
                  <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={() => router.push('/(auth)/sign-in')}
                  >
                    <LinearGradient
                      colors={['#1e40af', '#3b82f6']}
                      style={styles.primaryButtonGradient}
                    >
                      <Text style={styles.primaryButtonText}>Sign In to Your Account</Text>
                    </LinearGradient>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={() => router.push('/(auth)/sign-up')}
                  >
                    <Text style={styles.secondaryButtonText}>Create New Account</Text>
                  </TouchableOpacity>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                  <Text style={styles.footerText}>
                    By continuing, you agree to our Terms of Service and Privacy Policy
                  </Text>
                  <View style={styles.footerLinks}>
                    <Text style={styles.footerLink}>Help Center</Text>
                    <Text style={styles.footerDivider}>•</Text>
                    <Text style={styles.footerLink}>Contact Support</Text>
                  </View>
                </View>
              </ScrollView>
            </SafeAreaView>
          );
        }}
      </AuthConsumer>
    );
  }
}

export default AuthWelcomeScreen;

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  
  // Hero Section
  headerGradient: {
    paddingTop: 20,
    paddingBottom: 40,
  },
  heroSection: {
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logoWrapper: {
    width: 100,
    height: 100,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  appName: {
    fontSize: 36,
    fontWeight: '800',
    color: 'white',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    fontWeight: '500',
  },
  heroContent: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: 'white',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 38,
  },
  heroSubtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 26,
    fontWeight: '400',
  },

  // Features Section
  featuresSection: {
    paddingHorizontal: 24,
    paddingVertical: 40,
    backgroundColor: 'white',
  },
  featuresTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 32,
  },
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  featureCard: {
    width: width * 0.42,
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  featureIcon: {
    width: 48,
    height: 48,
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  featureDescription: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },

  // Role Selection Section
  roleSection: {
    paddingHorizontal: 24,
    paddingVertical: 40,
    backgroundColor: '#f8fafc',
  },
  roleSectionTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 12,
  },
  roleSectionSubtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  roleCards: {
    gap: 16,
  },
  roleCard: {
    marginBottom: 16,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 8,
  },
  roleCardGradient: {
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
  },
  roleCardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
    marginTop: 12,
    marginBottom: 8,
  },
  roleCardSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    fontWeight: '500',
  },

  // Auth Section
  authSection: {
    paddingHorizontal: 24,
    paddingVertical: 32,
    backgroundColor: 'white',
  },
  primaryButton: {
    marginBottom: 16,
    borderRadius: 16,
    shadowColor: '#667eea',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  primaryButtonGradient: {
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  secondaryButton: {
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 16,
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#1e40af',
  },
  secondaryButtonText: {
    color: '#1e40af',
    fontSize: 18,
    fontWeight: '600',
  },

  // Footer
  footer: {
    paddingHorizontal: 24,
    paddingVertical: 32,
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  footerText: {
    color: '#64748b',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  footerLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  footerLink: {
    color: '#1e40af',
    fontSize: 14,
    fontWeight: '500',
  },
  footerDivider: {
    color: '#cbd5e1',
    fontSize: 14,
  },

  // Principal Card Specific Styles
  principalCardContainer: {
    marginBottom: 24,
  },
  principalCard: {
    transform: [{ scale: 1.02 }],
    shadowColor: '#1e40af',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 15,
  },
  principalCardGradient: {
    padding: 28,
    position: 'relative',
    overflow: 'hidden',
  },
  sparkleContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
  sparkle1: {
    position: 'absolute',
    top: 20,
    right: 30,
  },
  sparkle2: {
    position: 'absolute',
    top: 60,
    left: 25,
  },
  sparkle3: {
    position: 'absolute',
    bottom: 30,
    right: 20,
  },
  iconContainer: {
    marginBottom: 8,
  },
  principalHook: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.95)',
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  ctaContainer: {
    alignItems: 'center',
    marginVertical: 12,
  },
  requestAccessText: {
    fontSize: 18,
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    marginBottom: 4,
  },
  requestSubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    fontWeight: '600',
  },
  benefitBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  benefitText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  principalNoteContainer: {
    backgroundColor: 'rgba(74, 172, 254, 0.1)',
    padding: 12,
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(74, 172, 254, 0.2)',
  },
  principalNote: {
    textAlign: 'center',
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
    lineHeight: 20,
  },
  principalNoteHighlight: {
    color: '#1e293b',
    fontWeight: '700',
  },
  signInLink: {
    color: '#4facfe',
    fontWeight: '800',
    textDecorationLine: 'underline',
  },

  // Loading State
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748b',
    fontWeight: '500',
  },
});
