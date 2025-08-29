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

export default function ChildSafetyPage() {
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
              <Text style={styles.title}>Child Safety Policy</Text>
              <Text style={styles.subtitle}>Our Commitment to Protecting Children</Text>
            </View>
          </View>

          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            <View style={styles.content}>
              
              {/* Last Updated */}
              <View style={styles.section}>
                <Text style={styles.lastUpdated}>Last Updated: January 2025</Text>
              </View>

              {/* Mission Statement */}
              <View style={styles.heroSection}>
                <Text style={styles.heroTitle}>👶 Our Promise to Children & Families</Text>
                <Text style={styles.heroText}>
                  EduDash Pro is committed to creating the safest possible digital learning environment 
                  for children. Child safety is not just a feature—it's the foundation of everything we do.
                </Text>
              </View>

              {/* Safety Principles */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>🛡️ Our Safety Principles</Text>
                <Text style={styles.bulletText}>• <Text style={styles.boldText}>Safety First:</Text> No educational goal is worth compromising a child's safety</Text>
                <Text style={styles.bulletText}>• <Text style={styles.boldText}>Age-Appropriate Content:</Text> All content is carefully curated for specific age groups</Text>
                <Text style={styles.bulletText}>• <Text style={styles.boldText}>No Contact:</Text> Children cannot contact strangers through our platform</Text>
                <Text style={styles.bulletText}>• <Text style={styles.boldText}>Parental Control:</Text> Parents have complete oversight of their child's experience</Text>
                <Text style={styles.bulletText}>• <Text style={styles.boldText}>Professional Standards:</Text> All educators are verified and monitored</Text>
                <Text style={styles.bulletText}>• <Text style={styles.boldText}>Zero Tolerance:</Text> Immediate action against any safety violations</Text>
              </View>

              {/* Age-Appropriate Design */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>🎯 Age-Appropriate Design & Content</Text>
                
                <Text style={styles.subTitle}>Ages 1-6 (Current Focus):</Text>
                <Text style={styles.bulletText}>• Simple, colorful interfaces with large touch targets</Text>
                <Text style={styles.bulletText}>• No text-based chat or communication features</Text>
                <Text style={styles.bulletText}>• Audio-visual learning activities only</Text>
                <Text style={styles.bulletText}>• Parent-supervised content sharing only</Text>
                
                <Text style={styles.subTitle}>Ages 7-12 (Future Implementation):</Text>
                <Text style={styles.bulletText}>• Supervised messaging with teachers only</Text>
                <Text style={styles.bulletText}>• Educational content moderated by AI and humans</Text>
                <Text style={styles.bulletText}>• No personal information sharing allowed</Text>
                
                <Text style={styles.subTitle}>Ages 13-18 (Future Implementation):</Text>
                <Text style={styles.bulletText}>• Educational communication within school groups</Text>
                <Text style={styles.bulletText}>• Content creation tools with safety filters</Text>
                <Text style={styles.bulletText}>• Privacy controls and reporting mechanisms</Text>
              </View>

              {/* Data Protection for Children */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>🔒 Children's Data Protection</Text>
                <Text style={styles.text}>
                  We follow the strictest data protection standards for children:
                </Text>
                
                <Text style={styles.subTitle}>Data Minimization:</Text>
                <Text style={styles.bulletText}>• Collect only essential information for educational purposes</Text>
                <Text style={styles.bulletText}>• No personal photos unless submitted by parents for homework</Text>
                <Text style={styles.bulletText}>• No location tracking or device identifiers</Text>
                
                <Text style={styles.subTitle}>Parental Consent:</Text>
                <Text style={styles.bulletText}>• Explicit consent required for children under 13</Text>
                <Text style={styles.bulletText}>• Parents can review all data about their child</Text>
                <Text style={styles.bulletText}>• Right to delete child's account and all data</Text>
                
                <Text style={styles.subTitle}>Secure Storage:</Text>
                <Text style={styles.bulletText}>• All data encrypted in transit and at rest</Text>
                <Text style={styles.bulletText}>• Servers located in secure facilities in South Africa</Text>
                <Text style={styles.bulletText}>• Regular security audits and penetration testing</Text>
              </View>

              {/* Safety Features */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>🛠️ Built-In Safety Features</Text>
                
                <Text style={styles.subTitle}>Content Moderation:</Text>
                <Text style={styles.bulletText}>• AI-powered content filtering for inappropriate material</Text>
                <Text style={styles.bulletText}>• Human review of all user-generated content</Text>
                <Text style={styles.bulletText}>• Automatic flagging of suspicious activity</Text>
                
                <Text style={styles.subTitle}>Communication Safety:</Text>
                <Text style={styles.bulletText}>• No direct messaging between children</Text>
                <Text style={styles.bulletText}>• All teacher-student communication visible to parents</Text>
                <Text style={styles.bulletText}>• No sharing of personal contact information</Text>
                
                <Text style={styles.subTitle}>Access Controls:</Text>
                <Text style={styles.bulletText}>• Time-based access controls (school hours only)</Text>
                <Text style={styles.bulletText}>• Parent-controlled feature restrictions</Text>
                <Text style={styles.bulletText}>• Immediate suspension of suspicious accounts</Text>
              </View>

              {/* Educator Verification */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>👩‍🏫 Educator Verification & Monitoring</Text>
                <Text style={styles.text}>
                  All educators undergo rigorous screening:
                </Text>
                
                <Text style={styles.subTitle}>Verification Requirements:</Text>
                <Text style={styles.bulletText}>• Valid teaching qualifications and credentials</Text>
                <Text style={styles.bulletText}>• Criminal background checks where legally required</Text>
                <Text style={styles.bulletText}>• Professional reference verification</Text>
                <Text style={styles.bulletText}>• Institution employment confirmation</Text>
                
                <Text style={styles.subTitle}>Ongoing Monitoring:</Text>
                <Text style={styles.bulletText}>• Regular review of educator activities and content</Text>
                <Text style={styles.bulletText}>• Parent and student feedback monitoring</Text>
                <Text style={styles.bulletText}>• Immediate investigation of any reported concerns</Text>
                <Text style={styles.bulletText}>• Annual re-verification of credentials</Text>
              </View>

              {/* Parent Controls */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>👨‍👩‍👧‍👦 Comprehensive Parental Controls</Text>
                <Text style={styles.text}>
                  Parents have complete control and visibility:
                </Text>
                
                <Text style={styles.subTitle}>Account Management:</Text>
                <Text style={styles.bulletText}>• Full access to child's account and activities</Text>
                <Text style={styles.bulletText}>• Ability to pause or restrict account at any time</Text>
                <Text style={styles.bulletText}>• Control over data sharing and privacy settings</Text>
                
                <Text style={styles.subTitle}>Activity Monitoring:</Text>
                <Text style={styles.bulletText}>• Real-time notifications of all activities</Text>
                <Text style={styles.bulletText}>• Weekly progress and safety reports</Text>
                <Text style={styles.bulletText}>• Complete history of interactions and content</Text>
                
                <Text style={styles.subTitle}>Communication Oversight:</Text>
                <Text style={styles.bulletText}>• All messages involving child are copied to parent</Text>
                <Text style={styles.bulletText}>• Ability to block specific users or content</Text>
                <Text style={styles.bulletText}>• Emergency contact and reporting features</Text>
              </View>

              {/* Reporting System */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>🚨 Safety Reporting System</Text>
                <Text style={styles.text}>
                  We provide multiple ways to report safety concerns:
                </Text>
                
                <Text style={styles.subTitle}>Immediate Reporting:</Text>
                <Text style={styles.bulletText}>• One-tap safety reporting in every screen</Text>
                <Text style={styles.bulletText}>• 24/7 emergency hotline for urgent concerns</Text>
                <Text style={styles.bulletText}>• Automatic escalation for serious incidents</Text>
                
                <Text style={styles.subTitle}>Investigation Process:</Text>
                <Text style={styles.bulletText}>• All reports investigated within 2 hours</Text>
                <Text style={styles.bulletText}>• Immediate suspension of accounts if necessary</Text>
                <Text style={styles.bulletText}>• Follow-up with reporter within 24 hours</Text>
                <Text style={styles.bulletText}>• Cooperation with law enforcement when required</Text>
              </View>

              {/* AI Safety */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>🤖 AI Safety & Content Generation</Text>
                <Text style={styles.text}>
                  Our AI systems are designed with child safety as the primary concern:
                </Text>
                
                <Text style={styles.subTitle}>Content Safety:</Text>
                <Text style={styles.bulletText}>• AI-generated content pre-screened for appropriateness</Text>
                <Text style={styles.bulletText}>• Age-specific content filtering and validation</Text>
                <Text style={styles.bulletText}>• No generation of personal or identifying information</Text>
                
                <Text style={styles.subTitle}>Learning Algorithms:</Text>
                <Text style={styles.bulletText}>• No profiling that could be used for targeting</Text>
                <Text style={styles.bulletText}>• Educational focus only - no behavioral manipulation</Text>
                <Text style={styles.bulletText}>• Transparent algorithms with human oversight</Text>
              </View>

              {/* Incident Response */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>⚡ Incident Response Procedures</Text>
                
                <Text style={styles.subTitle}>Immediate Response (0-2 hours):</Text>
                <Text style={styles.bulletText}>• Account suspension if safety risk identified</Text>
                <Text style={styles.bulletText}>• Evidence preservation and documentation</Text>
                <Text style={styles.bulletText}>• Parent/guardian notification</Text>
                <Text style={styles.bulletText}>• Law enforcement contact if required</Text>
                
                <Text style={styles.subTitle}>Investigation (2-48 hours):</Text>
                <Text style={styles.bulletText}>• Full investigation by trained safety team</Text>
                <Text style={styles.bulletText}>• Review of all relevant data and communications</Text>
                <Text style={styles.bulletText}>• Consultation with child safety experts</Text>
                <Text style={styles.bulletText}>• Determination of appropriate action</Text>
                
                <Text style={styles.subTitle}>Follow-up:</Text>
                <Text style={styles.bulletText}>• Implementation of additional safety measures</Text>
                <Text style={styles.bulletText}>• Policy updates if necessary</Text>
                <Text style={styles.bulletText}>• Staff training and system improvements</Text>
              </View>

              {/* Legal Compliance */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>⚖️ Legal Compliance & Standards</Text>
                <Text style={styles.text}>
                  We comply with and exceed requirements from:
                </Text>
                <Text style={styles.bulletText}>• <Text style={styles.boldText}>COPPA:</Text> Children's Online Privacy Protection Act (US)</Text>
                <Text style={styles.bulletText}>• <Text style={styles.boldText}>GDPR:</Text> General Data Protection Regulation (EU)</Text>
                <Text style={styles.bulletText}>• <Text style={styles.boldText}>POPIA:</Text> Protection of Personal Information Act (South Africa)</Text>
                <Text style={styles.bulletText}>• <Text style={styles.boldText}>Local Laws:</Text> All applicable South African child protection legislation</Text>
                <Text style={styles.bulletText}>• <Text style={styles.boldText}>Industry Standards:</Text> International child safety best practices</Text>
              </View>

              {/* Emergency Contacts */}
              <View style={styles.emergencySection}>
                <Text style={styles.emergencyTitle}>🆘 Emergency Safety Contacts</Text>
                <Text style={styles.emergencyText}>
                  <Text style={styles.boldText}>For immediate safety concerns:</Text>
                </Text>
                
                <View style={styles.emergencyContact}>
                  <Text style={styles.emergencyContactTitle}>📞 24/7 Safety Hotline</Text>
                  <Text style={styles.emergencyContactNumber}>+27 67 477 0975</Text>
                </View>
                
                <View style={styles.emergencyContact}>
                  <Text style={styles.emergencyContactTitle}>📧 Safety Email</Text>
                  <Text style={styles.emergencyContactNumber}>safety@edudashpro.com</Text>
                </View>
                
                <View style={styles.emergencyContact}>
                  <Text style={styles.emergencyContactTitle}>🚔 Serious Crimes</Text>
                  <Text style={styles.emergencyContactNumber}>Contact Local Police: 10111</Text>
                </View>
                
                <Text style={styles.emergencyText}>
                  <Text style={styles.boldText}>Our Promise:</Text> Every safety report will receive immediate 
                  attention. We will respond to you within 2 hours, 24/7.
                </Text>
              </View>

              {/* Regular Updates */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>🔄 Continuous Improvement</Text>
                <Text style={styles.text}>
                  Child safety is an ongoing commitment:
                </Text>
                <Text style={styles.bulletText}>• Monthly safety audits and reviews</Text>
                <Text style={styles.bulletText}>• Quarterly policy updates based on new threats</Text>
                <Text style={styles.bulletText}>• Annual third-party security assessments</Text>
                <Text style={styles.bulletText}>• Continuous staff training on child protection</Text>
                <Text style={styles.bulletText}>• Regular consultation with child safety experts</Text>
                <Text style={styles.bulletText}>• Transparent reporting on safety incidents and improvements</Text>
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
  heroSection: {
    backgroundColor: 'rgba(0,245,255,0.1)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: 'rgba(0,245,255,0.3)',
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#00f5ff',
    marginBottom: 15,
    textAlign: 'center',
  },
  heroText: {
    fontSize: 16,
    color: '#FFFFFF',
    lineHeight: 24,
    textAlign: 'center',
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
  boldText: {
    fontWeight: '700',
    color: '#FFFFFF',
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
    marginBottom: 15,
    textAlign: 'center',
  },
  emergencyText: {
    fontSize: 14,
    color: '#FFFFFF',
    lineHeight: 22,
    marginBottom: 15,
    textAlign: 'center',
  },
  emergencyContact: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    alignItems: 'center',
  },
  emergencyContactTitle: {
    fontSize: 16,
    color: '#ff0080',
    fontWeight: '600',
    marginBottom: 5,
  },
  emergencyContactNumber: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '800',
  },
  footer: {
    height: 50,
  },
});
