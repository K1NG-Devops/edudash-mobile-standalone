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

export default function TermsOfServicePage() {
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
              <Text style={styles.title}>Terms of Service</Text>
              <Text style={styles.subtitle}>Educational Platform Agreement</Text>
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
                <Text style={styles.sectionTitle}>📜 Agreement Overview</Text>
                <Text style={styles.text}>
                  These Terms of Service ("Terms") govern your use of EduDash Pro, an educational 
                  technology platform provided by EduDash Pro (Pty) Ltd, a company registered in 
                  South Africa (Company Registration: 2025/123456/07).
                </Text>
                <Text style={styles.text}>
                  By using our platform, you agree to these Terms. If you are under 18, 
                  your parent or guardian must agree to these Terms on your behalf.
                </Text>
              </View>

              {/* Service Description */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>🎓 Our Educational Service</Text>
                <Text style={styles.text}>
                  EduDash Pro provides:
                </Text>
                <Text style={styles.bulletText}>• AI-powered lesson planning and content generation</Text>
                <Text style={styles.bulletText}>• Student progress tracking and analytics</Text>
                <Text style={styles.bulletText}>• Parent-teacher communication tools</Text>
                <Text style={styles.bulletText}>• Educational activities and homework management</Text>
                <Text style={styles.bulletText}>• Age-appropriate learning content (ages 1-18)</Text>
                <Text style={styles.bulletText}>• School administration and management tools</Text>
              </View>

              {/* Child Safety Terms */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>👶 Child Safety & Protection</Text>
                <Text style={styles.text}>
                  We are committed to child safety. All users agree to:
                </Text>
                <Text style={styles.bulletText}>• Use the platform only for educational purposes</Text>
                <Text style={styles.bulletText}>• Report any inappropriate content or behavior immediately</Text>
                <Text style={styles.bulletText}>• Ensure all shared content is age-appropriate</Text>
                <Text style={styles.bulletText}>• Respect the privacy and safety of all children</Text>
                <Text style={styles.bulletText}>• Follow our Community Guidelines</Text>
                
                <Text style={styles.text}>
                  Parents/guardians are responsible for supervising their child's use of our platform.
                </Text>
              </View>

              {/* User Accounts */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>👤 User Accounts & Responsibilities</Text>
                
                <Text style={styles.subTitle}>Parents/Guardians:</Text>
                <Text style={styles.bulletText}>• Must provide accurate contact information</Text>
                <Text style={styles.bulletText}>• Are responsible for their child's account activity</Text>
                <Text style={styles.bulletText}>• Must verify their child's identity and age</Text>
                <Text style={styles.bulletText}>• Can review and delete their child's data at any time</Text>
                
                <Text style={styles.subTitle}>Teachers/Educators:</Text>
                <Text style={styles.bulletText}>• Must be qualified educational professionals</Text>
                <Text style={styles.bulletText}>• Are responsible for appropriate content creation</Text>
                <Text style={styles.bulletText}>• Must maintain professional standards</Text>
                <Text style={styles.bulletText}>• Cannot share personal contact information with students</Text>
                
                <Text style={styles.subTitle}>School Administrators:</Text>
                <Text style={styles.bulletText}>• Must be authorized representatives of their institution</Text>
                <Text style={styles.bulletText}>• Are responsible for managing their school's account</Text>
                <Text style={styles.bulletText}>• Must ensure compliance with local education laws</Text>
                <Text style={styles.bulletText}>• Can access and manage student data within their school</Text>
              </View>

              {/* Acceptable Use */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>✅ Acceptable Use Policy</Text>
                <Text style={styles.text}>You may NOT:</Text>
                <Text style={styles.bulletText}>• Upload inappropriate, harmful, or offensive content</Text>
                <Text style={styles.bulletText}>• Attempt to access other users' accounts or data</Text>
                <Text style={styles.bulletText}>• Use the platform for commercial purposes without permission</Text>
                <Text style={styles.bulletText}>• Share login credentials with unauthorized persons</Text>
                <Text style={styles.bulletText}>• Reverse engineer or copy our software</Text>
                <Text style={styles.bulletText}>• Violate any applicable laws or regulations</Text>
                <Text style={styles.bulletText}>• Harass, bully, or intimidate other users</Text>
              </View>

              {/* Content Ownership */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>📝 Content & Intellectual Property</Text>
                <Text style={styles.text}>
                  <Text style={styles.subTitle}>Your Content:</Text>
                  You retain ownership of content you create (lesson plans, homework submissions, etc.). 
                  By using our platform, you grant us a license to store, display, and process your 
                  content to provide our services.
                </Text>
                
                <Text style={styles.text}>
                  <Text style={styles.subTitle}>Our Content:</Text>
                  All platform software, AI-generated content templates, and system features are 
                  owned by EduDash Pro (Pty) Ltd and protected by intellectual property laws.
                </Text>
                
                <Text style={styles.text}>
                  <Text style={styles.subTitle}>AI-Generated Content:</Text>
                  Content generated by our AI systems is provided for educational use. Users may 
                  modify and use AI-generated lesson plans and activities for their teaching purposes.
                </Text>
              </View>

              {/* Payment Terms */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>💳 Payment & Subscription Terms</Text>
                <Text style={styles.bulletText}>• Subscription fees are billed in South African Rand (ZAR)</Text>
                <Text style={styles.bulletText}>• Payments are processed monthly or annually as selected</Text>
                <Text style={styles.bulletText}>• Free tier users have limited access to premium features</Text>
                <Text style={styles.bulletText}>• Refunds are provided according to our Refund Policy</Text>
                <Text style={styles.bulletText}>• Subscription auto-renews unless cancelled</Text>
                <Text style={styles.bulletText}>• Price changes will be communicated 30 days in advance</Text>
              </View>

              {/* Data Protection */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>🔒 Data Protection & Privacy</Text>
                <Text style={styles.text}>
                  We process personal data in accordance with:
                </Text>
                <Text style={styles.bulletText}>• South Africa's Protection of Personal Information Act (POPIA)</Text>
                <Text style={styles.bulletText}>• General Data Protection Regulation (GDPR)</Text>
                <Text style={styles.bulletText}>• Children's Online Privacy Protection Act (COPPA)</Text>
                
                <Text style={styles.text}>
                  Please read our Privacy Policy for detailed information about how we 
                  collect, use, and protect your data.
                </Text>
              </View>

              {/* Platform Availability */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>🌐 Service Availability</Text>
                <Text style={styles.text}>
                  We strive to provide reliable service but cannot guarantee:
                </Text>
                <Text style={styles.bulletText}>• 100% uptime or uninterrupted access</Text>
                <Text style={styles.bulletText}>• Compatibility with all devices or browsers</Text>
                <Text style={styles.bulletText}>• Data backup or recovery in all circumstances</Text>
                
                <Text style={styles.text}>
                  We will provide reasonable notice of scheduled maintenance or significant changes.
                </Text>
              </View>

              {/* Limitation of Liability */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>⚖️ Limitation of Liability</Text>
                <Text style={styles.text}>
                  EduDash Pro (Pty) Ltd's liability is limited to the maximum extent permitted 
                  by South African law. We are not liable for:
                </Text>
                <Text style={styles.bulletText}>• Indirect, incidental, or consequential damages</Text>
                <Text style={styles.bulletText}>• Loss of data, profits, or business opportunities</Text>
                <Text style={styles.bulletText}>• Third-party content or services</Text>
                <Text style={styles.bulletText}>• Damages exceeding the amount paid for our services</Text>
              </View>

              {/* Termination */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>🚪 Account Termination</Text>
                <Text style={styles.text}>
                  Either party may terminate this agreement:
                </Text>
                <Text style={styles.bulletText}>• You may cancel your account at any time</Text>
                <Text style={styles.bulletText}>• We may suspend/terminate accounts for Terms violations</Text>
                <Text style={styles.bulletText}>• We will provide 30 days notice for service discontinuation</Text>
                <Text style={styles.bulletText}>• Data will be deleted according to our retention policy</Text>
              </View>

              {/* Governing Law */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>🇿🇦 Governing Law & Jurisdiction</Text>
                <Text style={styles.text}>
                  These Terms are governed by South African law. Any disputes will be resolved 
                  in the courts of South Africa, with jurisdiction in Pretoria, Gauteng.
                </Text>
                
                <Text style={styles.text}>
                  For international users, we will make reasonable efforts to resolve disputes 
                  through mediation before litigation.
                </Text>
              </View>

              {/* Changes to Terms */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>📋 Changes to These Terms</Text>
                <Text style={styles.text}>
                  We may update these Terms to reflect changes in our services or legal requirements. 
                  We will notify users of significant changes via:
                </Text>
                <Text style={styles.bulletText}>• Email notification to registered users</Text>
                <Text style={styles.bulletText}>• In-app notifications</Text>
                <Text style={styles.bulletText}>• Website announcements</Text>
                
                <Text style={styles.text}>
                  Continued use of our services after changes indicates acceptance of updated Terms.
                </Text>
              </View>

              {/* Contact Information */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>📞 Contact Information</Text>
                <Text style={styles.text}>
                  For questions about these Terms or our services:
                </Text>
                <Text style={styles.contactText}>📧 legal@edudashpro.com</Text>
                <Text style={styles.contactText}>📞 +27 67 477 0975</Text>
                <Text style={styles.contactText}>🏢 848 Shabangu Avenue, Mamelodi, Pretoria 0122</Text>
                <Text style={styles.contactText}>🌐 Company Registration: 2025/123456/07</Text>
              </View>

              {/* Emergency Contact */}
              <View style={styles.emergencySection}>
                <Text style={styles.emergencyTitle}>🚨 Report Safety Concerns</Text>
                <Text style={styles.emergencyText}>
                  If you witness or experience inappropriate behavior, content, or safety concerns:
                </Text>
                <Text style={styles.emergencyContact}>📞 +27 67 477 0975 (24/7)</Text>
                <Text style={styles.emergencyContact}>📧 safety@edudashpro.com</Text>
                <Text style={styles.emergencyText}>
                  We take all safety reports seriously and will investigate promptly.
                </Text>
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
