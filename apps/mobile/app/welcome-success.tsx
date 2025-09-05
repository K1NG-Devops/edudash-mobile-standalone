import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { DesignSystem } from '@/constants/DesignSystem';
import { AuthConsumer } from '@/contexts/SimpleWorkingAuth';

export default function WelcomeSuccess() {
  const [countdown, setCountdown] = useState(3);
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleRedirect();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleRedirect = () => {
    setIsRedirecting(true);
    // Use replace to prevent going back to this screen
    router.replace('/(tabs)/dashboard');
  };

  const handleGoNow = () => {
    setCountdown(0);
    handleRedirect();
  };

  return (
    <AuthConsumer>
      {(authState) => (
        <View style={styles.container}>
          <LinearGradient colors={['#0a0a0f', '#1a0a2e', '#16213e']} style={styles.gradient}>
            <SafeAreaView style={styles.safeArea}>
              <View style={styles.content}>
                {/* Success Icon */}
                <View style={styles.iconContainer}>
                  <LinearGradient colors={DesignSystem.gradients.primary} style={styles.iconGradient}>
                    <IconSymbol name="checkmark.circle.fill" size={64} color="#000000" />
                  </LinearGradient>
                </View>

                {/* Welcome Message */}
                <Text style={styles.title}>Welcome to EduDash Pro!</Text>
                <Text style={styles.subtitle}>
                  Your account has been created successfully.{'\n'}
                  {authState?.user?.email ? `Signed in as ${authState.user.email}` : 'You are now signed in.'}
                </Text>

                {/* Features Preview */}
                <View style={styles.featuresContainer}>
                  <Text style={styles.featuresTitle}>Get ready to explore:</Text>
                  <View style={styles.featuresList}>
                    <View style={styles.featureItem}>
                      <IconSymbol name="brain" size={20} color="#00f5ff" />
                      <Text style={styles.featureText}>AI-powered lesson generation</Text>
                    </View>
                    <View style={styles.featureItem}>
                      <IconSymbol name="chart.bar" size={20} color="#00f5ff" />
                      <Text style={styles.featureText}>Student progress tracking</Text>
                    </View>
                    <View style={styles.featureItem}>
                      <IconSymbol name="person.3" size={20} color="#00f5ff" />
                      <Text style={styles.featureText}>Class management tools</Text>
                    </View>
                    <View style={styles.featureItem}>
                      <IconSymbol name="lightbulb" size={20} color="#00f5ff" />
                      <Text style={styles.featureText}>Interactive learning activities</Text>
                    </View>
                  </View>
                </View>

                {/* Countdown and Action */}
                <View style={styles.actionContainer}>
                  {isRedirecting ? (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator size="large" color="#00f5ff" />
                      <Text style={styles.loadingText}>Loading your dashboard...</Text>
                    </View>
                  ) : (
                    <>
                      <Text style={styles.countdownText}>
                        Redirecting to your dashboard in {countdown} seconds...
                      </Text>
                      <TouchableOpacity style={styles.actionButton} onPress={handleGoNow}>
                        <LinearGradient colors={DesignSystem.gradients.primary} style={styles.buttonGradient}>
                          <Text style={styles.buttonText}>Go to Dashboard Now</Text>
                          <IconSymbol name="arrow.right" size={16} color="#000000" />
                        </LinearGradient>
                      </TouchableOpacity>
                    </>
                  )}
                </View>

                {/* Trust Indicators */}
                <View style={styles.trustContainer}>
                  <View style={styles.trustBadges}>
                    <View style={styles.trustBadge}>
                      <Text style={styles.trustBadgeIcon}>🛡️</Text>
                      <Text style={styles.trustBadgeText}>Secure</Text>
                    </View>
                    <View style={styles.trustBadge}>
                      <Text style={styles.trustBadgeIcon}>🔒</Text>
                      <Text style={styles.trustBadgeText}>Private</Text>
                    </View>
                    <View style={styles.trustBadge}>
                      <Text style={styles.trustBadgeIcon}>👶</Text>
                      <Text style={styles.trustBadgeText}>Child Safe</Text>
                    </View>
                  </View>
                </View>
              </View>
            </SafeAreaView>
          </LinearGradient>
        </View>
      )}
    </AuthConsumer>
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
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  iconContainer: {
    marginBottom: 32,
  },
  iconGradient: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#cccccc',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
  },
  featuresContainer: {
    width: '100%',
    marginBottom: 40,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 20,
  },
  featuresList: {
    gap: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    gap: 12,
  },
  featureText: {
    fontSize: 16,
    color: '#ffffff',
    flex: 1,
  },
  actionContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 40,
  },
  loadingContainer: {
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#cccccc',
  },
  countdownText: {
    fontSize: 14,
    color: '#888888',
    textAlign: 'center',
    marginBottom: 20,
  },
  actionButton: {
    width: '100%',
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
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
  },
  trustContainer: {
    alignItems: 'center',
  },
  trustBadges: {
    flexDirection: 'row',
    gap: 24,
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
