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

export default function SecurityPage() {
  const securityFeatures = [
    {
      title: 'End-to-End Encryption',
      description: 'All data is encrypted in transit and at rest using AES-256 encryption',
      icon: 'lock.shield.fill',
      color: ['#00f5ff', '#0080ff']
    },
    {
      title: 'COPPA Compliance Framework',
      description: 'Implementing Children\'s Online Privacy Protection Act guidelines',
      icon: 'shield.checkerboard',
      color: ['#ff0080', '#ff8000']
    },
    {
      title: 'Multi-Factor Authentication',
      description: 'Optional 2FA for enhanced account security',
      icon: 'key.fill',
      color: ['#8000ff', '#ff0080']
    },
    {
      title: 'Secure Data Centers',
      description: 'SOC 2 Type II certified data centers with 24/7 monitoring',
      icon: 'server.rack',
      color: ['#ff8000', '#80ff00']
    },
    {
      title: 'Regular Security Audits',
      description: 'Quarterly penetration testing and security assessments',
      icon: 'magnifyingglass.circle.fill',
      color: ['#80ff00', '#00f5ff']
    },
    {
      title: 'Data Backup & Recovery',
      description: 'Automated backups with 99.9% uptime guarantee',
      icon: 'icloud.and.arrow.up.fill',
      color: ['#00f5ff', '#8000ff']
    }
  ];

  const complianceStandards = [
    {
      standard: 'COPPA',
      description: 'Children\'s Online Privacy Protection Act',
      status: 'Compliance Framework',
      details: 'Implementing comprehensive child protection measures and parental consent processes',
      color: ['#ff0080', '#ff8000']
    },
    {
      standard: 'GDPR',
      description: 'General Data Protection Regulation',
      status: 'Fully Compliant',
      details: 'European data protection standards with right to be forgotten',
      color: ['#00f5ff', '#0080ff']
    },
    {
      standard: 'POPIA',
      description: 'Protection of Personal Information Act (South Africa)',
      status: 'Fully Compliant',
      details: 'Local South African data protection compliance',
      color: ['#8000ff', '#ff0080']
    },
    {
      standard: 'FERPA',
      description: 'Family Educational Rights and Privacy Act',
      status: 'Fully Compliant',
      details: 'Educational record privacy protection for students',
      color: ['#ff8000', '#80ff00']
    },
    {
      standard: 'ISO 27001',
      description: 'Information Security Management',
      status: 'Certified',
      details: 'International standard for information security management systems',
      color: ['#80ff00', '#00f5ff']
    }
  ];

  const securityMeasures = [
    {
      category: 'Data Protection',
      measures: [
        'All personal data encrypted with AES-256',
        'Zero-knowledge architecture for sensitive information',
        'Data minimization - only collect what\'s necessary',
        'Automatic data retention policy enforcement',
        'Right to data portability and deletion'
      ],
      icon: 'shield.fill'
    },
    {
      category: 'Access Control',
      measures: [
        'Role-based access control (RBAC)',
        'Multi-factor authentication available',
        'Session management and timeout controls',
        'Account lockout after failed attempts',
        'Admin access logging and monitoring'
      ],
      icon: 'person.badge.key.fill'
    },
    {
      category: 'Network Security',
      measures: [
        'TLS 1.3 for all data transmission',
        'Web Application Firewall (WAF)',
        'DDoS protection and rate limiting',
        'Network intrusion detection systems',
        'Regular security vulnerability scans'
      ],
      icon: 'network'
    },
    {
      category: 'Infrastructure',
      measures: [
        'SOC 2 Type II certified cloud providers',
        'Geographically distributed data centers',
        'Automated security monitoring 24/7',
        'Incident response team on standby',
        'Regular disaster recovery testing'
      ],
      icon: 'server.rack'
    }
  ];

  const incidentResponse = [
    {
      step: 1,
      title: 'Detection & Assessment',
      description: 'Automated systems detect potential security incidents within minutes',
      timeframe: '< 5 minutes'
    },
    {
      step: 2,
      title: 'Immediate Response',
      description: 'Security team activates incident response protocol',
      timeframe: '< 15 minutes'
    },
    {
      step: 3,
      title: 'Containment',
      description: 'Isolate affected systems and prevent further damage',
      timeframe: '< 1 hour'
    },
    {
      step: 4,
      title: 'Investigation',
      description: 'Full forensic analysis to understand scope and impact',
      timeframe: '< 24 hours'
    },
    {
      step: 5,
      title: 'Notification',
      description: 'Notify affected users and regulatory authorities as required',
      timeframe: '< 72 hours'
    },
    {
      step: 6,
      title: 'Recovery & Lessons',
      description: 'Restore services and implement preventive measures',
      timeframe: 'As needed'
    }
  ];

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
              <Text style={styles.title}>Security & Privacy</Text>
              <Text style={styles.subtitle}>Protecting your data & privacy</Text>
            </View>
          </View>

          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            <View style={styles.content}>
              
              {/* Hero Section */}
              <View style={styles.section}>
                <LinearGradient
                  colors={['rgba(255,0,128,0.1)', 'rgba(255,128,0,0.1)']}
                  style={styles.heroContainer}
                >
                  <Text style={styles.heroTitle}>🛡️ Security-First Education Platform</Text>
                  <Text style={styles.heroText}>
                    Your privacy and security are our top priorities. EduDash Pro employs 
                    enterprise-grade security measures to protect children's data and ensure 
                    a safe learning environment for all users.
                  </Text>
                </LinearGradient>
              </View>

              {/* Our Commitment */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>🤝 Our Security Commitment</Text>
                <Text style={styles.text}>
                  EduDash Pro is built with security and privacy by design. We understand 
                  the sensitive nature of educational data and the importance of protecting 
                  children online. Our commitment includes:
                </Text>
                
                <View style={styles.commitmentContainer}>
                  <View style={styles.commitmentItem}>
                    <Text style={styles.commitmentEmoji}>🔒</Text>
                    <View style={styles.commitmentContent}>
                      <Text style={styles.commitmentTitle}>Privacy by Design</Text>
                      <Text style={styles.commitmentText}>Privacy and security are built into every feature from the ground up</Text>
                    </View>
                  </View>
                  
                  <View style={styles.commitmentItem}>
                    <Text style={styles.commitmentEmoji}>👶</Text>
                    <View style={styles.commitmentContent}>
                      <Text style={styles.commitmentTitle}>Child Safety First</Text>
                      <Text style={styles.commitmentText}>Specialized protection for children with COPPA compliance</Text>
                    </View>
                  </View>
                  
                  <View style={styles.commitmentItem}>
                    <Text style={styles.commitmentEmoji}>🔍</Text>
                    <View style={styles.commitmentContent}>
                      <Text style={styles.commitmentTitle}>Transparency</Text>
                      <Text style={styles.commitmentText}>Clear policies and regular security reports</Text>
                    </View>
                  </View>
                  
                  <View style={styles.commitmentItem}>
                    <Text style={styles.commitmentEmoji}>⚡</Text>
                    <View style={styles.commitmentContent}>
                      <Text style={styles.commitmentTitle}>Continuous Improvement</Text>
                      <Text style={styles.commitmentText}>Regular updates and security enhancements</Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Security Features */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>🔐 Security Features</Text>
                <View style={styles.featuresGrid}>
                  {securityFeatures.map((feature, index) => (
                    <View key={index} style={styles.featureCard}>
                      <LinearGradient 
                        colors={feature.color as [string, string]} 
                        style={styles.featureGradient}
                      >
                        <IconSymbol name={feature.icon} size={32} color="#000000" />
                        <Text style={styles.featureTitle}>{feature.title}</Text>
                        <Text style={styles.featureDescription}>{feature.description}</Text>
                      </LinearGradient>
                    </View>
                  ))}
                </View>
              </View>

              {/* Compliance Standards */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>📋 Compliance Standards</Text>
                <Text style={styles.text}>
                  We maintain compliance with international and local privacy and security standards:
                </Text>
                <View style={styles.complianceContainer}>
                  {complianceStandards.map((standard, index) => (
                    <View key={index} style={styles.complianceCard}>
                      <LinearGradient
                        colors={[`${standard.color[0]}20`, `${standard.color[1]}20`] as [string, string]}
                        style={styles.complianceGradient}
                      >
                        <View style={styles.complianceHeader}>
                          <View style={styles.complianceInfo}>
                            <Text style={styles.complianceStandard}>{standard.standard}</Text>
                            <Text style={styles.complianceDescription}>{standard.description}</Text>
                          </View>
                          <View style={styles.complianceStatus}>
                            <LinearGradient
                              colors={standard.color as [string, string]}
                              style={styles.statusBadge}
                            >
                              <Text style={styles.statusText}>{standard.status}</Text>
                            </LinearGradient>
                          </View>
                        </View>
                        <Text style={styles.complianceDetails}>{standard.details}</Text>
                      </LinearGradient>
                    </View>
                  ))}
                </View>
              </View>

              {/* Security Measures */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>⚙️ Detailed Security Measures</Text>
                <View style={styles.measuresContainer}>
                  {securityMeasures.map((category, index) => (
                    <View key={index} style={styles.measureCard}>
                      <LinearGradient
                        colors={['rgba(0,245,255,0.05)', 'rgba(128,0,255,0.05)']}
                        style={styles.measureGradient}
                      >
                        <View style={styles.measureHeader}>
                          <IconSymbol name={category.icon} size={24} color="#00f5ff" />
                          <Text style={styles.measureTitle}>{category.category}</Text>
                        </View>
                        <View style={styles.measuresList}>
                          {category.measures.map((measure, measureIndex) => (
                            <Text key={measureIndex} style={styles.measureItem}>• {measure}</Text>
                          ))}
                        </View>
                      </LinearGradient>
                    </View>
                  ))}
                </View>
              </View>

              {/* Data Protection */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>🗄️ Data Protection & Storage</Text>
                <Text style={styles.text}>
                  We implement comprehensive data protection measures throughout the data lifecycle:
                </Text>
                
                <View style={styles.dataProtectionContainer}>
                  <View style={styles.dataStage}>
                    <View style={styles.stageHeader}>
                      <View style={styles.stageIcon}>
                        <Text style={styles.stageNumber}>1</Text>
                      </View>
                      <Text style={styles.stageTitle}>Collection</Text>
                    </View>
                    <Text style={styles.stageDescription}>
                      Minimal data collection with explicit consent and age-appropriate notices
                    </Text>
                  </View>
                  
                  <View style={styles.dataStage}>
                    <View style={styles.stageHeader}>
                      <View style={styles.stageIcon}>
                        <Text style={styles.stageNumber}>2</Text>
                      </View>
                      <Text style={styles.stageTitle}>Storage</Text>
                    </View>
                    <Text style={styles.stageDescription}>
                      AES-256 encryption at rest in SOC 2 certified data centers
                    </Text>
                  </View>
                  
                  <View style={styles.dataStage}>
                    <View style={styles.stageHeader}>
                      <View style={styles.stageIcon}>
                        <Text style={styles.stageNumber}>3</Text>
                      </View>
                      <Text style={styles.stageTitle}>Processing</Text>
                    </View>
                    <Text style={styles.stageDescription}>
                      Secure processing with access controls and audit logging
                    </Text>
                  </View>
                  
                  <View style={styles.dataStage}>
                    <View style={styles.stageHeader}>
                      <View style={styles.stageIcon}>
                        <Text style={styles.stageNumber}>4</Text>
                      </View>
                      <Text style={styles.stageTitle}>Transmission</Text>
                    </View>
                    <Text style={styles.stageDescription}>
                      TLS 1.3 encryption for all data in transit with certificate pinning
                    </Text>
                  </View>
                  
                  <View style={styles.dataStage}>
                    <View style={styles.stageHeader}>
                      <View style={styles.stageIcon}>
                        <Text style={styles.stageNumber}>5</Text>
                      </View>
                      <Text style={styles.stageTitle}>Deletion</Text>
                    </View>
                    <Text style={styles.stageDescription}>
                      Secure deletion with verification and compliance with retention policies
                    </Text>
                  </View>
                </View>
              </View>

              {/* Incident Response */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>🚨 Incident Response Process</Text>
                <Text style={styles.text}>
                  In the unlikely event of a security incident, our response process ensures 
                  rapid containment and transparent communication:
                </Text>
                
                <View style={styles.incidentContainer}>
                  {incidentResponse.map((step, index) => (
                    <View key={index} style={styles.incidentStep}>
                      <View style={styles.stepIndicator}>
                        <LinearGradient
                          colors={['#ff0080', '#ff8000']}
                          style={styles.stepGradient}
                        >
                          <Text style={styles.stepText}>{step.step}</Text>
                        </LinearGradient>
                      </View>
                      <View style={styles.stepContent}>
                        <View style={styles.stepTitleRow}>
                          <Text style={styles.stepTitle}>{step.title}</Text>
                          <Text style={styles.stepTimeframe}>{step.timeframe}</Text>
                        </View>
                        <Text style={styles.stepDescription}>{step.description}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>

              {/* Security Updates */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>🔄 Security Updates & Monitoring</Text>
                <View style={styles.updatesContainer}>
                  <LinearGradient
                    colors={['rgba(0,245,255,0.1)', 'rgba(128,0,255,0.1)']}
                    style={styles.updateCard}
                  >
                    <Text style={styles.updateTitle}>Continuous Monitoring</Text>
                    <Text style={styles.updateText}>
                      • 24/7 security operations center (SOC)
                      {'\n'}• Real-time threat detection and response
                      {'\n'}• Automated vulnerability scanning
                      {'\n'}• AI-powered anomaly detection
                    </Text>
                  </LinearGradient>
                  
                  <LinearGradient
                    colors={['rgba(255,0,128,0.1)', 'rgba(255,128,0,0.1)']}
                    style={styles.updateCard}
                  >
                    <Text style={styles.updateTitle}>Regular Updates</Text>
                    <Text style={styles.updateText}>
                      • Security patches applied within 24-48 hours
                      {'\n'}• Monthly security reviews and updates
                      {'\n'}• Quarterly penetration testing
                      {'\n'}• Annual security audits by third parties
                    </Text>
                  </LinearGradient>
                </View>
              </View>

              {/* Contact Security Team */}
              <View style={styles.section}>
                <LinearGradient
                  colors={['rgba(255,0,128,0.1)', 'rgba(255,128,0,0.1)']}
                  style={styles.contactContainer}
                >
                  <Text style={styles.contactTitle}>🔒 Security Contact</Text>
                  <Text style={styles.contactText}>
                    Have a security concern or want to report a vulnerability? 
                    Contact our security team directly:
                  </Text>
                  <Text style={styles.contactInfo}>📧 security@edudashpro.com</Text>
                  <Text style={styles.contactInfo}>🚨 For urgent security matters: +27 67 477 0975</Text>
                  <Text style={styles.contactInfo}>🔐 PGP Key available upon request</Text>
                  
                  <TouchableOpacity 
                    style={styles.reportButton}
                    onPress={() => router.push('/support/contact')}
                  >
                    <LinearGradient
                      colors={['#ff0080', '#ff8000']}
                      style={styles.reportGradient}
                    >
                      <IconSymbol name="exclamationmark.shield.fill" size={20} color="#000000" />
                      <Text style={styles.reportText}>Report Security Issue</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </LinearGradient>
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
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#00f5ff',
    marginBottom: 15,
  },
  text: {
    fontSize: 14,
    color: '#CCCCCC',
    lineHeight: 22,
    marginBottom: 12,
  },
  
  // Hero Section
  heroContainer: {
    borderRadius: 15,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,0,128,0.3)',
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 15,
    textAlign: 'center',
  },
  heroText: {
    fontSize: 16,
    color: '#CCCCCC',
    lineHeight: 24,
    textAlign: 'center',
  },
  
  // Commitment
  commitmentContainer: {
    gap: 15,
  },
  commitmentItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 15,
  },
  commitmentEmoji: {
    fontSize: 24,
  },
  commitmentContent: {
    flex: 1,
  },
  commitmentTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  commitmentText: {
    fontSize: 14,
    color: '#CCCCCC',
    lineHeight: 20,
  },
  
  // Security Features
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
  },
  featureCard: {
    width: width < 400 ? (width - 50) : (width - 70) / 2,
    borderRadius: 15,
    overflow: 'hidden',
  },
  featureGradient: {
    padding: 20,
    alignItems: 'center',
    minHeight: 140,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#000000',
    marginVertical: 8,
    textAlign: 'center',
  },
  featureDescription: {
    fontSize: 11,
    color: 'rgba(0,0,0,0.7)',
    textAlign: 'center',
    lineHeight: 14,
  },
  
  // Compliance
  complianceContainer: {
    gap: 15,
  },
  complianceCard: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  complianceGradient: {
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,245,255,0.1)',
  },
  complianceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  complianceInfo: {
    flex: 1,
  },
  complianceStandard: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  complianceDescription: {
    fontSize: 12,
    color: '#CCCCCC',
  },
  complianceStatus: {
    marginLeft: 10,
  },
  statusBadge: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#000000',
  },
  complianceDetails: {
    fontSize: 13,
    color: '#CCCCCC',
    lineHeight: 18,
  },
  
  // Security Measures
  measuresContainer: {
    gap: 20,
  },
  measureCard: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  measureGradient: {
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,245,255,0.1)',
  },
  measureHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  measureTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  measuresList: {
    gap: 6,
  },
  measureItem: {
    fontSize: 13,
    color: '#CCCCCC',
    lineHeight: 18,
  },
  
  // Data Protection
  dataProtectionContainer: {
    gap: 15,
  },
  dataStage: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 15,
  },
  stageHeader: {
    alignItems: 'center',
    gap: 8,
    minWidth: 60,
  },
  stageIcon: {
    backgroundColor: 'rgba(0,245,255,0.2)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stageNumber: {
    fontSize: 16,
    fontWeight: '800',
    color: '#00f5ff',
  },
  stageTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#00f5ff',
    textAlign: 'center',
  },
  stageDescription: {
    fontSize: 14,
    color: '#CCCCCC',
    lineHeight: 20,
    flex: 1,
  },
  
  // Incident Response
  incidentContainer: {
    gap: 20,
  },
  incidentStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 15,
  },
  stepIndicator: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  stepGradient: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#000000',
  },
  stepContent: {
    flex: 1,
  },
  stepTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  stepTimeframe: {
    fontSize: 12,
    color: '#ff0080',
    fontWeight: '600',
  },
  stepDescription: {
    fontSize: 14,
    color: '#CCCCCC',
    lineHeight: 20,
  },
  
  // Updates
  updatesContainer: {
    gap: 15,
  },
  updateCard: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,245,255,0.1)',
  },
  updateTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  updateText: {
    fontSize: 14,
    color: '#CCCCCC',
    lineHeight: 20,
  },
  
  // Contact
  contactContainer: {
    borderRadius: 15,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,0,128,0.3)',
    alignItems: 'center',
  },
  contactTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  contactText: {
    fontSize: 14,
    color: '#CCCCCC',
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 15,
  },
  contactInfo: {
    fontSize: 14,
    color: '#ff0080',
    fontWeight: '600',
    marginBottom: 8,
  },
  reportButton: {
    borderRadius: 15,
    overflow: 'hidden',
    marginTop: 15,
  },
  reportGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 10,
  },
  reportText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#000000',
  },
  footer: {
    height: 50,
  },
});
