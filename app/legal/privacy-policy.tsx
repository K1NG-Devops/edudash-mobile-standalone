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

export default function PrivacyPolicyPage() {
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
              <Text style={styles.title}>Privacy Policy</Text>
              <Text style={styles.subtitle}>Child Safety & Data Protection</Text>
            </View>
          </View>

          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            <View style={styles.content}>
              
              {/* Last Updated */}
              <View style={styles.section}>
                <Text style={styles.lastUpdated}>Last Updated: January 2025</Text>
              </View>

              {/* Introduction */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>🛡️ Our Commitment to Child Safety</Text>
                <Text style={styles.text}>
                  EduDash Pro (Pty) Ltd is committed to protecting the privacy and safety of children. 
                  This Privacy Policy explains how we collect, use, and safeguard information in our 
                  educational platform designed for children aged 1-18.
                </Text>
                <Text style={styles.text}>
                  We comply with the Children's Online Privacy Protection Act (COPPA), General Data 
                  Protection Regulation (GDPR), and South Africa's Protection of Personal Information 
                  Act (POPIA).
                </Text>
              </View>

              {/* Information We Collect */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>📊 Information We Collect</Text>
                
                <Text style={styles.subTitle}>For Children Under 13:</Text>
                <Text style={styles.bulletText}>• Name (first name only, when necessary)</Text>
                <Text style={styles.bulletText}>• Age/Date of birth (for age-appropriate content)</Text>
                <Text style={styles.bulletText}>• Educational progress and achievements</Text>
                <Text style={styles.bulletText}>• Homework submissions and photos (with parental consent)</Text>
                <Text style={styles.bulletText}>• Basic usage data to improve our services</Text>
                
                <Text style={styles.subTitle}>For Parents/Guardians:</Text>
                <Text style={styles.bulletText}>• Contact information (email, phone number)</Text>
                <Text style={styles.bulletText}>• Account credentials</Text>
                <Text style={styles.bulletText}>• Communication preferences</Text>
                <Text style={styles.bulletText}>• Payment information (processed securely by third parties)</Text>
                
                <Text style={styles.subTitle}>For Teachers/Educators:</Text>
                <Text style={styles.bulletText}>• Professional information and qualifications</Text>
                <Text style={styles.bulletText}>• Lesson plans and educational content created</Text>
                <Text style={styles.bulletText}>• Usage analytics to improve teaching tools</Text>
              </View>

              {/* How We Use Information */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>🎯 How We Use Your Information</Text>
                <Text style={styles.bulletText}>• Provide age-appropriate educational content</Text>
                <Text style={styles.bulletText}>• Track learning progress and achievements</Text>
                <Text style={styles.bulletText}>• Enable parent-teacher communication</Text>
                <Text style={styles.bulletText}>• Generate AI-powered lesson plans and activities</Text>
                <Text style={styles.bulletText}>• Ensure platform safety and security</Text>
                <Text style={styles.bulletText}>• Comply with legal obligations</Text>
                <Text style={styles.bulletText}>• Improve our services (with anonymized data)</Text>
              </View>

              {/* Child Safety Measures */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>👶 Child Safety Measures</Text>
                <Text style={styles.bulletText}>• No direct marketing to children under 13</Text>
                <Text style={styles.bulletText}>• All content is age-appropriate and educationally focused</Text>
                <Text style={styles.bulletText}>• No public profiles or social features for children</Text>
                <Text style={styles.bulletText}>• Parental consent required for children under 13</Text>
                <Text style={styles.bulletText}>• Regular content moderation and safety reviews</Text>
                <Text style={styles.bulletText}>• Secure data transmission and storage</Text>
                <Text style={styles.bulletText}>• Limited data collection - only what's necessary</Text>
              </View>

              {/* Parental Rights */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>👨‍👩‍👧‍👦 Parental Rights & Control</Text>
                <Text style={styles.text}>Parents and guardians have the right to:</Text>
                <Text style={styles.bulletText}>• Review their child's personal information</Text>
                <Text style={styles.bulletText}>• Request deletion of their child's account</Text>
                <Text style={styles.bulletText}>• Refuse further collection of their child's information</Text>
                <Text style={styles.bulletText}>• Control communication settings</Text>
                <Text style={styles.bulletText}>• Access their child's educational progress data</Text>
                <Text style={styles.bulletText}>• Report safety concerns immediately</Text>
              </View>

              {/* Data Security */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>🔒 Data Security</Text>
                <Text style={styles.text}>
                  We implement industry-standard security measures:
                </Text>
                <Text style={styles.bulletText}>• End-to-end encryption for sensitive data</Text>
                <Text style={styles.bulletText}>• Secure servers located in South Africa</Text>
                <Text style={styles.bulletText}>• Regular security audits and monitoring</Text>
                <Text style={styles.bulletText}>• Limited access to personal information</Text>
                <Text style={styles.bulletText}>• Automated data backup and recovery</Text>
                <Text style={styles.bulletText}>• Staff training on data protection</Text>
              </View>

              {/* Third Party Services */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>🤝 Third-Party Services</Text>
                <Text style={styles.text}>
                  We may use child-safe, educational third-party services:
                </Text>
                <Text style={styles.bulletText}>• Anthropic Claude AI (for educational content generation)</Text>
                <Text style={styles.bulletText}>• Cloud storage providers (for secure data storage)</Text>
                <Text style={styles.bulletText}>• Payment processors (for subscription management)</Text>
                <Text style={styles.bulletText}>• Analytics providers (with anonymized data only)</Text>
                
                <Text style={styles.text}>
                  All third parties are required to maintain the same level of child protection 
                  and data security as EduDash Pro.
                </Text>
              </View>

              {/* International Transfers */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>🌍 International Data Transfers</Text>
                <Text style={styles.text}>
                  Your data is primarily stored in South Africa. If we need to transfer data 
                  internationally for AI processing or other services, we ensure:
                </Text>
                <Text style={styles.bulletText}>• Adequate protection measures are in place</Text>
                <Text style={styles.bulletText}>• Compliance with GDPR adequacy requirements</Text>
                <Text style={styles.bulletText}>• Contractual safeguards with service providers</Text>
                <Text style={styles.bulletText}>• Parental notification where required</Text>
              </View>

              {/* Your Rights Under POPIA & GDPR */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>⚖️ Your Rights Under POPIA & GDPR</Text>
                <Text style={styles.text}>You have the right to:</Text>
                <Text style={styles.bulletText}>• Access your personal information</Text>
                <Text style={styles.bulletText}>• Correct inaccurate information</Text>
                <Text style={styles.bulletText}>• Delete your account and data</Text>
                <Text style={styles.bulletText}>• Export your data</Text>
                <Text style={styles.bulletText}>• Restrict processing of your data</Text>
                <Text style={styles.bulletText}>• Object to processing for marketing purposes</Text>
                <Text style={styles.bulletText}>• Lodge a complaint with supervisory authorities</Text>
              </View>

              {/* Contact Information */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>📞 Contact Our Privacy Officer</Text>
                <Text style={styles.text}>
                  For privacy concerns or to exercise your rights, contact us:
                </Text>
                <Text style={styles.contactText}>📧 privacy@edudashpro.com</Text>
                <Text style={styles.contactText}>📞 +27 67 477 0975</Text>
                <Text style={styles.contactText}>🏢 848 Shabangu Avenue, Mamelodi, Pretoria 0122</Text>
                
                <Text style={styles.text}>
                  We will respond to privacy requests within 30 days, or sooner for urgent 
                  child safety matters.
                </Text>
              </View>

              {/* Changes to Policy */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>📝 Changes to This Policy</Text>
                <Text style={styles.text}>
                  We may update this Privacy Policy to reflect changes in our practices or legal 
                  requirements. We will notify parents and users of significant changes via email 
                  and in-app notifications.
                </Text>
              </View>

              {/* Emergency Contact */}
              <View style={styles.emergencySection}>
                <Text style={styles.emergencyTitle}>🚨 Child Safety Emergency</Text>
                <Text style={styles.emergencyText}>
                  If you have urgent concerns about child safety on our platform, 
                  contact us immediately:
                </Text>
                <Text style={styles.emergencyContact}>📞 +27 67 477 0975</Text>
                <Text style={styles.emergencyContact}>📧 safety@edudashpro.com</Text>
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
  emergencySection: {
    backgroundColor: 'rgba(255, 0, 128, 0.1)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: 'rgba(255, 0, 128, 0.3)',
  },
  emergencyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ff0080',
    marginBottom: 10,
  },
  emergencyText: {
    fontSize: 14,
    color: '#FFFFFF',
    lineHeight: 22,
    marginBottom: 12,
  },
  emergencyContact: {
    fontSize: 16,
    color: '#ff0080',
    fontWeight: '700',
    marginBottom: 8,
  },
  footer: {
    height: 50,
  },
});
