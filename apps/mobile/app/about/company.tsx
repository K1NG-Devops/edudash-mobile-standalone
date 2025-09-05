import React from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet, 
  Dimensions,
  Image 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { IconSymbol } from '@/components/ui/IconSymbol';

const { width, height } = Dimensions.get('window');

export default function AboutCompanyPage() {
  const teamMembers = [
    {
      name: "Marrion Makunyane",
      role: "Chief Executive Officer",
      description: "Visionary leader driving educational transformation across South Africa",
      avatarPath: null, // Replace with actual image path when available
      initials: "MM",
      color: ['#00f5ff', '#0080ff']
    },
    {
      name: "Tshidiso Modikwe",
      role: "Chief Operating Officer",
      description: "Operations expert ensuring seamless platform delivery and user experience",
      avatarPath: null, // Replace with actual image path when available
      initials: "TM",
      color: ['#8000ff', '#ff0080']
    },
    {
      name: "Prof. Thembi",
      role: "Chief Educational Officer",
      description: "Educational expert specializing in curriculum development and pedagogical innovation",
      avatarPath: null, // Replace with actual image path when available
      initials: "PT",
      color: ['#ff0080', '#ff8000']
    },
    {
      name: "Thato Magogo",
      role: "Chief Technology Officer",
      description: "Technical architect building AI-powered educational solutions",
      avatarPath: null, // Replace with actual image path when available
      initials: "TM",
      color: ['#80ff00', '#00f5ff']
    },
    {
      name: "Zanele Makunyane",
      role: "Head of Career Development",
      description: "Career guidance specialist helping students and educators reach their potential",
      avatarPath: null, // Replace with actual image path when available
      initials: "ZM",
      color: ['#ff8000', '#80ff00']
    },
    {
      name: "Creshea Matjeke",
      role: "Head of Data & Analytics",
      description: "Data specialist ensuring insights drive educational outcomes",
      avatarPath: null, // Replace with actual image path when available
      initials: "CM",
      color: ['#ff8000', '#80ff00']
    },
    {
      name: "Dr. Annatjie Makunyane",
      role: "Head of Child Safety",
      description: "Child protection expert with 15+ years working with children and former Principal",
      avatarPath: null, // Replace with actual image path when available
      initials: "AM",
      color: ['#ff4500', '#ffd700']
    }
  ];

  const values = [
    {
      title: "Child Safety First",
      description: "Every decision we make prioritizes the safety and wellbeing of children",
      icon: "shield.fill",
      color: ['#ff0080', '#ff8000']
    },
    {
      title: "Educational Excellence",
      description: "We strive to provide the highest quality educational experiences",
      icon: "graduationcap.fill",
      color: ['#00f5ff', '#0080ff']
    },
    {
      title: "Innovation & AI",
      description: "Leveraging cutting-edge technology to revolutionize learning",
      icon: "brain",
      color: ['#8000ff', '#ff0080']
    },
    {
      title: "Accessibility",
      description: "Making quality education accessible to all children, everywhere",
      icon: "heart.fill",
      color: ['#ff8000', '#80ff00']
    }
  ];

  const milestones = [
    {
      year: "2024",
      title: "EduDash Pro Founded",
      description: "Company established in South Africa with vision for AI-powered education"
    },
    {
      year: "2024",
      title: "AI Platform Launch",
      description: "First version launched with Claude AI integration for lesson planning"
    },
    {
      year: "2024",
      title: "COPPA Compliance Initiative",
      description: "Implementing comprehensive child safety measures and working toward full regulatory compliance"
    },
    {
      year: "2025",
      title: "Mobile App Release",
      description: "Native mobile apps launched for iOS and Android platforms"
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
              <Text style={styles.title}>About EduDash Pro</Text>
              <Text style={styles.subtitle}>Our Mission & Vision</Text>
            </View>
          </View>

          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            <View style={styles.content}>
              
              {/* Hero Section */}
              <View style={styles.section}>
                <LinearGradient
                  colors={['rgba(0,245,255,0.1)', 'rgba(128,0,255,0.1)']}
                  style={styles.heroContainer}
                >
                  <Text style={styles.heroTitle}>🚀 Transforming Education with AI</Text>
                  <Text style={styles.heroText}>
                    EduDash Pro is a South African nonprofit organization dedicated to 
                    revolutionizing learning through artificial intelligence. We believe every 
                    child deserves access to personalized, engaging, and safe educational experiences, 
                    regardless of their background or circumstances.
                  </Text>
                </LinearGradient>
              </View>

              {/* Mission & Vision */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>🎯 Our Mission</Text>
                <Text style={styles.text}>
                  To democratize quality education by providing AI-powered tools that make 
                  learning personalized, engaging, and accessible to every child, while 
                  maintaining the highest standards of safety and privacy.
                </Text>
                
                <Text style={styles.sectionTitle}>🔮 Our Vision</Text>
                <Text style={styles.text}>
                  To create a world where every child has access to a personalized AI tutor 
                  that understands their unique learning style, helping them reach their full 
                  potential in a safe and nurturing digital environment.
                </Text>
              </View>

              {/* Core Values */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>💎 Our Core Values</Text>
                <View style={styles.valuesGrid}>
                  {values.map((value, index) => (
                    <View key={index} style={styles.valueCard}>
                      <LinearGradient 
                        colors={value.color as [string, string]} 
                        style={styles.valueGradient}
                      >
                        <IconSymbol name={value.icon} size={32} color="#000000" />
                        <Text style={styles.valueTitle}>{value.title}</Text>
                        <Text style={styles.valueDescription}>{value.description}</Text>
                      </LinearGradient>
                    </View>
                  ))}
                </View>
              </View>

              {/* Leadership Team */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>👥 Leadership Team</Text>
                <View style={styles.teamGrid}>
                  {teamMembers.map((member, index) => (
                    <View key={index} style={styles.teamCard}>
                      <LinearGradient 
                        colors={[`${member.color[0]}20`, `${member.color[1]}20`] as [string, string]}
                        style={styles.teamGradient}
                      >
                        <View style={styles.avatarContainer}>
                          {member.avatarPath ? (
                            <Image
                              source={{ uri: member.avatarPath }}
                              style={styles.avatarImage}
                              resizeMode="cover"
                            />
                          ) : (
                            <LinearGradient
                              colors={member.color as [string, string]}
                              style={styles.avatarPlaceholder}
                            >
                              <Text style={styles.avatarInitials}>{member.initials}</Text>
                            </LinearGradient>
                          )}
                        </View>
                        <Text style={styles.teamName}>{member.name}</Text>
                        <Text style={styles.teamRole}>{member.role}</Text>
                        <Text style={styles.teamDescription}>{member.description}</Text>
                      </LinearGradient>
                    </View>
                  ))}
                </View>
              </View>

              {/* Company Milestones */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>📈 Our Journey</Text>
                <View style={styles.timelineContainer}>
                  {milestones.map((milestone, index) => (
                    <View key={index} style={styles.timelineItem}>
                      <View style={styles.timelineYear}>
                        <Text style={styles.yearText}>{milestone.year}</Text>
                      </View>
                      <View style={styles.timelineContent}>
                        <Text style={styles.milestoneTitle}>{milestone.title}</Text>
                        <Text style={styles.milestoneDescription}>{milestone.description}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>

              {/* Technology */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>⚡ Our Technology</Text>
                <Text style={styles.text}>
                  EduDash Pro is built on cutting-edge technologies that ensure scalability, 
                  security, and performance:
                </Text>
                <Text style={styles.bulletText}>• Anthropic Claude AI for intelligent content generation</Text>
                <Text style={styles.bulletText}>• React Native for cross-platform mobile experience</Text>
                <Text style={styles.bulletText}>• End-to-end encryption for data security</Text>
                <Text style={styles.bulletText}>• Cloud-native architecture for global scalability</Text>
                <Text style={styles.bulletText}>• Real-time synchronization across all devices</Text>
                <Text style={styles.bulletText}>• COPPA-compliant data handling and storage</Text>
              </View>

              {/* Partnerships */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>🤝 Strategic Partnerships</Text>
                <Text style={styles.text}>
                  We collaborate with leading organizations to enhance our platform:
                </Text>
                <Text style={styles.bulletText}>• Educational institutions across South Africa</Text>
                <Text style={styles.bulletText}>• Child safety organizations and advocates</Text>
                <Text style={styles.bulletText}>• AI research institutions and universities</Text>
                <Text style={styles.bulletText}>• Technology partners for infrastructure</Text>
                <Text style={styles.bulletText}>• Content creators and curriculum specialists</Text>
              </View>

              {/* Development Roadmap */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>🚧 Development Roadmap</Text>
                <Text style={styles.text}>
                  EduDash Pro is currently in active development. Here's what we're working on:
                </Text>
                <View style={styles.roadmapContainer}>
                  <View style={styles.roadmapCard}>
                    <LinearGradient
                      colors={['rgba(0,245,255,0.2)', 'rgba(128,0,255,0.2)']}
                      style={styles.roadmapGradient}
                    >
                      <Text style={styles.roadmapIcon}>🔧</Text>
                      <Text style={styles.roadmapTitle}>Core Platform Development</Text>
                      <Text style={styles.roadmapStatus}>In Progress</Text>
                      <Text style={styles.roadmapBody}>Building the foundation for AI-powered learning</Text>
                    </LinearGradient>
                  </View>
                  
                  <View style={styles.roadmapCard}>
                    <LinearGradient
                      colors={['rgba(255,215,0,0.2)', 'rgba(255,165,0,0.2)']}
                      style={styles.roadmapGradient}
                    >
                      <Text style={styles.roadmapIcon}>🤖</Text>
                      <Text style={styles.roadmapTitle}>AI Integration & Testing</Text>
                      <Text style={styles.roadmapStatus}>Current Focus</Text>
                      <Text style={styles.roadmapBody}>Integrating Claude AI for lesson generation</Text>
                    </LinearGradient>
                  </View>
                  
                  <View style={styles.roadmapCard}>
                    <LinearGradient
                      colors={['rgba(50,205,50,0.2)', 'rgba(34,139,34,0.2)']}
                      style={styles.roadmapGradient}
                    >
                      <Text style={styles.roadmapIcon}>🎓</Text>
                      <Text style={styles.roadmapTitle}>Pilot Program Launch</Text>
                      <Text style={styles.roadmapStatus}>Coming Soon</Text>
                      <Text style={styles.roadmapBody}>Testing with select South African schools</Text>
                    </LinearGradient>
                  </View>
                </View>
              </View>

              {/* Organization Details */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>📋 Organization Information</Text>
                <View style={styles.companyDetailsContainer}>
                  <Text style={styles.companyDetail}>🏢 <Text style={styles.detailLabel}>Organization:</Text> EduDash Pro (Nonprofit)</Text>
                  <Text style={styles.companyDetail}>📅 <Text style={styles.detailLabel}>Founded:</Text> 2024</Text>
                  <Text style={styles.companyDetail}>📜 <Text style={styles.detailLabel}>Status:</Text> Nonprofit Organization</Text>
                  <Text style={styles.companyDetail}>🇿🇦 <Text style={styles.detailLabel}>Country:</Text> South Africa</Text>
                  <Text style={styles.companyDetail}>📍 <Text style={styles.detailLabel}>Location:</Text> Pretoria, Gauteng</Text>
                  <Text style={styles.companyDetail}>👥 <Text style={styles.detailLabel}>Team Size:</Text> 7 dedicated founders</Text>
                  <Text style={styles.companyDetail}>🎯 <Text style={styles.detailLabel}>Mission:</Text> Democratizing quality education through AI</Text>
                  <Text style={styles.companyDetail}>🚀 <Text style={styles.detailLabel}>Phase:</Text> Active Development & Testing</Text>
                </View>
              </View>

              {/* Contact */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>📞 Get in Touch</Text>
                <Text style={styles.text}>
                  Want to learn more about EduDash Pro or explore partnership opportunities?
                </Text>
                <Text style={styles.contactText}>📧 info@edudashpro.com</Text>
                <Text style={styles.contactText}>📞 +27 67 477 0975</Text>
                <Text style={styles.contactText}>🏢 848 Shabangu Avenue, Mamelodi, Pretoria 0122</Text>
                <Text style={styles.contactText}>🌐 www.edudashpro.com</Text>
                
                {/* Note for future social media icons:
                    When adding social media icons, use standard, simple icons:
                    - Facebook: Standard "f" logo or simple Facebook icon
                    - Twitter/X: Standard bird or X icon
                    - LinkedIn: Standard "in" or LinkedIn icon
                    - Instagram: Standard camera or Instagram icon
                    Avoid futuristic or overly stylized icons for better usability */}
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
  bulletText: {
    fontSize: 14,
    color: '#CCCCCC',
    lineHeight: 22,
    marginBottom: 8,
    marginLeft: 10,
  },
  
  // Hero Section
  heroContainer: {
    borderRadius: 15,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,245,255,0.3)',
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
  
  // Values Grid
  valuesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
  },
  valueCard: {
    width: width < 400 ? (width - 50) : (width - 70) / 2,
    borderRadius: 15,
    overflow: 'hidden',
  },
  valueGradient: {
    padding: 20,
    alignItems: 'center',
    minHeight: 140,
  },
  valueTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#000000',
    marginVertical: 8,
    textAlign: 'center',
  },
  valueDescription: {
    fontSize: 12,
    color: 'rgba(0,0,0,0.7)',
    textAlign: 'center',
    lineHeight: 16,
  },
  
  // Team Grid
  teamGrid: {
    gap: 20,
  },
  teamCard: {
    borderRadius: 15,
    overflow: 'hidden',
  },
  teamGradient: {
    padding: 20,
    alignItems: 'center',
  },
  // Avatar Styles
  avatarContainer: {
    marginBottom: 16,
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 24,
    fontWeight: '800',
    color: '#000000',
  },
  teamName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  teamRole: {
    fontSize: 14,
    color: '#00f5ff',
    fontWeight: '600',
    marginBottom: 8,
  },
  teamDescription: {
    fontSize: 14,
    color: '#CCCCCC',
    textAlign: 'center',
    lineHeight: 20,
  },
  
  // Timeline
  timelineContainer: {
    gap: 20,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 15,
  },
  timelineYear: {
    backgroundColor: 'rgba(0,245,255,0.2)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 60,
    alignItems: 'center',
  },
  yearText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#00f5ff',
  },
  timelineContent: {
    flex: 1,
  },
  milestoneTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  milestoneDescription: {
    fontSize: 14,
    color: '#CCCCCC',
    lineHeight: 20,
  },
  
  // Roadmap
  roadmapContainer: {
    gap: 15,
  },
  roadmapCard: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  roadmapGradient: {
    padding: 16,
    gap: 8,
  },
  roadmapIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  roadmapTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  roadmapStatus: {
    fontSize: 12,
    color: '#00f5ff',
    fontWeight: '600',
    marginBottom: 8,
  },
  roadmapBody: {
    fontSize: 14,
    color: '#CCCCCC',
    lineHeight: 20,
  },
  
  // Company Details
  companyDetailsContainer: {
    backgroundColor: 'rgba(0,245,255,0.05)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,245,255,0.1)',
  },
  companyDetail: {
    fontSize: 14,
    color: '#CCCCCC',
    lineHeight: 24,
    marginBottom: 8,
  },
  detailLabel: {
    fontWeight: '600',
    color: '#FFFFFF',
  },
  
  // Contact
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
