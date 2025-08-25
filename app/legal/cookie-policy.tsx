import React from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet, 
  Dimensions 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { IconSymbol } from '@/components/ui/IconSymbol';

const { width, height } = Dimensions.get('window');

export default function CookiePolicyPage() {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0a0a0f', '#1a0a2e', '#16213e']}
        style={styles.gradient}
      >
        <SafeAreaView style={styles.safeArea}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <LinearGradient
                colors={['rgba(0,245,255,0.2)', 'rgba(128,0,255,0.2)']}
                style={styles.backButtonGradient}
              >
                <IconSymbol name="chevron.left" size={20} color="#00f5ff" />
              </LinearGradient>
            </TouchableOpacity>
            
            <View style={styles.titleContainer}>
              <Text style={styles.title}>Cookie Policy</Text>
              <Text style={styles.subtitle}>Data Collection & Privacy</Text>
            </View>
          </View>

          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            <View style={styles.content}>
              
              {/* Last Updated */}
              <View style={styles.section}>
                <Text style={styles.lastUpdated}>Last Updated: January 2025</Text>
              </View>

              {/* What are Cookies */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>🍪 What are Cookies?</Text>
                <Text style={styles.text}>
                  Cookies are small text files that are placed on your device when you visit our website. 
                  They help us provide you with a better experience by remembering your preferences and 
                  improving our services.
                </Text>
              </View>

              {/* Types of Cookies */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>📋 Types of Cookies We Use</Text>
                
                <Text style={styles.subTitle}>Essential Cookies:</Text>
                <Text style={styles.bulletText}>• Necessary for the website to function properly</Text>
                <Text style={styles.bulletText}>• Enable basic functions like page navigation and authentication</Text>
                <Text style={styles.bulletText}>• Access to secure areas of the platform</Text>
                
                <Text style={styles.subTitle}>Performance Cookies:</Text>
                <Text style={styles.bulletText}>• Help us understand how visitors interact with our website</Text>
                <Text style={styles.bulletText}>• Collect and report information anonymously</Text>
                <Text style={styles.bulletText}>• Used to improve our services</Text>
                
                <Text style={styles.subTitle}>Functionality Cookies:</Text>
                <Text style={styles.bulletText}>• Enable enhanced functionality and personalization</Text>
                <Text style={styles.bulletText}>• Remember your preferences and settings</Text>
                <Text style={styles.bulletText}>• Provide customized experience</Text>
              </View>

              {/* Third-Party Cookies */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>🔗 Third-Party Cookies</Text>
                <Text style={styles.text}>
                  We may use third-party services that set cookies on your device:
                </Text>
                <Text style={styles.bulletText}>• Google Analytics (for website analytics)</Text>
                <Text style={styles.bulletText}>• Supabase (for authentication and data storage)</Text>
                <Text style={styles.bulletText}>• AdMob (for advertising on free tier)</Text>
                <Text style={styles.bulletText}>• OneSignal (for push notifications)</Text>
              </View>

              {/* Child Privacy */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>👶 Child Privacy Protection</Text>
                <Text style={styles.text}>
                  As an educational platform serving children, we take special care with cookies:
                </Text>
                <Text style={styles.bulletText}>• We do not use advertising cookies for users under 13</Text>
                <Text style={styles.bulletText}>• Essential and functionality cookies only for child accounts</Text>
                <Text style={styles.bulletText}>• Parental consent required for any data collection from children</Text>
                <Text style={styles.bulletText}>• Strict compliance with POPIA and international child privacy laws</Text>
              </View>

              {/* Managing Cookies */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>⚙️ Managing Cookies</Text>
                <Text style={styles.text}>You can control and manage cookies in several ways:</Text>
                <Text style={styles.bulletText}>• Most browsers allow you to refuse cookies or delete cookies</Text>
                <Text style={styles.bulletText}>• You can usually find these settings in the "Preferences" or "Settings" menu</Text>
                <Text style={styles.bulletText}>• Note that disabling essential cookies may affect website functionality</Text>
                <Text style={styles.bulletText}>• You can opt out of advertising cookies through industry opt-out programs</Text>
              </View>

              {/* Contact Information */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>📞 Contact Us</Text>
                <Text style={styles.text}>
                  If you have any questions about our use of cookies, please contact us:
                </Text>
                <Text style={styles.contactText}>📧 privacy@edudashpro.com</Text>
                <Text style={styles.contactText}>📞 +27 67 477 0975</Text>
                <Text style={styles.contactText}>🏢 848 Shabangu Avenue, Mamelodi, Pretoria 0122</Text>
              </View>

              {/* Footer Space */}
              <View style={styles.footer} />
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
    backgroundColor: '#0a0a0f',
  },
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  backButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: 15,
  },
  backButtonGradient: {
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#00f5ff',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 30,
  },
  lastUpdated: {
    fontSize: 12,
    color: '#888888',
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#00f5ff',
    marginBottom: 15,
  },
  subTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 10,
    marginTop: 15,
  },
  text: {
    fontSize: 14,
    color: '#CCCCCC',
    lineHeight: 22,
    marginBottom: 12,
  },
  bulletText: {
    fontSize: 14,
    color: '#CCCCCC',
    lineHeight: 22,
    marginBottom: 8,
    marginLeft: 10,
  },
  contactText: {
    fontSize: 14,
    color: '#00f5ff',
    lineHeight: 22,
    marginBottom: 8,
    fontWeight: '600',
  },
  footer: {
    height: 50,
  },
});
