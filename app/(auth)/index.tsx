import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
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
                  colors={['#667eea', '#764ba2']}
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
                        <Ionicons name="bulb" size={24} color="#667eea" />
                      </View>
                      <Text style={styles.featureTitle}>AI-Generated Lessons</Text>
                      <Text style={styles.featureDescription}>
                        Create personalized lessons with Claude AI integration
                      </Text>
                    </View>

                    <View style={styles.featureCard}>
                      <View style={styles.featureIcon}>
                        <Ionicons name="analytics" size={24} color="#667eea" />
                      </View>
                      <Text style={styles.featureTitle}>Smart Analytics</Text>
                      <Text style={styles.featureDescription}>
                        Track progress with intelligent insights and reports
                      </Text>
                    </View>

                    <View style={styles.featureCard}>
                      <View style={styles.featureIcon}>
                        <Ionicons name="people" size={24} color="#667eea" />
                      </View>
                      <Text style={styles.featureTitle}>Multi-Tenant Support</Text>
                      <Text style={styles.featureDescription}>
                        Manage multiple schools with role-based access
                      </Text>
                    </View>

                    <View style={styles.featureCard}>
                      <View style={styles.featureIcon}>
                        <Ionicons name="phone-portrait" size={24} color="#667eea" />
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
                    <TouchableOpacity 
                      style={styles.roleCard}
                      onPress={() => router.push('/(auth)/sign-up')}
                    >
                      <LinearGradient
                        colors={['#4facfe', '#00f2fe']}
                        style={styles.roleCardGradient}
                      >
                        <Ionicons name="school-outline" size={32} color="white" />
                        <Text style={styles.roleCardTitle}>Principal</Text>
                        <Text style={styles.roleCardSubtitle}>Manage schools and staff</Text>
                      </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={styles.roleCard}
                      onPress={() => router.push('/(auth)/sign-up')}
                    >
                      <LinearGradient
                        colors={['#a8edea', '#fed6e3']}
                        style={styles.roleCardGradient}
                      >
                        <Ionicons name="person-outline" size={32} color="#333" />
                        <Text style={[styles.roleCardTitle, { color: '#333' }]}>Teacher</Text>
                        <Text style={[styles.roleCardSubtitle, { color: '#666' }]}>Create lessons and track progress</Text>
                      </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={styles.roleCard}
                      onPress={() => router.push('/(auth)/parent-signup')}
                    >
                      <LinearGradient
                        colors={['#ffecd2', '#fcb69f']}
                        style={styles.roleCardGradient}
                      >
                        <Ionicons name="heart-outline" size={32} color="#333" />
                        <Text style={[styles.roleCardTitle, { color: '#333' }]}>Parent</Text>
                        <Text style={[styles.roleCardSubtitle, { color: '#666' }]}>Monitor child's progress</Text>
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
                      colors={['#667eea', '#764ba2']}
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
    borderColor: '#667eea',
  },
  secondaryButtonText: {
    color: '#667eea',
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
    color: '#667eea',
    fontSize: 14,
    fontWeight: '500',
  },
  footerDivider: {
    color: '#cbd5e1',
    fontSize: 14,
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
