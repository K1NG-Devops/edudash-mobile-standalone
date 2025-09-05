import React, { useState } from 'react';
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

export default function CareersPage() {
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);

  const openPositions = [
    {
      id: 'senior-ai-engineer',
      title: 'Senior AI Engineer',
      department: 'Engineering',
      location: 'Pretoria, SA (Remote)',
      type: 'Full-time',
      experience: '5+ years',
      description: 'Lead AI development for educational content generation using Claude and other LLMs',
      requirements: [
        'Master\'s degree in AI/ML or related field',
        'Experience with LLMs and natural language processing',
        'Python, TensorFlow/PyTorch proficiency',
        'Experience in educational technology preferred'
      ],
      color: ['#00f5ff', '#0080ff']
    },
    {
      id: 'react-native-developer',
      title: 'React Native Developer',
      department: 'Engineering',
      location: 'Pretoria, SA (Hybrid)',
      type: 'Full-time',
      experience: '3+ years',
      description: 'Build and maintain cross-platform mobile applications for our education platform',
      requirements: [
        'Strong React Native and TypeScript skills',
        'Experience with Expo and native modules',
        'Mobile app store deployment experience',
        'Understanding of child safety and privacy requirements'
      ],
      color: ['#8000ff', '#ff0080']
    },
    {
      id: 'education-specialist',
      title: 'Education Content Specialist',
      department: 'Education',
      location: 'Pretoria, SA (On-site)',
      type: 'Full-time',
      experience: '4+ years',
      description: 'Design curriculum and educational content for AI-powered learning experiences',
      requirements: [
        'Education degree with teaching experience',
        'Curriculum development expertise',
        'Understanding of child development (ages 1-18)',
        'Experience with digital learning platforms'
      ],
      color: ['#ff0080', '#ff8000']
    },
    {
      id: 'ux-designer',
      title: 'Senior UX Designer',
      department: 'Design',
      location: 'Pretoria, SA (Remote)',
      type: 'Full-time',
      experience: '4+ years',
      description: 'Create intuitive and child-friendly interfaces for our educational platform',
      requirements: [
        'Strong portfolio in mobile UX/UI design',
        'Experience designing for children and families',
        'Figma, Adobe Creative Suite proficiency',
        'Understanding of accessibility standards'
      ],
      color: ['#ff8000', '#80ff00']
    },
    {
      id: 'child-safety-officer',
      title: 'Child Safety Officer',
      department: 'Compliance',
      location: 'Pretoria, SA (On-site)',
      type: 'Full-time',
      experience: '3+ years',
      description: 'Ensure platform compliance with COPPA, GDPR, and other child safety regulations',
      requirements: [
        'Experience in child protection or privacy law',
        'Knowledge of COPPA, GDPR, POPIA compliance',
        'Background in EdTech or child-focused platforms',
        'Strong analytical and documentation skills'
      ],
      color: ['#80ff00', '#00f5ff']
    },
    {
      id: 'backend-engineer',
      title: 'Backend Engineer',
      department: 'Engineering',
      location: 'Pretoria, SA (Remote)',
      type: 'Full-time',
      experience: '3+ years',
      description: 'Build scalable backend systems for our educational platform',
      requirements: [
        'Experience with Node.js, Python, or Go',
        'Cloud platform experience (AWS, GCP, Azure)',
        'Database design and optimization skills',
        'API development and security best practices'
      ],
      color: ['#00f5ff', '#8000ff']
    }
  ];

  const departments = [
    { name: 'All', count: openPositions.length },
    { name: 'Engineering', count: openPositions.filter(p => p.department === 'Engineering').length },
    { name: 'Education', count: openPositions.filter(p => p.department === 'Education').length },
    { name: 'Design', count: openPositions.filter(p => p.department === 'Design').length },
    { name: 'Compliance', count: openPositions.filter(p => p.department === 'Compliance').length }
  ];

  const benefits = [
    {
      title: 'Competitive Salary',
      description: 'Above-market compensation with equity options',
      icon: 'banknote.fill',
      color: ['#00f5ff', '#0080ff']
    },
    {
      title: 'Health & Wellness',
      description: 'Medical aid, dental, and wellness programs',
      icon: 'heart.fill',
      color: ['#ff0080', '#ff8000']
    },
    {
      title: 'Learning Budget',
      description: 'R15,000 annual budget for courses and conferences',
      icon: 'book.fill',
      color: ['#8000ff', '#ff0080']
    },
    {
      title: 'Flexible Work',
      description: 'Remote-first culture with flexible hours',
      icon: 'house.fill',
      color: ['#ff8000', '#80ff00']
    },
    {
      title: 'Equipment',
      description: 'Latest MacBook, monitor, and home office setup',
      icon: 'laptop',
      color: ['#80ff00', '#00f5ff']
    },
    {
      title: 'Parental Leave',
      description: '6 months paid parental leave for new parents',
      icon: 'person.2.fill',
      color: ['#00f5ff', '#8000ff']
    }
  ];

  const cultureValues = [
    {
      title: 'Child-First Mindset',
      description: 'Every decision we make considers the impact on children\'s safety and learning',
      emoji: '👶'
    },
    {
      title: 'Continuous Learning',
      description: 'We encourage experimentation, learning from failures, and growing together',
      emoji: '📚'
    },
    {
      title: 'Diversity & Inclusion',
      description: 'We celebrate differences and create an environment where everyone belongs',
      emoji: '🌍'
    },
    {
      title: 'Innovation & Quality',
      description: 'We push boundaries while maintaining the highest standards of quality',
      emoji: '⚡'
    }
  ];

  const filteredPositions = selectedDepartment && selectedDepartment !== 'All' 
    ? openPositions.filter(p => p.department === selectedDepartment)
    : openPositions;

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
              <Text style={styles.title}>Careers at EduDash Pro</Text>
              <Text style={styles.subtitle}>Join our mission to transform education</Text>
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
                  <Text style={styles.heroTitle}>🚀 Build the Future of Education</Text>
                  <Text style={styles.heroText}>
                    Join a passionate team of educators, engineers, and designers working to 
                    make AI-powered learning accessible to every child. We're not just building 
                    software - we're shaping the future of education.
                  </Text>
                </LinearGradient>
              </View>

              {/* Why Work With Us */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>✨ Why EduDash Pro?</Text>
                <Text style={styles.text}>
                  We're a mission-driven company that puts child safety and educational excellence 
                  at the heart of everything we do. Here's what makes us different:
                </Text>
                
                <View style={styles.whyUsContainer}>
                  <View style={styles.whyUsItem}>
                    <Text style={styles.whyUsEmoji}>🎯</Text>
                    <View style={styles.whyUsContent}>
                      <Text style={styles.whyUsTitle}>Meaningful Impact</Text>
                      <Text style={styles.whyUsText}>Your work directly improves children's learning experiences</Text>
                    </View>
                  </View>
                  
                  <View style={styles.whyUsItem}>
                    <Text style={styles.whyUsEmoji}>🧠</Text>
                    <View style={styles.whyUsContent}>
                      <Text style={styles.whyUsTitle}>Cutting-Edge Tech</Text>
                      <Text style={styles.whyUsText}>Work with the latest AI and mobile technologies</Text>
                    </View>
                  </View>
                  
                  <View style={styles.whyUsItem}>
                    <Text style={styles.whyUsEmoji}>🌱</Text>
                    <View style={styles.whyUsContent}>
                      <Text style={styles.whyUsTitle}>Growth Opportunities</Text>
                      <Text style={styles.whyUsText}>Learn from experts and advance your career in EdTech</Text>
                    </View>
                  </View>
                  
                  <View style={styles.whyUsItem}>
                    <Text style={styles.whyUsEmoji}>🌍</Text>
                    <View style={styles.whyUsContent}>
                      <Text style={styles.whyUsTitle}>Global Reach</Text>
                      <Text style={styles.whyUsText}>Help us expand quality education worldwide</Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Benefits & Perks */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>🎁 Benefits & Perks</Text>
                <View style={styles.benefitsGrid}>
                  {benefits.map((benefit, index) => (
                    <View key={index} style={styles.benefitCard}>
                      <LinearGradient 
                        colors={benefit.color as [string, string]} 
                        style={styles.benefitGradient}
                      >
                        <IconSymbol name={benefit.icon} size={28} color="#000000" />
                        <Text style={styles.benefitTitle}>{benefit.title}</Text>
                        <Text style={styles.benefitDescription}>{benefit.description}</Text>
                      </LinearGradient>
                    </View>
                  ))}
                </View>
              </View>

              {/* Company Culture */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>🏢 Our Culture</Text>
                <View style={styles.cultureGrid}>
                  {cultureValues.map((value, index) => (
                    <View key={index} style={styles.cultureCard}>
                      <LinearGradient
                        colors={['rgba(0,245,255,0.05)', 'rgba(128,0,255,0.05)']}
                        style={styles.cultureGradient}
                      >
                        <Text style={styles.cultureEmoji}>{value.emoji}</Text>
                        <Text style={styles.cultureTitle}>{value.title}</Text>
                        <Text style={styles.cultureDescription}>{value.description}</Text>
                      </LinearGradient>
                    </View>
                  ))}
                </View>
              </View>

              {/* Open Positions */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>💼 Open Positions ({filteredPositions.length})</Text>
                
                {/* Department Filter */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
                  <View style={styles.filterContainer}>
                    {departments.map((dept) => (
                      <TouchableOpacity
                        key={dept.name}
                        style={[
                          styles.filterButton,
                          selectedDepartment === dept.name && styles.filterButtonActive
                        ]}
                        onPress={() => setSelectedDepartment(dept.name)}
                      >
                        <LinearGradient
                          colors={selectedDepartment === dept.name 
                            ? ['#00f5ff', '#0080ff'] 
                            : ['rgba(0,245,255,0.1)', 'rgba(128,0,255,0.1)']
                          }
                          style={styles.filterGradient}
                        >
                          <Text style={[
                            styles.filterText,
                            selectedDepartment === dept.name && styles.filterTextActive
                          ]}>
                            {dept.name} ({dept.count})
                          </Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>

                {/* Job Listings */}
                <View style={styles.jobsContainer}>
                  {filteredPositions.map((job) => (
                    <TouchableOpacity key={job.id} style={styles.jobCard}>
                      <LinearGradient
                        colors={['rgba(0,245,255,0.05)', 'rgba(128,0,255,0.05)']}
                        style={styles.jobGradient}
                      >
                        <View style={styles.jobHeader}>
                          <View style={styles.jobTitleContainer}>
                            <Text style={styles.jobTitle}>{job.title}</Text>
                            <Text style={styles.jobDepartment}>{job.department}</Text>
                          </View>
                          <View style={styles.jobTypeContainer}>
                            <LinearGradient
                              colors={job.color as [string, string]}
                              style={styles.jobTypeBadge}
                            >
                              <Text style={styles.jobTypeText}>{job.type}</Text>
                            </LinearGradient>
                          </View>
                        </View>
                        
                        <Text style={styles.jobDescription}>{job.description}</Text>
                        
                        <View style={styles.jobDetails}>
                          <View style={styles.jobDetailItem}>
                            <IconSymbol name="location.fill" size={14} color="#00f5ff" />
                            <Text style={styles.jobDetailText}>{job.location}</Text>
                          </View>
                          <View style={styles.jobDetailItem}>
                            <IconSymbol name="briefcase.fill" size={14} color="#00f5ff" />
                            <Text style={styles.jobDetailText}>{job.experience}</Text>
                          </View>
                        </View>
                        
                        <View style={styles.jobRequirements}>
                          <Text style={styles.requirementsTitle}>Key Requirements:</Text>
                          {job.requirements.slice(0, 2).map((req, index) => (
                            <Text key={index} style={styles.requirementText}>• {req}</Text>
                          ))}
                          {job.requirements.length > 2 && (
                            <Text style={styles.requirementText}>• +{job.requirements.length - 2} more...</Text>
                          )}
                        </View>
                        
                        <TouchableOpacity style={styles.applyButton}>
                          <LinearGradient
                            colors={['rgba(0,245,255,0.2)', 'rgba(128,0,255,0.2)']}
                            style={styles.applyGradient}
                          >
                            <Text style={styles.applyText}>View Details & Apply</Text>
                            <IconSymbol name="arrow.right" size={16} color="#00f5ff" />
                          </LinearGradient>
                        </TouchableOpacity>
                      </LinearGradient>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Application Process */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>📋 Application Process</Text>
                <View style={styles.processContainer}>
                  <View style={styles.processStep}>
                    <View style={styles.stepNumber}>
                      <Text style={styles.stepNumberText}>1</Text>
                    </View>
                    <View style={styles.stepContent}>
                      <Text style={styles.stepTitle}>Apply Online</Text>
                      <Text style={styles.stepDescription}>Submit your application through our careers page</Text>
                    </View>
                  </View>
                  
                  <View style={styles.processStep}>
                    <View style={styles.stepNumber}>
                      <Text style={styles.stepNumberText}>2</Text>
                    </View>
                    <View style={styles.stepContent}>
                      <Text style={styles.stepTitle}>Phone Screening</Text>
                      <Text style={styles.stepDescription}>Brief call with our talent team (30 minutes)</Text>
                    </View>
                  </View>
                  
                  <View style={styles.processStep}>
                    <View style={styles.stepNumber}>
                      <Text style={styles.stepNumberText}>3</Text>
                    </View>
                    <View style={styles.stepContent}>
                      <Text style={styles.stepTitle}>Technical Interview</Text>
                      <Text style={styles.stepDescription}>Skills assessment and technical discussion</Text>
                    </View>
                  </View>
                  
                  <View style={styles.processStep}>
                    <View style={styles.stepNumber}>
                      <Text style={styles.stepNumberText}>4</Text>
                    </View>
                    <View style={styles.stepContent}>
                      <Text style={styles.stepTitle}>Team Interview</Text>
                      <Text style={styles.stepDescription}>Meet the team and discuss culture fit</Text>
                    </View>
                  </View>
                  
                  <View style={styles.processStep}>
                    <View style={styles.stepNumber}>
                      <Text style={styles.stepNumberText}>5</Text>
                    </View>
                    <View style={styles.stepContent}>
                      <Text style={styles.stepTitle}>Offer & Onboarding</Text>
                      <Text style={styles.stepDescription}>Welcome to the team! 🎉</Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Contact */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>📞 Questions?</Text>
                <Text style={styles.text}>
                  Have questions about a role or our company? We'd love to hear from you!
                </Text>
                <Text style={styles.contactText}>📧 careers@edudashpro.com</Text>
                <Text style={styles.contactText}>📞 +27 67 477 0975</Text>
                <Text style={styles.contactText}>🏢 848 Shabangu Avenue, Mamelodi, Pretoria 0122</Text>
                
                <TouchableOpacity 
                  style={styles.joinTeamButton}
                  onPress={() => router.push('/support/contact')}
                >
                  <LinearGradient
                    colors={['#00f5ff', '#0080ff']}
                    style={styles.joinTeamGradient}
                  >
                    <IconSymbol name="person.badge.plus.fill" size={20} color="#000000" />
                    <Text style={styles.joinTeamText}>Get in Touch</Text>
                  </LinearGradient>
                </TouchableOpacity>
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
  
  // Why Us
  whyUsContainer: {
    gap: 15,
  },
  whyUsItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 15,
  },
  whyUsEmoji: {
    fontSize: 24,
  },
  whyUsContent: {
    flex: 1,
  },
  whyUsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  whyUsText: {
    fontSize: 14,
    color: '#CCCCCC',
    lineHeight: 20,
  },
  
  // Benefits Grid
  benefitsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
  },
  benefitCard: {
    width: width < 400 ? (width - 50) : (width - 70) / 2,
    borderRadius: 15,
    overflow: 'hidden',
  },
  benefitGradient: {
    padding: 20,
    alignItems: 'center',
    minHeight: 120,
  },
  benefitTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#000000',
    marginVertical: 6,
    textAlign: 'center',
  },
  benefitDescription: {
    fontSize: 11,
    color: 'rgba(0,0,0,0.7)',
    textAlign: 'center',
    lineHeight: 14,
  },
  
  // Culture
  cultureGrid: {
    gap: 15,
  },
  cultureCard: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  cultureGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 15,
  },
  cultureEmoji: {
    fontSize: 32,
  },
  cultureTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
    flex: 1,
  },
  cultureDescription: {
    fontSize: 12,
    color: '#CCCCCC',
    lineHeight: 16,
    flex: 2,
  },
  
  // Filter
  filterScroll: {
    marginBottom: 20,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 5,
  },
  filterButton: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  filterButtonActive: {
    // No additional styles needed as gradient handles it
  },
  filterGradient: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  filterText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#000000',
  },
  
  // Jobs
  jobsContainer: {
    gap: 20,
  },
  jobCard: {
    borderRadius: 15,
    overflow: 'hidden',
  },
  jobGradient: {
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,245,255,0.1)',
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  jobTitleContainer: {
    flex: 1,
  },
  jobTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  jobDepartment: {
    fontSize: 14,
    color: '#00f5ff',
    fontWeight: '600',
  },
  jobTypeContainer: {
    marginLeft: 10,
  },
  jobTypeBadge: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  jobTypeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#000000',
  },
  jobDescription: {
    fontSize: 14,
    color: '#CCCCCC',
    lineHeight: 20,
    marginBottom: 15,
  },
  jobDetails: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 15,
  },
  jobDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  jobDetailText: {
    fontSize: 12,
    color: '#CCCCCC',
  },
  jobRequirements: {
    marginBottom: 15,
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  requirementText: {
    fontSize: 12,
    color: '#CCCCCC',
    lineHeight: 16,
    marginBottom: 4,
    marginLeft: 5,
  },
  applyButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  applyGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  applyText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#00f5ff',
  },
  
  // Process Steps
  processContainer: {
    gap: 20,
  },
  processStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 15,
  },
  stepNumber: {
    backgroundColor: 'rgba(0,245,255,0.2)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#00f5ff',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 14,
    color: '#CCCCCC',
    lineHeight: 20,
  },
  
  // Contact
  contactText: {
    fontSize: 14,
    color: '#00f5ff',
    lineHeight: 22,
    marginBottom: 8,
    fontWeight: '600',
  },
  joinTeamButton: {
    borderRadius: 15,
    overflow: 'hidden',
    marginTop: 15,
  },
  joinTeamGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  joinTeamText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#000000',
  },
  footer: {
    height: 50,
  },
});
