import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Animated, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthConsumer } from '@/contexts/SimpleWorkingAuth';
import { IconSymbol } from '@/components/ui/IconSymbol';

const { width, height } = Dimensions.get('window');

class WelcomeScreen extends React.Component {
  private hasRedirected = false;

  componentDidUpdate() {
    // This will be called by the parent when auth state changes
    // We handle redirect logic in renderContent
  }

  renderContent = (auth: any) => {
    const { user, loading } = auth;

    // Auto-redirect if user is logged in (but avoid during render)
    if (user && !loading && !this.hasRedirected) {
      this.hasRedirected = true;
      // Use setTimeout to avoid setState during render
      setTimeout(() => {
        router.replace('/(tabs)/dashboard');
      }, 0);
      return null;
    }

    // Reset redirect flag if user is signed out
    if (!user && !loading) {
      this.hasRedirected = false;
    }

    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      );
    }

    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={['#3B82F6', '#1E40AF', '#1E3A8A']}
          style={styles.gradient}
        >
          <View style={styles.content}>
            {/* App Logo/Icon */}
            <View style={styles.logoContainer}>
              <View style={styles.logoPlaceholder}>
                <Text style={styles.logoText}>📚</Text>
              </View>
              <Text style={styles.appName}>EduDash Pro</Text>
              <Text style={styles.tagline}>Empowering Education Through Technology</Text>
            </View>

            {/* Main Content */}
            <View style={styles.mainContent}>
              <Text style={styles.welcomeTitle}>Welcome to the Future of Education</Text>
              <Text style={styles.welcomeSubtitle}>
                Connect teachers, parents, and students in one powerful platform
              </Text>
            </View>

            {/* Auth Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.primaryButton]}
                onPress={() => router.push('/(auth)/sign-in')}
              >
                <Text style={styles.primaryButtonText}>Sign In</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.secondaryButton]}
                onPress={() => router.push('/(auth)/sign-up')}
              >
                <Text style={styles.secondaryButtonText}>Create Account</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.requestAccessButton]}
                onPress={() => router.push('/(auth)/request-access')}
              >
                <Text style={styles.requestAccessButtonText}>Request Preschool Access</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.parentSignupButton}
                onPress={() => router.push('/(auth)/parent-signup')}
              >
                <Text style={styles.parentSignupText}>Join as Parent →</Text>
              </TouchableOpacity>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                By continuing, you agree to our Terms of Service and Privacy Policy
              </Text>
            </View>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  };

  render() {
    return (
      <AuthConsumer>
        {(auth) => this.renderContent(auth)}
      </AuthConsumer>
    );
  }
}

export default WelcomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 60,
  },
  logoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoText: {
    fontSize: 40,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  mainContent: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 34,
  },
  welcomeSubtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 24,
  },
  buttonContainer: {
    marginBottom: 40,
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  primaryButton: {
    backgroundColor: 'white',
  },
  primaryButtonText: {
    color: '#1E40AF',
    fontSize: 18,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: 'white',
  },
  secondaryButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  requestAccessButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
  },
  requestAccessButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  parentSignupButton: {
    alignItems: 'center',
    marginTop: 16,
  },
  parentSignupText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 16,
    fontWeight: '500',
  },
  footer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  footerText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
});
