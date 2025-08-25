import React, { useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet, 
  Dimensions,
  TextInput,
  Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { IconSymbol } from '@/components/ui/IconSymbol';

const { width, height } = Dimensions.get('window');

export default function ContactSupportPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');

  const supportCategories = [
    {
      id: 'technical',
      title: 'Technical Issues',
      description: 'App crashes, login problems, sync issues',
      icon: 'wrench.and.screwdriver.fill',
      color: ['#ff0080', '#ff8000']
    },
    {
      id: 'account',
      title: 'Account & Billing',
      description: 'Subscription, payments, account settings',
      icon: 'creditcard.fill',
      color: ['#00f5ff', '#0080ff']
    },
    {
      id: 'educational',
      title: 'Educational Support',
      description: 'Curriculum questions, teaching strategies',
      icon: 'graduationcap.fill',
      color: ['#8000ff', '#ff0080']
    },
    {
      id: 'safety',
      title: 'Child Safety',
      description: 'Privacy concerns, safety reports',
      icon: 'shield.fill',
      color: ['#ff8000', '#80ff00']
    }
  ];

  const contactMethods = [
    {
      title: 'Email Support',
      description: 'Get detailed help via email',
      detail: 'support@edudashpro.com',
      icon: 'envelope.fill',
      color: ['#00f5ff', '#0080ff'],
      responseTime: '24 hours'
    },
    {
      title: 'Phone Support',
      description: 'Speak directly with our team',
      detail: '+27 67 477 0975',
      icon: 'phone.fill',
      color: ['#8000ff', '#ff0080'],
      responseTime: 'Immediate'
    },
    {
      title: 'WhatsApp Chat',
      description: 'Quick help via WhatsApp',
      detail: '+27 67 477 0975',
      icon: 'message.fill',
      color: ['#25D366', '#20B858'],
      responseTime: '1-2 hours'
    },
    {
      title: 'Help Center',
      description: 'Browse FAQs and guides',
      detail: 'Visit Help Center',
      icon: 'questionmark.circle.fill',
      color: ['#ff0080', '#ff8000'],
      responseTime: 'Instant'
    }
  ];

  const handleSubmitTicket = () => {
    if (!name.trim() || !email.trim() || !message.trim() || !selectedCategory) {
      Alert.alert('Missing Information', 'Please fill in all fields and select a category.');
      return;
    }

    // Here you would typically send the support ticket to your backend
    Alert.alert(
      'Support Ticket Submitted',
      'Thank you for contacting us! We\'ll get back to you within 24 hours.',
      [{ text: 'OK', onPress: () => router.back() }]
    );
  };

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
              <Text style={styles.title}>Contact Support</Text>
              <Text style={styles.subtitle}>We're here to help you 24/7</Text>
            </View>
          </View>

          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            <View style={styles.content}>
              
              {/* Contact Methods */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>📞 Contact Methods</Text>
                <View style={styles.contactMethodsGrid}>
                  {contactMethods.map((method, index) => (
                    <TouchableOpacity 
                      key={index} 
                      style={styles.contactMethodCard}
                      onPress={() => {
                        if (method.title === 'Help Center') {
                          router.push('/support/help');
                        } else if (method.title === 'Email Support') {
                          // Open email client
                        } else if (method.title === 'Phone Support' || method.title === 'WhatsApp Chat') {
                          // Open phone or WhatsApp
                        }
                      }}
                    >
                      <LinearGradient 
                        colors={method.color as [string, string]} 
                        style={styles.contactMethodGradient}
                      >
                        <IconSymbol name={method.icon} size={28} color="#000000" />
                        <Text style={styles.contactMethodTitle}>{method.title}</Text>
                        <Text style={styles.contactMethodDescription}>{method.description}</Text>
                        <Text style={styles.contactMethodDetail}>{method.detail}</Text>
                        <View style={styles.responseTimeContainer}>
                          <Text style={styles.responseTimeText}>⏱️ {method.responseTime}</Text>
                        </View>
                      </LinearGradient>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Support Ticket Form */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>📝 Submit Support Ticket</Text>
                
                {/* Category Selection */}
                <Text style={styles.formLabel}>Select Category</Text>
                <View style={styles.categoriesGrid}>
                  {supportCategories.map((category) => (
                    <TouchableOpacity 
                      key={category.id}
                      style={[
                        styles.categoryCard,
                        selectedCategory === category.id && styles.categoryCardSelected
                      ]}
                      onPress={() => setSelectedCategory(category.id)}
                    >
                      <LinearGradient 
                        colors={selectedCategory === category.id 
                          ? category.color as [string, string]
                          : ['rgba(0,245,255,0.05)', 'rgba(128,0,255,0.05)']
                        } 
                        style={styles.categoryGradient}
                      >
                        <IconSymbol 
                          name={category.icon} 
                          size={24} 
                          color={selectedCategory === category.id ? '#000000' : '#00f5ff'} 
                        />
                        <Text style={[
                          styles.categoryTitle,
                          selectedCategory === category.id && styles.categoryTitleSelected
                        ]}>
                          {category.title}
                        </Text>
                        <Text style={[
                          styles.categoryDescription,
                          selectedCategory === category.id && styles.categoryDescriptionSelected
                        ]}>
                          {category.description}
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Form Fields */}
                <View style={styles.formContainer}>
                  <View style={styles.inputContainer}>
                    <Text style={styles.formLabel}>Your Name</Text>
                    <TextInput
                      style={styles.textInput}
                      value={name}
                      onChangeText={setName}
                      placeholder="Enter your full name"
                      placeholderTextColor="#666666"
                    />
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={styles.formLabel}>Email Address</Text>
                    <TextInput
                      style={styles.textInput}
                      value={email}
                      onChangeText={setEmail}
                      placeholder="your@email.com"
                      placeholderTextColor="#666666"
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={styles.formLabel}>Describe Your Issue</Text>
                    <TextInput
                      style={[styles.textInput, styles.messageInput]}
                      value={message}
                      onChangeText={setMessage}
                      placeholder="Please provide as much detail as possible about your issue..."
                      placeholderTextColor="#666666"
                      multiline
                      numberOfLines={4}
                    />
                  </View>

                  <TouchableOpacity style={styles.submitButton} onPress={handleSubmitTicket}>
                    <LinearGradient
                      colors={['#00f5ff', '#0080ff']}
                      style={styles.submitGradient}
                    >
                      <IconSymbol name="paperplane.fill" size={20} color="#000000" />
                      <Text style={styles.submitText}>Submit Support Ticket</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Emergency Support */}
              <View style={styles.emergencySection}>
                <Text style={styles.emergencyTitle}>🚨 Emergency Support</Text>
                <Text style={styles.emergencyText}>
                  For urgent child safety matters or critical system issues that affect student safety, 
                  contact us immediately:
                </Text>
                <TouchableOpacity style={styles.emergencyButton}>
                  <LinearGradient
                    colors={['rgba(255,0,128,0.2)', 'rgba(255,128,0,0.2)']}
                    style={styles.emergencyGradient}
                  >
                    <IconSymbol name="phone.fill" size={24} color="#ff0080" />
                    <View style={styles.emergencyInfo}>
                      <Text style={styles.emergencyContact}>+27 67 477 0975</Text>
                      <Text style={styles.emergencySubtext}>Available 24/7 for emergencies</Text>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              {/* Office Hours */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>🕒 Support Hours</Text>
                <View style={styles.hoursContainer}>
                  <View style={styles.hoursRow}>
                    <Text style={styles.hoursDay}>Monday - Friday</Text>
                    <Text style={styles.hoursTime}>8:00 AM - 6:00 PM SAST</Text>
                  </View>
                  <View style={styles.hoursRow}>
                    <Text style={styles.hoursDay}>Weekends</Text>
                    <Text style={styles.hoursTime}>10:00 AM - 4:00 PM SAST</Text>
                  </View>
                  <View style={styles.hoursRow}>
                    <Text style={styles.hoursDay}>Emergency</Text>
                    <Text style={styles.hoursTime}>24/7 Available</Text>
                  </View>
                </View>
                
                <Text style={styles.text}>
                  We aim to respond to all support requests within 24 hours during business days, 
                  and within 48 hours on weekends. Emergency issues are handled immediately.
                </Text>
              </View>

              {/* Contact Information */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>📍 Our Office</Text>
                <Text style={styles.contactText}>📧 support@edudashpro.com</Text>
                <Text style={styles.contactText}>📞 +27 67 477 0975</Text>
                <Text style={styles.contactText}>🏢 848 Shabangu Avenue, Mamelodi, Pretoria 0122</Text>
                <Text style={styles.contactText}>🇿🇦 South Africa</Text>
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
  
  // Contact Methods
  contactMethodsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
  },
  contactMethodCard: {
    width: width < 400 ? (width - 50) : (width - 70) / 2,
    borderRadius: 15,
    overflow: 'hidden',
  },
  contactMethodGradient: {
    padding: 20,
    alignItems: 'center',
    minHeight: 160,
  },
  contactMethodTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#000000',
    marginVertical: 8,
    textAlign: 'center',
  },
  contactMethodDescription: {
    fontSize: 12,
    color: 'rgba(0,0,0,0.7)',
    textAlign: 'center',
    marginBottom: 8,
  },
  contactMethodDetail: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 10,
  },
  responseTimeContainer: {
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 'auto',
  },
  responseTimeText: {
    fontSize: 10,
    color: '#000000',
    fontWeight: '600',
  },
  
  // Categories
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  categoryCard: {
    width: width < 400 ? (width - 50) : (width - 70) / 2,
    borderRadius: 12,
    overflow: 'hidden',
  },
  categoryCardSelected: {
    borderWidth: 2,
    borderColor: '#00f5ff',
  },
  categoryGradient: {
    padding: 16,
    alignItems: 'center',
    minHeight: 100,
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginVertical: 6,
    textAlign: 'center',
  },
  categoryTitleSelected: {
    color: '#000000',
  },
  categoryDescription: {
    fontSize: 11,
    color: '#CCCCCC',
    textAlign: 'center',
    lineHeight: 14,
  },
  categoryDescriptionSelected: {
    color: 'rgba(0,0,0,0.7)',
  },
  
  // Form
  formContainer: {
    gap: 20,
  },
  inputContainer: {
    gap: 8,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  textInput: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(0,245,255,0.3)',
  },
  messageInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    borderRadius: 15,
    overflow: 'hidden',
    marginTop: 10,
  },
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  submitText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#000000',
  },
  
  // Emergency Support
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
    marginBottom: 15,
  },
  emergencyButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  emergencyGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 15,
  },
  emergencyInfo: {
    flex: 1,
  },
  emergencyContact: {
    fontSize: 18,
    color: '#ff0080',
    fontWeight: '700',
    marginBottom: 4,
  },
  emergencySubtext: {
    fontSize: 12,
    color: '#CCCCCC',
  },
  
  // Hours
  hoursContainer: {
    backgroundColor: 'rgba(0,245,255,0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(0,245,255,0.1)',
  },
  hoursRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  hoursDay: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  hoursTime: {
    fontSize: 14,
    color: '#00f5ff',
    fontWeight: '600',
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
