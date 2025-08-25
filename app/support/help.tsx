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

export default function HelpCenterPage() {
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);

  const faqData = [
    {
      question: "How do I create my first classroom?",
      answer: "After signing up as a teacher, go to your dashboard and click 'Create New Classroom'. Enter your classroom name, grade level, and add students by sharing your classroom code or inviting parents via email."
    },
    {
      question: "How can parents track their child's progress?",
      answer: "Parents receive weekly progress reports via email and can access real-time updates through the parent dashboard. They can view homework submissions, grades, and teacher feedback instantly."
    },
    {
      question: "Is EduDash Pro safe for children?",
      answer: "Yes! We are COPPA compliant and prioritize child safety. All content is age-appropriate, we don't collect unnecessary data, and parents have full control over their child's account."
    },
    {
      question: "How does the AI lesson generation work?",
      answer: "Our AI analyzes your curriculum, student needs, and learning objectives to create personalized lesson plans. You can customize any generated content to match your teaching style."
    },
    {
      question: "Can I use EduDash Pro offline?",
      answer: "Some features work offline including viewing downloaded lessons and completing activities. However, real-time syncing, messaging, and AI features require an internet connection."
    },
    {
      question: "How do I reset my password?",
      answer: "Go to the sign-in page and click 'Forgot Password'. Enter your email address and we'll send you a secure link to reset your password."
    },
    {
      question: "What ages is EduDash Pro suitable for?",
      answer: "EduDash Pro is designed for children aged 1-18, with age-appropriate content and features tailored for different developmental stages from early childhood to high school."
    },
    {
      question: "How do I contact technical support?",
      answer: "You can reach our support team via email at support@edudashpro.com or call us at +27 67 477 0975. We typically respond within 24 hours during business days."
    }
  ];

  const supportResources = [
    {
      title: "📚 User Guides",
      description: "Step-by-step guides for teachers, parents, and administrators",
      icon: "book.fill",
      color: ['#00f5ff', '#0080ff']
    },
    {
      title: "🎥 Video Tutorials",
      description: "Watch video walkthroughs of key features and workflows",
      icon: "play.circle.fill",
      color: ['#8000ff', '#ff0080']
    },
    {
      title: "💬 Community Forum",
      description: "Connect with other educators and share best practices",
      icon: "bubble.left.and.bubble.right.fill",
      color: ['#ff0080', '#ff8000']
    },
    {
      title: "🔧 Technical Support",
      description: "Get help with technical issues and troubleshooting",
      icon: "wrench.and.screwdriver.fill",
      color: ['#ff8000', '#80ff00']
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
              <Text style={styles.title}>Help Center</Text>
              <Text style={styles.subtitle}>Support & Resources</Text>
            </View>
          </View>

          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            <View style={styles.content}>
              
              {/* Quick Support */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>🚀 Quick Support</Text>
                <View style={styles.quickSupportContainer}>
                  <TouchableOpacity 
                    style={styles.quickSupportButton}
                    onPress={() => router.push('/support/contact')}
                  >
                    <LinearGradient
                      colors={['rgba(0,245,255,0.1)', 'rgba(128,0,255,0.1)']}
                      style={styles.quickSupportGradient}
                    >
                      <IconSymbol name="envelope.fill" size={24} color="#00f5ff" />
                      <Text style={styles.quickSupportText}>Contact Support</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.quickSupportButton}
                    onPress={() => {/* Link to video calls */}}
                  >
                    <LinearGradient
                      colors={['rgba(255,0,128,0.1)', 'rgba(255,128,0,0.1)']}
                      style={styles.quickSupportGradient}
                    >
                      <IconSymbol name="video.fill" size={24} color="#ff0080" />
                      <Text style={styles.quickSupportText}>Schedule Call</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Support Resources */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>📖 Support Resources</Text>
                <View style={styles.resourcesGrid}>
                  {supportResources.map((resource, index) => (
                    <TouchableOpacity key={index} style={styles.resourceCard}>
                      <LinearGradient 
                        colors={resource.color as [string, string]} 
                        style={styles.resourceGradient}
                      >
                        <IconSymbol name={resource.icon} size={32} color="#000000" />
                        <Text style={styles.resourceTitle}>{resource.title}</Text>
                        <Text style={styles.resourceDescription}>{resource.description}</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Frequently Asked Questions */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>❓ Frequently Asked Questions</Text>
                <View style={styles.faqContainer}>
                  {faqData.map((faq, index) => (
                    <TouchableOpacity 
                      key={index}
                      style={styles.faqItem}
                      onPress={() => setExpandedFAQ(expandedFAQ === index ? null : index)}
                    >
                      <LinearGradient 
                        colors={expandedFAQ === index ? ['rgba(0,245,255,0.1)', 'rgba(128,0,255,0.1)'] : ['rgba(0,245,255,0.05)', 'rgba(128,0,255,0.05)']} 
                        style={styles.faqGradient}
                      >
                        <View style={styles.faqHeader}>
                          <Text style={styles.faqQuestion}>{faq.question}</Text>
                          <IconSymbol 
                            name={expandedFAQ === index ? "chevron.up" : "chevron.down"} 
                            size={20} 
                            color="#00f5ff" 
                          />
                        </View>
                        {expandedFAQ === index && (
                          <Text style={styles.faqAnswer}>{faq.answer}</Text>
                        )}
                      </LinearGradient>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Getting Started */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>🎯 Getting Started</Text>
                <View style={styles.gettingStartedContainer}>
                  <Text style={styles.text}>New to EduDash Pro? Here's how to get started:</Text>
                  
                  <View style={styles.stepContainer}>
                    <Text style={styles.stepNumber}>1</Text>
                    <View style={styles.stepContent}>
                      <Text style={styles.stepTitle}>Create Your Account</Text>
                      <Text style={styles.stepDescription}>
                        Sign up as a parent, teacher, or administrator based on your role
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.stepContainer}>
                    <Text style={styles.stepNumber}>2</Text>
                    <View style={styles.stepContent}>
                      <Text style={styles.stepTitle}>Set Up Your Profile</Text>
                      <Text style={styles.stepDescription}>
                        Complete your profile with relevant information and preferences
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.stepContainer}>
                    <Text style={styles.stepNumber}>3</Text>
                    <View style={styles.stepContent}>
                      <Text style={styles.stepTitle}>Explore Features</Text>
                      <Text style={styles.stepDescription}>
                        Discover AI-powered lessons, progress tracking, and communication tools
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.stepContainer}>
                    <Text style={styles.stepNumber}>4</Text>
                    <View style={styles.stepContent}>
                      <Text style={styles.stepTitle}>Connect & Collaborate</Text>
                      <Text style={styles.stepDescription}>
                        Invite students, parents, or colleagues to start collaborating
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Contact Information */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>📞 Need More Help?</Text>
                <Text style={styles.text}>
                  Can't find what you're looking for? Our support team is here to help!
                </Text>
                <Text style={styles.contactText}>📧 support@edudashpro.com</Text>
                <Text style={styles.contactText}>📞 +27 67 477 0975</Text>
                <Text style={styles.contactText}>🏢 848 Shabangu Avenue, Mamelodi, Pretoria 0122</Text>
                
                <Text style={styles.text}>
                  Support hours: Monday - Friday, 8:00 AM - 6:00 PM SAST
                  {"\n"}Emergency support available 24/7 for critical issues
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
  
  // Quick Support
  quickSupportContainer: {
    flexDirection: 'row',
    gap: 15,
  },
  quickSupportButton: {
    flex: 1,
    borderRadius: 15,
    overflow: 'hidden',
  },
  quickSupportGradient: {
    padding: 20,
    alignItems: 'center',
    gap: 10,
  },
  quickSupportText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  
  // Resources Grid
  resourcesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
  },
  resourceCard: {
    width: width < 400 ? (width - 50) : (width - 70) / 2,
    borderRadius: 15,
    overflow: 'hidden',
  },
  resourceGradient: {
    padding: 20,
    alignItems: 'center',
    minHeight: 140,
  },
  resourceTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#000000',
    marginVertical: 8,
    textAlign: 'center',
  },
  resourceDescription: {
    fontSize: 12,
    color: 'rgba(0,0,0,0.7)',
    textAlign: 'center',
    lineHeight: 16,
  },
  
  // FAQ
  faqContainer: {
    gap: 12,
  },
  faqItem: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  faqGradient: {
    padding: 16,
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQuestion: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
    marginRight: 10,
  },
  faqAnswer: {
    fontSize: 14,
    color: '#CCCCCC',
    lineHeight: 20,
    marginTop: 12,
  },
  
  // Getting Started Steps
  gettingStartedContainer: {
    gap: 15,
  },
  stepContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 15,
  },
  stepNumber: {
    fontSize: 20,
    fontWeight: '900',
    color: '#00f5ff',
    backgroundColor: 'rgba(0,245,255,0.1)',
    borderRadius: 20,
    width: 40,
    height: 40,
    textAlign: 'center',
    lineHeight: 40,
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
  footer: {
    height: 50,
  },
});
