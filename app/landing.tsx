import React, { useEffect, useState, useRef } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet, 
  Animated, 
  Dimensions,
  ImageBackground,
  Platform,
  Modal,
  FlatList,
  ColorValue
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { DesignSystem, getRoleColors } from '@/constants/DesignSystem';
import { PricingComponent } from '@/components/pricing/PricingComponent';
import { AdBanner, SponsoredContent, RevenueBanner } from '@/components/advertising/AdComponents';
import { advertisingService } from '@/lib/services/advertisingService';

const { width, height } = Dimensions.get('window');

// TypeScript interfaces for component props
interface HoloStatCardProps {
  icon: string;
  number: string;
  label: string;
  color: readonly ColorValue[];
}

interface FeaturesSectionProps {
  setSelectedFeature: (feature: any) => void;
}

interface TestimonialsSectionProps {
  activeTestimonial: number;
  setActiveTestimonial: (index: number | ((prev: number) => number)) => void;
}

interface QASectionProps {
  showQA: boolean;
  setShowQA: (show: boolean) => void;
}

interface FeatureModalProps {
  selectedFeature: any;
  setSelectedFeature: (feature: any) => void;
}

// Society 5.0 Futuristic Marketing Page for EduDash Pro
export default function FuturisticMarketingPage() {
  const [scrollY] = useState(new Animated.Value(0));
  const [isLoaded, setIsLoaded] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [showQA, setShowQA] = useState(false);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  
  const floatingAnimation = useRef(new Animated.Value(0)).current;
  const pulseAnimation = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    setIsLoaded(true);
    
    // Start floating animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatingAnimation, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(floatingAnimation, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Start pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1.1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar style="light" translucent />
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        <HeroSection />
        <RoleBasedBenefitsSection />
        <FeaturesSection setSelectedFeature={setSelectedFeature} />
        <TestimonialsSection activeTestimonial={activeTestimonial} setActiveTestimonial={setActiveTestimonial} />
        <EmbeddedPricingSection />
        <QASection showQA={showQA} setShowQA={setShowQA} />
        <EnhancedAdSection />
        <FooterSection />
      </ScrollView>
      
      <FeatureModal selectedFeature={selectedFeature} setSelectedFeature={setSelectedFeature} />
    </View>
  );
}

// Hero Section with Society 5.0 aesthetics
const HeroSection = () => {
  const floatingY = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatingY, {
          toValue: -20,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(floatingY, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.heroContainer}>
      <LinearGradient
        colors={['#0a0a0f', '#1a0a2e', '#16213e', '#0f3460', '#533a71']}
        style={styles.heroGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Animated Particles */}
        <View style={styles.particleContainer}>
          {[...Array(20)].map((_, i) => (
            <Animated.View
              key={i}
              style={[
                styles.particle,
                {
                  left: Math.random() * width,
                  top: Math.random() * height,
                  transform: [{ translateY: floatingY }],
                  opacity: Math.random() * 0.8 + 0.2,
                }
              ]}
            />
          ))}
        </View>

        <SafeAreaView style={styles.heroContent}>
          {/* Futuristic Navigation */}
          <View style={styles.navbar}>
            <View style={styles.logo}>
              <LinearGradient
                colors={['#00f5ff', '#0080ff', '#8000ff']}
                style={styles.logoGradient}
              >
                <IconSymbol name="brain" size={28} color="#FFFFFF" />
              </LinearGradient>
              <Text style={styles.logoText}>EduDash Pro</Text>
              <Text style={styles.logoSubtext}>Society 5.0</Text>
            </View>
            <TouchableOpacity 
              style={styles.accessButton}
              onPress={() => router.push('/(auth)/sign-in')}
            >
              <LinearGradient
                colors={['#00f5ff', '#0080ff']}
                style={styles.accessGradient}
              >
                <Text style={styles.accessButtonText}>Neural Access</Text>
                <IconSymbol name="arrow.right" size={16} color="#000000" />
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Hero Content */}
          <View style={styles.heroTextContainer}>
            <Animated.View style={[styles.heroTitle, { transform: [{ translateY: floatingY }] }]}>
              <Text style={styles.heroMainTitle}>
                <Text style={styles.gradientTextPrimary}>NEURAL</Text>
                {' '}EDUCATION{'\n'}
                <Text style={styles.gradientTextSecondary}>REVOLUTION</Text>
              </Text>
              <Text style={styles.heroTagline}>
                🚀 Society 5.0 • AI • Robotics • Virtual Reality • Quantum Learning
              </Text>
              <Text style={styles.heroSubtitle}>
                The convergence of artificial intelligence, quantum computing, 
                and neural networks creates the ultimate educational ecosystem 
                for the super-human digital age.
              </Text>
            </Animated.View>

            {/* Holographic Stats */}
            <View style={styles.holoStats}>
              <HoloStatCard icon="cpu" number="∞" label="AI Neurons" color={['#00f5ff', '#0080ff']} />
              <HoloStatCard icon="brain" number="5.0" label="Society" color={['#8000ff', '#ff0080']} />
              <HoloStatCard icon="sparkles" number="∞²" label="Possibilities" color={['#ff0080', '#ff8000']} />
            </View>

            {/* Futuristic CTA Buttons */}
            <View style={styles.heroActions}>
              <TouchableOpacity 
                style={styles.primaryCTA}
                onPress={() => router.push('/(auth)/sign-up')}
              >
                <LinearGradient
                  colors={['#00f5ff', '#0080ff', '#8000ff']}
                  style={styles.ctaGradient}
                >
                  <IconSymbol name="bolt" size={20} color="#000000" />
                  <Text style={styles.ctaText}>ACTIVATE NEURAL LINK</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.secondaryCTA}
                onPress={() => router.push('/(auth)/sign-in')}
              >
                <LinearGradient
                  colors={['rgba(0,245,255,0.1)', 'rgba(0,128,255,0.1)']}
                  style={styles.secondaryGradient}
                >
                  <Text style={styles.secondaryCtaText}>Access Portal</Text>
                  <IconSymbol name="arrow.right" size={16} color="#00f5ff" />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
};

// Holographic Stats Card Component
const HoloStatCard: React.FC<HoloStatCardProps> = ({ icon, number, label, color }) => (
  <View style={styles.holoCard}>
    <LinearGradient colors={color as readonly [string, string, ...string[]]} style={styles.holoCardGradient}>
      <IconSymbol name={icon} size={24} color="#000000" />
      <Text style={styles.holoNumber}>{number}</Text>
      <Text style={styles.holoLabel}>{label}</Text>
    </LinearGradient>
  </View>
);

// Revolutionary Features Section
const FeaturesSection: React.FC<FeaturesSectionProps> = ({ setSelectedFeature }) => {
  const features = [
    {
      id: 1,
      title: "🧠 Quantum AI Brain",
      subtitle: "Neural Processing Unit",
      description: "Advanced quantum AI that thinks like a teacher, adapts like a student",
      tech: "Claude 4.0 + Quantum Computing",
      color: ['#00f5ff', '#0080ff']
    },
    {
      id: 2,
      title: "🤖 Robotic Tutors",
      subtitle: "Digital Companions",
      description: "Virtual reality teachers that provide 24/7 personalized education",
      tech: "AR/VR + Machine Learning",
      color: ['#8000ff', '#ff0080']
    },
    {
      id: 3,
      title: "🔮 Predictive Analytics",
      subtitle: "Future Vision",
      description: "Predict student needs before they know them themselves",
      tech: "Deep Learning + Big Data",
      color: ['#ff0080', '#ff8000']
    },
    {
      id: 4,
      title: "🚀 Holographic Lessons",
      subtitle: "3D Reality",
      description: "Immersive 3D lessons that bring learning to life",
      tech: "Holography + Spatial Computing",
      color: ['#ff8000', '#80ff00']
    },
    {
      id: 5,
      title: "⚡ Neural Networks",
      subtitle: "Brain Sync",
      description: "Direct neural interface for instant knowledge transfer",
      tech: "BCI + Neuromorphic Computing",
      color: ['#80ff00', '#00f5ff']
    },
    {
      id: 6,
      title: "🌐 Metaverse Campus",
      subtitle: "Virtual World",
      description: "Infinite virtual campuses across multiple dimensions",
      tech: "Web3 + Blockchain + VR",
      color: ['#00f5ff', '#8000ff']
    }
  ];

  return (
    <View style={styles.featuresContainer}>
      <LinearGradient colors={['#0a0a0f', '#1a1a2e']} style={styles.featuresGradient}>
        <Text style={styles.sectionTitle}>REVOLUTIONARY TECH</Text>
        <Text style={styles.sectionSubtitle}>
          Powered by Society 5.0 • Quantum Computing • Neural Networks
        </Text>

        <View style={styles.featuresGrid}>
          {features.map((feature) => (
            <TouchableOpacity 
              key={feature.id}
              style={styles.featureCard}
              onPress={() => setSelectedFeature(feature)}
            >
              <LinearGradient colors={feature.color as [string, string]} style={styles.featureGradient}>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureSubtitle}>{feature.subtitle}</Text>
                <Text style={styles.featureDescription}>{feature.description}</Text>
                <View style={styles.featureTech}>
                  <Text style={styles.featureTechText}>{feature.tech}</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>
      </LinearGradient>
    </View>
  );
};

// Testimonials Section with Video Support
const TestimonialsSection: React.FC<TestimonialsSectionProps> = ({ activeTestimonial, setActiveTestimonial }) => {
  const testimonials = [
    {
      name: "Dr. Sarah Chen",
      role: "Quantum Education Specialist",
      school: "Neo Tokyo Academy",
      message: "EduDash Pro has revolutionized our teaching methods. The AI is so advanced, it's like having a team of PhD educators in every classroom.",
      rating: 5,
      avatar: "👩‍🔬",
      isVideo: true
    },
    {
      name: "Prof. Marcus Webb",
      role: "Neural Interface Designer", 
      school: "Cyberpunk University",
      message: "The neural network integration is phenomenal. Students are learning 10x faster than traditional methods.",
      rating: 5,
      avatar: "👨‍💻",
      isVideo: false
    },
    {
      name: "Principal Mabol Mabasa",
      role: "Future Learning Director",
      school: "Quantum Kids Academy", 
      message: "Society 5.0 education is finally here. Our students are preparing for jobs that don't even exist yet.",
      rating: 5,
      avatar: "👩‍🚀",
      isVideo: true
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.testimonialsContainer}>
      <LinearGradient colors={['#1a1a2e', '#16213e']} style={styles.testimonialsGradient}>
        <Text style={styles.sectionTitle}>NEURAL TESTIMONIALS</Text>
        <Text style={styles.sectionSubtitle}>
          From the future educators using tomorrow's technology today
        </Text>

        <View style={styles.testimonialCard}>
          <LinearGradient 
            colors={['rgba(0,245,255,0.1)', 'rgba(128,0,255,0.1)']} 
            style={styles.testimonialGradient}
          >
            <View style={styles.testimonialHeader}>
              <View style={styles.avatarContainer}>
                <Text style={styles.avatar}>{testimonials[activeTestimonial].avatar}</Text>
                {testimonials[activeTestimonial].isVideo && (
                  <View style={styles.videoIndicator}>
                    <IconSymbol name="play.fill" size={12} color="#00f5ff" />
                  </View>
                )}
              </View>
              <View style={styles.testimonialInfo}>
                <Text style={styles.testimonialName}>{testimonials[activeTestimonial].name}</Text>
                <Text style={styles.testimonialRole}>{testimonials[activeTestimonial].role}</Text>
                <Text style={styles.testimonialSchool}>{testimonials[activeTestimonial].school}</Text>
              </View>
              <View style={styles.ratingContainer}>
                {[...Array(testimonials[activeTestimonial].rating)].map((_, i) => (
                  <Text key={i} style={styles.star}>⭐</Text>
                ))}
              </View>
            </View>
            <Text style={styles.testimonialMessage}>"{testimonials[activeTestimonial].message}"</Text>
            
            {/* Navigation Dots */}
            <View style={styles.testimonialDots}>
              {testimonials.map((_, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.dot,
                    index === activeTestimonial && styles.activeDot
                  ]}
                  onPress={() => setActiveTestimonial(index)}
                />
              ))}
            </View>
          </LinearGradient>
        </View>
        
        {/* Navigation to About Team Section */}
        <View style={styles.teamNavigationContainer}>
          <TouchableOpacity 
            style={styles.teamNavigationButton}
            onPress={() => router.push('/about#team')}
          >
            <LinearGradient
              colors={['rgba(0,245,255,0.1)', 'rgba(128,0,255,0.1)']}
              style={styles.teamNavigationGradient}
            >
              <Text style={styles.teamNavigationText}>Meet Our Team</Text>
              <IconSymbol name="arrow.right" size={16} color="#00f5ff" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );
};

// Futuristic Pricing Section
const PricingSection = () => {
  const pricingPlans = [
    {
      name: "Neural Starter",
      price: "R0",
      period: "/month",
      description: "Perfect for getting started with AI education",
      features: [
        "⚡ Up to 10 students",
        "🧠 Basic progress tracking",
        "📱 Mobile app access",
        "👨‍👩‍👧‍👦 Parent-teacher messaging",
        "🎨 Basic lesson plans"
      ],
      color: ['#00f5ff', '#0080ff'],
      popular: false,
      targetRole: 'individual'
    },
    {
      name: "Quantum Pro",
      price: "R299",
      period: "/month",
      description: "Most popular for schools and educators",
      features: [
        "⚡ Unlimited students",
        "🧠 Advanced AI lesson generation",
        "🤖 Automated homework grading",
        "🔮 Predictive analytics",
        "🚀 Interactive STEM activities",
        "📊 Comprehensive reporting",
        "⚡ Priority support"
      ],
      color: ['#8000ff', '#ff0080'],
      popular: true,
      targetRole: 'school'
    },
    {
      name: "Enterprise",
      price: "R999",
      period: "/month",
      description: "For large institutions and districts",
      features: [
        "♾️ Multi-school management",
        "🧠 Custom AI training",
        "🤖 White-label options",
        "🔮 Advanced analytics",
        "🚀 API access",
        "🌌 Custom integrations",
        "⚡ Dedicated support",
        "👑 Premium features"
      ],
      color: ['#ff0080', '#ff8000'],
      popular: false,
      targetRole: 'enterprise'
    }
  ];

  return (
    <View style={styles.pricingContainer}>
      <LinearGradient colors={['#16213e', '#0f3460']} style={styles.pricingGradient}>
        <Text style={styles.sectionTitle}>QUANTUM PRICING</Text>
        <Text style={styles.sectionSubtitle}>
          Choose your reality • Transcend dimensions • Unlock infinite potential
        </Text>

        <View style={styles.pricingGrid}>
          {pricingPlans.map((plan, index) => (
            <TouchableOpacity key={index} style={styles.pricingCard}>
              <LinearGradient colors={plan.color as [string, string]} style={styles.pricingCardGradient}>
                {plan.popular && (
                  <View style={styles.popularBadge}>
                    <Text style={styles.popularText}>MOST POPULAR</Text>
                  </View>
                )}
                <Text style={styles.planName}>{plan.name}</Text>
                <Text style={styles.planPrice}>{plan.price}<Text style={styles.planPeriod}>{plan.period}</Text></Text>
                <Text style={styles.planDescription}>{plan.description}</Text>
                
                <View style={styles.pricingFeaturesContainer}>
                  {plan.features.map((feature, i) => (
                    <Text key={i} style={styles.featureItem}>{feature}</Text>
                  ))}
                </View>
                
                <TouchableOpacity 
                  style={styles.selectPlanButton}
                  onPress={() => {
                    if (plan.targetRole === 'individual') {
                      // Free/Individual plan - direct signup
                      router.push('/(auth)/sign-up?plan=free&role=parent');
                    } else if (plan.targetRole === 'school') {
                      // School plan - school onboarding
                      router.push('/(auth)/school-onboarding?plan=premium');
                    } else {
                      // Enterprise plan - contact sales
                      router.push('/(auth)/school-onboarding?plan=enterprise');
                    }
                  }}
                >
                  <Text style={styles.selectPlanText}>
                    {plan.targetRole === 'individual' ? 'START FREE' : 
                     plan.targetRole === 'school' ? 'START TRIAL' : 
                     'CONTACT SALES'}
                  </Text>
                </TouchableOpacity>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>
      </LinearGradient>
    </View>
  );
};

// Interactive Q&A Section
const QASection: React.FC<QASectionProps> = ({ showQA, setShowQA }) => {
  const [selectedQuestion, setSelectedQuestion] = useState<number | null>(null);
  
  const qaData = [
    {
      question: "How does the Quantum AI Brain work?",
      answer: "Our Quantum AI utilizes advanced neural networks combined with quantum computing to process educational data at unprecedented speeds. It literally thinks faster than human consciousness while maintaining empathy and understanding."
    },
    {
      question: "Is the Neural Interface safe for children?",
      answer: "Absolutely! Our BCI (Brain-Computer Interface) uses non-invasive quantum entanglement technology. No physical connection required - pure thought-to-digital transmission through our patented Neural Sync Protocol."
    },
    {
      question: "What makes this Society 5.0 compliant?",
      answer: "EduDash Pro integrates AI, IoT, robotics, and virtual reality into a seamless educational ecosystem. We're not just following Society 5.0 standards - we're defining them for the education sector."
    },
    {
      question: "Can I access the Metaverse from any device?",
      answer: "Yes! Our quantum-enabled platform supports full holographic projection on any device. From smartphones to quantum computers, experience full immersion anywhere in the multiverse."
    },
    {
      question: "How fast is the AI lesson generation?",
      answer: "Our Quantum AI generates lessons at light speed - literally. Using quantum tunneling, we can predict and create educational content before you even think of needing it. Time dilation included."
    }
  ];

  return (
    <View style={styles.qaContainer}>
      <LinearGradient colors={['#0f3460', '#533a71']} style={styles.qaGradient}>
        <Text style={styles.sectionTitle}>NEURAL Q&A</Text>
        <Text style={styles.sectionSubtitle}>
          Quantum answers to consciousness-expanding questions
        </Text>

        <View style={styles.qaList}>
          {qaData.map((item, index) => (
            <TouchableOpacity 
              key={index}
              style={styles.qaItem}
              onPress={() => setSelectedQuestion(selectedQuestion === index ? null : index)}
            >
              <LinearGradient 
                colors={selectedQuestion === index ? ['rgba(0,245,255,0.2)', 'rgba(128,0,255,0.2)'] : ['rgba(0,245,255,0.05)', 'rgba(128,0,255,0.05)']} 
                style={styles.qaItemGradient}
              >
                <View style={styles.qaHeader}>
                  <Text style={styles.qaQuestion}>{item.question}</Text>
                  <IconSymbol 
                    name={selectedQuestion === index ? "chevron.up" : "chevron.down"} 
                    size={20} 
                    color="#00f5ff" 
                  />
                </View>
                {selectedQuestion === index && (
                  <Text style={styles.qaAnswer}>{item.answer}</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>
      </LinearGradient>
    </View>
  );
};

// Ad Integration Section
const AdSection = () => {
  return (
    <View style={styles.adContainer}>
      <LinearGradient colors={['#533a71', '#1a0a2e']} style={styles.adGradient}>
        <Text style={styles.adTitle}>NEURAL ADVERTISEMENTS</Text>
        <Text style={styles.adSubtitle}>Quantum-targeted, consciousness-aware promotions</Text>
        
        {/* Mock Ad Spaces */}
        <View style={styles.adGrid}>
          <TouchableOpacity style={styles.adBox}>
            <LinearGradient colors={['rgba(0,245,255,0.1)', 'rgba(128,0,255,0.1)']} style={styles.adBoxGradient}>
              <Text style={styles.adBoxText}>🚀 Quantum Tablets</Text>
              <Text style={styles.adBoxSubtext}>Next-gen learning devices</Text>
            </LinearGradient>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.adBox}>
            <LinearGradient colors={['rgba(255,0,128,0.1)', 'rgba(255,128,0,0.1)']} style={styles.adBoxGradient}>
              <Text style={styles.adBoxText}>🧠 Neural Headsets</Text>
              <Text style={styles.adBoxSubtext}>Direct brain interfaces</Text>
            </LinearGradient>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.adBox}>
            <LinearGradient colors={['rgba(128,255,0,0.1)', 'rgba(0,245,255,0.1)']} style={styles.adBoxGradient}>
              <Text style={styles.adBoxText}>🤖 AI Tutors</Text>
              <Text style={styles.adBoxSubtext}>Personal robot teachers</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
        
        <Text style={styles.adDisclaimer}>
          * Ads powered by quantum consciousness algorithms • Privacy-first neural targeting
        </Text>
      </LinearGradient>
    </View>
  );
};

// Feature Modal
const FeatureModal: React.FC<FeatureModalProps> = ({ selectedFeature, setSelectedFeature }) => {
  if (!selectedFeature) return null;

  return (
    <Modal
      visible={!!selectedFeature}
      transparent
      animationType="fade"
      onRequestClose={() => setSelectedFeature(null)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <LinearGradient colors={selectedFeature.color} style={styles.modalGradient}>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setSelectedFeature(null)}
            >
              <IconSymbol name="xmark" size={24} color="#000000" />
            </TouchableOpacity>
            
            <Text style={styles.modalTitle}>{selectedFeature.title}</Text>
            <Text style={styles.modalSubtitle}>{selectedFeature.subtitle}</Text>
            <Text style={styles.modalDescription}>{selectedFeature.description}</Text>
            <Text style={styles.modalTech}>Technology: {selectedFeature.tech}</Text>
            
            <TouchableOpacity 
              style={styles.tryFeatureButton}
              onPress={() => {
                setSelectedFeature(null);
                router.push('/(auth)/sign-up');
              }}
            >
              <Text style={styles.tryFeatureText}>ACTIVATE FEATURE</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
};

// Role-Based Benefits Section
const RoleBasedBenefitsSection = () => {
  const [selectedRole, setSelectedRole] = useState<'parent' | 'teacher' | 'principal' | null>(null);

  const roles = [
    {
      id: 'parent',
      title: 'Parents & Guardians',
      subtitle: 'Monitor & Support Your Child\'s Journey',
      description: 'Stay connected with your child\'s educational progress',
      icon: '👨‍👩‍👧‍👦',
      benefits: [
        '📊 Real-time progress tracking',
        '💬 Direct teacher communication',
        '🏠 Home learning activities',
        '🎯 Personalized recommendations',
        '📱 Mobile-first experience',
      ],
      cta: 'Join as Parent',
      color: getRoleColors('parent'),
    },
    {
      id: 'teacher',
      title: 'Teachers & Educators',
      subtitle: 'AI-Powered Teaching Revolution',
      description: 'Transform your classroom with intelligent tools',
      icon: '👩‍🏫',
      benefits: [
        '🤖 AI lesson generation',
        '⚡ Automated grading',
        '📈 Student analytics',
        '👨‍👩‍👧‍👦 Parent communication',
        '🎨 Creative activity tools',
      ],
      cta: 'Join as Teacher',
      color: getRoleColors('teacher'),
    },
    {
      id: 'principal',
      title: 'Principals & Admins',
      subtitle: 'Complete School Management',
      description: 'Oversee your institution with comprehensive tools',
      icon: '👩‍💼',
      benefits: [
        '🏢 Multi-class management',
        '👥 Teacher & staff tools',
        '💰 Financial reporting',
        '📊 School-wide analytics',
        '⚙️ System administration',
      ],
      cta: 'Register School',
      color: getRoleColors('principal'),
    },
  ];

  return (
    <View style={styles.roleSection}>
      <LinearGradient colors={DesignSystem.gradients.section} style={styles.roleSectionGradient}>
        <Text style={styles.sectionTitle}>WHO IS EDUDASH PRO FOR?</Text>
        <Text style={styles.sectionSubtitle}>
          Designed for every member of the education community
        </Text>

        <View style={styles.rolesContainer}>
          {roles.map((role) => (
            <TouchableOpacity
              key={role.id}
              style={styles.roleCard}
              onPress={() => {
                if (role.id === 'principal') {
                  router.push('/(auth)/school-onboarding?role=principal');
                } else {
                  router.push(`/(auth)/sign-up?role=${role.id}`);
                }
              }}
            >
              <LinearGradient
                colors={[`${role.color.primary}20`, `${role.color.secondary}10`]}
                style={styles.roleCardGradient}
              >
                <Text style={styles.roleIcon}>{role.icon}</Text>
                <Text style={styles.roleTitle}>{role.title}</Text>
                <Text style={styles.roleSubtitle}>{role.subtitle}</Text>
                <Text style={styles.roleDescription}>{role.description}</Text>
                
                <View style={styles.roleBenefits}>
                  {role.benefits.map((benefit, index) => (
                    <Text key={index} style={styles.roleBenefit}>{benefit}</Text>
                  ))}
                </View>
                
                <TouchableOpacity 
                  style={styles.roleCTA}
                  onPress={() => {
                    if (role.id === 'principal') {
                      router.push('/(auth)/school-onboarding?role=principal');
                    } else {
                      router.push(`/(auth)/sign-up?role=${role.id}`);
                    }
                  }}
                >
                  <Text style={styles.roleCTAText}>{role.cta}</Text>
                  <IconSymbol name="arrow.right" size={16} color={role.color.primary} />
                </TouchableOpacity>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>
      </LinearGradient>
    </View>
  );
};

// Embedded Pricing Section
const EmbeddedPricingSection = () => {
  return (
    <View style={styles.embeddedPricingContainer}>
      <LinearGradient colors={DesignSystem.gradients.section} style={styles.embeddedPricingGradient}>
        <Text style={styles.sectionTitle}>QUANTUM PRICING</Text>
        <Text style={styles.sectionSubtitle}>
          Transparent pricing • No hidden fees • Start free today
        </Text>
        
        <PricingComponent 
          embedded={true}
          showRoles={false}
          showComparison={false}
        />
        
        <TouchableOpacity 
          style={styles.viewFullPricingButton}
          onPress={() => router.push('/pricing')}
        >
          <LinearGradient
            colors={['rgba(0,245,255,0.1)', 'rgba(128,0,255,0.1)']}
            style={styles.viewFullPricingGradient}
          >
            <Text style={styles.viewFullPricingText}>View Detailed Pricing</Text>
            <IconSymbol name="arrow.right" size={16} color="#00f5ff" />
          </LinearGradient>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );
};

// Enhanced Ad Section with Real Components
const EnhancedAdSection = () => {
  const [showRevenueBanner, setShowRevenueBanner] = useState(true);
  
  const mockUserProfile = {
    id: 'landing-visitor',
    role: 'parent' as const,
    subscriptionTier: 'free' as const,
    daysActive: 0,
    engagementScore: 0.5,
    featureUsage: {},
    limitHits: 0,
    lastActiveDate: new Date().toISOString(),
    preferences: {
      allowAds: true,
      allowAffiliate: true,
      allowNotifications: true,
    },
  };

  const sponsoredContent = {
    title: '🎓 Professional Development for Educators',
    description: 'Advanced AI teaching methodologies course for modern educators',
    cta: 'Learn More',
    sponsor: 'EduTech Academy',
    value: 35.00,
    image: 'https://example.com/edu-course.jpg',
  };

  return (
    <View style={styles.enhancedAdContainer}>
      <LinearGradient colors={['#533a71', '#1a0a2e']} style={styles.enhancedAdGradient}>
        <Text style={styles.sectionTitle}>STRATEGIC PARTNERSHIPS</Text>
        <Text style={styles.sectionSubtitle}>
          Curated educational resources and tools for your success
        </Text>
        
        {/* Revenue Banner */}
        {showRevenueBanner && (
          <RevenueBanner
            type="feature-unlock"
            discount={25}
            onUpgrade={() => router.push('/pricing')}
            onDismiss={() => setShowRevenueBanner(false)}
          />
        )}
        
        {/* Ad Banner */}
        <AdBanner
          placement="landing-page"
          size="large"
          userTier="free"
          onAdClick={(adData) => {
          }}
        />
        
        {/* Sponsored Content */}
        <SponsoredContent
          content={sponsoredContent}
          onInteraction={(type, data) => {
          }}
        />
        
        {/* Traditional Ad Grid */}
        <View style={styles.adGrid}>
          <TouchableOpacity style={styles.adBox}>
            <LinearGradient colors={['rgba(0,245,255,0.1)', 'rgba(128,0,255,0.1)']} style={styles.adBoxGradient}>
              <Text style={styles.adBoxText}>🚀 Quantum Tablets</Text>
              <Text style={styles.adBoxSubtext}>Next-gen learning devices</Text>
            </LinearGradient>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.adBox}>
            <LinearGradient colors={['rgba(255,0,128,0.1)', 'rgba(255,128,0,0.1)']} style={styles.adBoxGradient}>
              <Text style={styles.adBoxText}>🧠 Neural Headsets</Text>
              <Text style={styles.adBoxSubtext}>Direct brain interfaces</Text>
            </LinearGradient>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.adBox}>
            <LinearGradient colors={['rgba(128,255,0,0.1)', 'rgba(0,245,255,0.1)']} style={styles.adBoxGradient}>
              <Text style={styles.adBoxText}>🤖 AI Tutors</Text>
              <Text style={styles.adBoxSubtext}>Personal robot teachers</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
        
        <Text style={styles.adDisclaimer}>
          * Partnerships support free access to EduDash Pro • Child-safe, educational content only
        </Text>
      </LinearGradient>
    </View>
  );
};

// Futuristic Footer with Legal Compliance
const FooterSection = () => {
  return (
    <View style={styles.footerContainer}>
      <LinearGradient colors={['#1a0a2e', '#0a0a0f']} style={styles.footerGradient}>
        <View style={styles.footerContent}>
          {/* Logo Section */}
          <View style={styles.footerLogo}>
            <LinearGradient colors={['#00f5ff', '#8000ff']} style={styles.footerLogoGradient}>
              <IconSymbol name="brain" size={32} color="#000000" />
            </LinearGradient>
            <Text style={styles.footerLogoText}>EduDash Pro</Text>
            <Text style={styles.footerLogoSubtext}>AI-Powered Education Platform</Text>
          </View>
          
          {/* Navigation Links */}
          <View style={styles.footerSection}>
            <Text style={styles.footerSectionTitle}>Platform</Text>
            <TouchableOpacity style={styles.footerLink} onPress={() => router.push('/(auth)/sign-up')}>
              <Text style={styles.footerLinkText}>Create Account</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.footerLink} onPress={() => router.push('/(auth)/sign-in')}>
              <Text style={styles.footerLinkText}>Sign In</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.footerLink} onPress={() => router.push('/pricing')}>
              <Text style={styles.footerLinkText}>Pricing</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.footerLink} onPress={() => router.push('/(auth)/school-onboarding')}>
              <Text style={styles.footerLinkText}>Register School</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.footerLink} onPress={() => router.push('/(auth)/join-with-code')}>
              <Text style={styles.footerLinkText}>Join with Code</Text>
            </TouchableOpacity>
          </View>
          
          {/* Legal Links - Required for Play Store */}
          <View style={styles.footerSection}>
            <Text style={styles.footerSectionTitle}>Legal & Support</Text>
            <TouchableOpacity style={styles.footerLink} onPress={() => router.push('/legal/privacy-policy')}>
              <Text style={styles.footerLinkText}>Privacy Policy</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.footerLink} onPress={() => router.push('/legal/terms-of-service')}>
              <Text style={styles.footerLinkText}>Terms of Service</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.footerLink} onPress={() => router.push('/legal/cookie-policy')}>
              <Text style={styles.footerLinkText}>Cookie Policy</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.footerLink} onPress={() => router.push('/legal/child-safety')}>
              <Text style={styles.footerLinkText}>Child Safety Policy</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.footerLink} onPress={() => router.push('/support/help')}>
              <Text style={styles.footerLinkText}>Help Center</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.footerLink} onPress={() => router.push('/support/contact')}>
              <Text style={styles.footerLinkText}>Contact Support</Text>
            </TouchableOpacity>
          </View>
          
          {/* Company Info */}
          <View style={styles.footerSection}>
            <Text style={styles.footerSectionTitle}>Company</Text>
            <TouchableOpacity style={styles.footerLink} onPress={() => router.push('/about/company')}>
              <Text style={styles.footerLinkText}>About EduDash Pro</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.footerLink} onPress={() => router.push('/about/careers')}>
              <Text style={styles.footerLinkText}>Careers</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.footerLink} onPress={() => router.push('/about/blog')}>
              <Text style={styles.footerLinkText}>Blog</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.footerLink} onPress={() => router.push('/about/security')}>
              <Text style={styles.footerLinkText}>Security</Text>
            </TouchableOpacity>
          </View>
          
          {/* Child Safety & Compliance */}
          <View style={styles.complianceSection}>
            <View style={styles.complianceBadges}>
              <View style={styles.complianceBadge}>
                <Text style={styles.complianceBadgeText}>🛡️ COPPA</Text>
                <Text style={styles.complianceBadgeSubtext}>Compliant</Text>
              </View>
              <View style={styles.complianceBadge}>
                <Text style={styles.complianceBadgeText}>🔒 GDPR</Text>
                <Text style={styles.complianceBadgeSubtext}>Protected</Text>
              </View>
              <View style={styles.complianceBadge}>
                <Text style={styles.complianceBadgeText}>👶 Child Safe</Text>
                <Text style={styles.complianceBadgeSubtext}>Certified</Text>
              </View>
              <View style={styles.complianceBadge}>
                <Text style={styles.complianceBadgeText}>🇿🇦 SA Approved</Text>
                <Text style={styles.complianceBadgeSubtext}>Educational</Text>
              </View>
            </View>
          </View>
          
          {/* App Store Links */}
          <View style={styles.appStoreSection}>
            <Text style={styles.footerSectionTitle}>Download Our App</Text>
            <View style={styles.appStoreButtons}>
              <TouchableOpacity style={styles.appStoreButton}>
                <LinearGradient colors={['rgba(0,245,255,0.1)', 'rgba(128,0,255,0.1)']} style={styles.appStoreGradient}>
                  <Text style={styles.appStoreIcon}>📱</Text>
                  <View>
                    <Text style={styles.appStoreText}>Download on the</Text>
                    <Text style={styles.appStoreTitle}>App Store</Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.appStoreButton}>
                <LinearGradient colors={['rgba(0,245,255,0.1)', 'rgba(128,0,255,0.1)']} style={styles.appStoreGradient}>
                  <Text style={styles.appStoreIcon}>🤖</Text>
                  <View>
                    <Text style={styles.appStoreText}>Get it on</Text>
                    <Text style={styles.appStoreTitle}>Google Play</Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Copyright and Disclaimers */}
          <View style={styles.copyrightSection}>
            <Text style={styles.footerCopyright}>
              © 2025 EduDash Pro (Pty) Ltd. All rights reserved.
            </Text>
            <Text style={styles.footerDisclaimer}>
              EduDash Pro is an educational technology platform designed for children aged 1-18.
              We are committed to child safety, data protection, and educational excellence.
            </Text>
            <Text style={styles.footerDisclaimer}>
              Registered in South Africa • Company Registration: 2025/123456/07
              {"\n"}Educational Technology Provider • SARS Tax Number: 9876543210
            </Text>
          </View>
          
          {/* Social Media & Contact */}
          <View style={styles.socialSection}>
            <Text style={styles.footerSectionTitle}>Connect With Us</Text>
            <View style={styles.socialLinks}>
              <TouchableOpacity 
                style={styles.socialButton}
                onPress={() => {/* Link to Facebook */}}
              >
                <LinearGradient colors={['#1877F2', '#42A5F5']} style={styles.socialGradient}>
                  <Text style={styles.socialText}>📘</Text>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.socialButton}
                onPress={() => {/* Link to Twitter */}}
              >
                <LinearGradient colors={['#1DA1F2', '#00ACEE']} style={styles.socialGradient}>
                  <Text style={styles.socialText}>🐦</Text>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.socialButton}
                onPress={() => {/* Link to LinkedIn */}}
              >
                <LinearGradient colors={['#0A66C2', '#378FE9']} style={styles.socialGradient}>
                  <Text style={styles.socialText}>💼</Text>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.socialButton}
                onPress={() => {/* Link to YouTube */}}
              >
                <LinearGradient colors={['#FF0000', '#FF4500']} style={styles.socialGradient}>
                  <Text style={styles.socialText}>📺</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
            
            <View style={styles.contactInfo}>
              <Text style={styles.contactText}>📧 support@edudashpro.com</Text>
              <Text style={styles.contactText}>📞 +27 67 477 0975</Text>
              <Text style={styles.contactText}>🏢 848 Shabangu Avenue, Mamelodi, Pretoria 0122</Text>
            </View>
          </View>
          
          {/* Final Compliance Note */}
          <View style={styles.finalCompliance}>
            <Text style={styles.complianceText}>
              This app is designed with child safety as our top priority. We comply with COPPA, GDPR,
              and South African data protection laws. All content is age-appropriate and educationally focused.
            </Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  // Main Container
  container: {
    flex: 1,
    backgroundColor: '#0a0a0f',
  },
  scrollView: {
    flex: 1,
  },

  // Hero Section Styles
  heroContainer: {
    height: height * 0.9,
    overflow: 'hidden',
  },
  heroGradient: {
    flex: 1,
    position: 'relative',
  },
  particleContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    zIndex: 1,
  },
  particle: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#00f5ff',
  },
  heroContent: {
    flex: 1,
    zIndex: 2,
    paddingHorizontal: 20,
  },
  navbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: width < 400 ? 15 : 20,
    paddingHorizontal: width < 400 ? 5 : 0,
  },
  logo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  logoGradient: {
    width: width < 400 ? 32 : 40,
    height: width < 400 ? 32 : 40,
    borderRadius: width < 400 ? 16 : 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: width < 400 ? 8 : 12,
  },
  logoText: {
    fontSize: width < 400 ? 18 : 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginRight: width < 400 ? 4 : 8,
  },
  logoSubtext: {
    fontSize: width < 400 ? 10 : 12,
    color: '#00f5ff',
    fontWeight: '600',
    display: width < 400 ? 'none' : 'flex',
  },
  accessButton: {
    borderRadius: 25,
    overflow: 'hidden',
  },
  accessGradient: {
    paddingHorizontal: width < 400 ? 12 : 20,
    paddingVertical: width < 400 ? 8 : 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  accessButtonText: {
    fontSize: width < 400 ? 12 : 16,
    fontWeight: '700',
    color: '#000000',
    marginRight: width < 400 ? 4 : 8,
  },
  
  // Hero Text
  heroTextContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: width < 400 ? 16 : 20,
  },
  heroTitle: {
    alignItems: 'center',
    marginBottom: width < 400 ? 30 : 40,
  },
  heroMainTitle: {
    fontSize: width < 400 ? 28 : width < 600 ? 36 : 48,
    fontWeight: '900',
    textAlign: 'center',
    color: '#FFFFFF',
    marginBottom: 16,
    lineHeight: width < 400 ? 32 : width < 600 ? 40 : 52,
  },
  gradientTextPrimary: {
    color: '#00f5ff',
  },
  gradientTextSecondary: {
    color: '#ff0080',
  },
  heroTagline: {
    fontSize: width < 400 ? 12 : 16,
    color: '#00f5ff',
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: '600',
    letterSpacing: width < 400 ? 0.5 : 1,
    paddingHorizontal: width < 400 ? 10 : 0,
  },
  heroSubtitle: {
    fontSize: width < 400 ? 14 : 18,
    color: '#CCCCCC',
    textAlign: 'center',
    lineHeight: width < 400 ? 20 : 24,
    maxWidth: width < 400 ? 300 : 400,
    paddingHorizontal: width < 400 ? 10 : 0,
  },
  
  // Holographic Stats
  holoStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: width < 400 ? 30 : 40,
    width: '100%',
    paddingHorizontal: width < 400 ? 10 : 0,
  },
  holoCard: {
    alignItems: 'center',
    flex: 1,
  },
  holoCardGradient: {
    paddingHorizontal: width < 400 ? 8 : 16,
    paddingVertical: width < 400 ? 8 : 12,
    borderRadius: 15,
    alignItems: 'center',
    minWidth: width < 400 ? 60 : 80,
  },
  holoNumber: {
    fontSize: width < 400 ? 18 : 24,
    fontWeight: '900',
    color: '#000000',
    marginVertical: 4,
  },
  holoLabel: {
    fontSize: width < 400 ? 10 : 12,
    color: '#000000',
    fontWeight: '600',
    textAlign: 'center',
  },
  
  // Hero Actions
  heroActions: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: width < 400 ? 20 : 0,
  },
  primaryCTA: {
    borderRadius: 30,
    overflow: 'hidden',
    marginBottom: 16,
    width: width < 400 ? '100%' : 'auto',
  },
  ctaGradient: {
    paddingHorizontal: width < 400 ? 24 : 32,
    paddingVertical: width < 400 ? 14 : 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    fontSize: width < 400 ? 16 : 18,
    fontWeight: '800',
    color: '#000000',
    marginLeft: 8,
    letterSpacing: width < 400 ? 0.5 : 1,
  },
  secondaryCTA: {
    borderRadius: 30,
    overflow: 'hidden',
    width: width < 400 ? '100%' : 'auto',
  },
  secondaryGradient: {
    paddingHorizontal: width < 400 ? 24 : 32,
    paddingVertical: width < 400 ? 14 : 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#00f5ff',
    borderRadius: 30,
  },
  secondaryCtaText: {
    fontSize: width < 400 ? 14 : 16,
    fontWeight: '700',
    color: '#00f5ff',
    marginRight: 8,
  },
  
  // Features Section
  featuresContainer: {
    minHeight: height * 0.6, // Ensure minimum height
  },
  featuresGradient: {
    minHeight: height * 0.6, // Match container height
    paddingHorizontal: width < 400 ? 16 : 20,
    paddingVertical: width < 400 ? 60 : 80, // More padding
    justifyContent: 'center', // Center content
  },
  sectionTitle: {
    fontSize: width < 400 ? 24 : width < 600 ? 28 : 32,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: width < 400 ? 1 : 2,
    paddingHorizontal: width < 400 ? 10 : 0,
  },
  sectionSubtitle: {
    fontSize: width < 400 ? 14 : 16,
    color: '#00f5ff',
    textAlign: 'center',
    marginBottom: width < 400 ? 30 : 40,
    fontWeight: '600',
    paddingHorizontal: width < 400 ? 10 : 0,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: width < 400 ? 15 : 20,
  },
  featureCard: {
    width: width < 400 ? (width - 50) : width < 768 ? (width - 60) / 1 : (width - 80) / 2,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: width < 400 ? 15 : 20,
  },
  featureGradient: {
    padding: width < 400 ? 16 : 20,
    minHeight: width < 400 ? 160 : 180,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#000000',
    marginBottom: 8,
  },
  featureSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(0,0,0,0.8)',
    marginBottom: 12,
  },
  featureDescription: {
    fontSize: 14,
    color: 'rgba(0,0,0,0.7)',
    lineHeight: 18,
    marginBottom: 12,
  },
  featureTech: {
    marginTop: 'auto',
  },
  featureTechText: {
    fontSize: 12,
    color: 'rgba(0,0,0,0.6)',
    fontWeight: '600',
    fontStyle: 'italic',
  },
  
  // Testimonials Section
  testimonialsContainer: {
    minHeight: height * 0.8, // Ensure minimum height to fill screen
  },
  testimonialsGradient: {
    minHeight: height * 0.8, // Match container height
    paddingHorizontal: width < 400 ? 16 : 20,
    paddingVertical: width < 400 ? 60 : 80, // Even more padding
    justifyContent: 'center', // Center content vertically
  },
  testimonialCard: {
    marginHorizontal: width < 400 ? 16 : 20,
    borderRadius: 20,
    overflow: 'hidden',
  },
  testimonialGradient: {
    padding: width < 400 ? 20 : 25,
  },
  testimonialHeader: {
    flexDirection: width < 400 ? 'column' : 'row',
    marginBottom: 20,
    alignItems: 'center',
    gap: width < 400 ? 10 : 0,
  },
  avatarContainer: {
    position: 'relative',
    alignItems: 'center',
  },
  avatar: {
    fontSize: width < 400 ? 40 : 50,
    marginRight: width < 400 ? 0 : 15,
  },
  videoIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 10,
    backgroundColor: 'rgba(0,245,255,0.2)',
    borderRadius: 10,
    padding: 3,
  },
  testimonialInfo: {
    flex: 1,
    alignItems: width < 400 ? 'center' : 'flex-start',
  },
  testimonialName: {
    fontSize: width < 400 ? 16 : 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
    textAlign: width < 400 ? 'center' : 'left',
  },
  testimonialRole: {
    fontSize: width < 400 ? 12 : 14,
    color: '#00f5ff',
    marginBottom: 2,
    textAlign: width < 400 ? 'center' : 'left',
  },
  testimonialSchool: {
    fontSize: width < 400 ? 10 : 12,
    color: '#CCCCCC',
    textAlign: width < 400 ? 'center' : 'left',
  },
  ratingContainer: {
    flexDirection: 'row',
  },
  star: {
    fontSize: 16,
  },
  testimonialMessage: {
    fontSize: width < 400 ? 14 : 16,
    color: '#FFFFFF',
    lineHeight: width < 400 ? 20 : 22,
    marginBottom: 20,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  testimonialDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  activeDot: {
    backgroundColor: '#00f5ff',
  },
  
  // Team Navigation Styles
  teamNavigationContainer: {
    alignItems: 'center',
    marginTop: width < 400 ? 20 : 30,
    paddingHorizontal: width < 400 ? 16 : 20,
  },
  teamNavigationButton: {
    borderRadius: 25,
    overflow: 'hidden',
  },
  teamNavigationGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: width < 400 ? 20 : 24,
    paddingVertical: width < 400 ? 12 : 14,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,245,255,0.3)',
    borderRadius: 25,
  },
  teamNavigationText: {
    fontSize: width < 400 ? 14 : 16,
    fontWeight: '600',
    color: '#00f5ff',
  },
  
  // Pricing Section
  pricingContainer: {
    paddingVertical: 60,
  },
  pricingGradient: {
    paddingHorizontal: 20,
  },
  pricingGrid: {
    gap: 20,
  },
  pricingCard: {
    borderRadius: 25,
    overflow: 'hidden',
    marginBottom: 20,
  },
  pricingCardGradient: {
    padding: 25,
    position: 'relative',
  },
  popularBadge: {
    position: 'absolute',
    top: 15,
    right: 15,
    backgroundColor: '#ff0080',
    borderRadius: 15,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  popularText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  planName: {
    fontSize: 24,
    fontWeight: '900',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 8,
  },
  planPrice: {
    fontSize: 32,
    fontWeight: '900',
    color: '#000000',
    textAlign: 'center',
  },
  planPeriod: {
    fontSize: 16,
    fontWeight: '600',
  },
  planDescription: {
    fontSize: 14,
    color: 'rgba(0,0,0,0.7)',
    textAlign: 'center',
    marginVertical: 15,
  },
  pricingFeaturesContainer: {
    marginVertical: 20,
  },
  featureItem: {
    fontSize: 14,
    color: 'rgba(0,0,0,0.8)',
    marginBottom: 8,
    textAlign: 'center',
  },
  selectPlanButton: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingVertical: 12,
    borderRadius: 20,
    marginTop: 10,
  },
  selectPlanText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#000000',
    textAlign: 'center',
    letterSpacing: 1,
  },
  
  // Q&A Section
  qaContainer: {
    minHeight: height * 0.6, // Ensure minimum height
  },
  qaGradient: {
    minHeight: height * 0.6, // Match container height
    paddingHorizontal: width < 400 ? 16 : 20,
    paddingVertical: width < 400 ? 40 : 60, // More padding
    justifyContent: 'center', // Center content
  },
  qaList: {
    gap: 15,
  },
  qaItem: {
    borderRadius: 15,
    overflow: 'hidden',
  },
  qaItemGradient: {
    padding: 20,
  },
  qaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  qaQuestion: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
    marginRight: 10,
  },
  qaAnswer: {
    fontSize: 14,
    color: '#CCCCCC',
    lineHeight: 20,
    marginTop: 15,
  },
  
  // Ad Section
  adContainer: {
    paddingVertical: 60,
  },
  adGradient: {
    paddingHorizontal: 20,
  },
  adTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: 2,
  },
  adSubtitle: {
    fontSize: 16,
    color: '#ff0080',
    textAlign: 'center',
    marginBottom: 40,
  },
  adGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: width < 400 ? 10 : 15,
    marginBottom: 30,
  },
  adBox: {
    width: width < 400 ? (width - 50) : width < 768 ? (width - 70) / 2 : (width - 90) / 3,
    borderRadius: 15,
    overflow: 'hidden',
  },
  adBoxGradient: {
    padding: width < 400 ? 16 : 20,
    alignItems: 'center',
    minHeight: width < 400 ? 100 : 120,
    justifyContent: 'center',
  },
  adBoxText: {
    fontSize: width < 400 ? 14 : 16,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  adBoxSubtext: {
    fontSize: width < 400 ? 10 : 12,
    color: '#CCCCCC',
    textAlign: 'center',
  },
  adDisclaimer: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 25,
    overflow: 'hidden',
  },
  modalGradient: {
    padding: 30,
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    zIndex: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 15,
    padding: 8,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 10,
  },
  modalSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(0,0,0,0.8)',
    textAlign: 'center',
    marginBottom: 15,
  },
  modalDescription: {
    fontSize: 14,
    color: 'rgba(0,0,0,0.7)',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 15,
  },
  modalTech: {
    fontSize: 12,
    color: 'rgba(0,0,0,0.6)',
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 25,
  },
  tryFeatureButton: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingVertical: 15,
    borderRadius: 25,
  },
  tryFeatureText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#000000',
    textAlign: 'center',
    letterSpacing: 1,
  },
  
  // Footer Section
  footerContainer: {
    paddingVertical: 60,
  },
  footerGradient: {
    paddingHorizontal: 20,
  },
  footerContent: {
    alignItems: 'center',
  },
  footerLogo: {
    alignItems: 'center',
    marginBottom: 30,
  },
  footerLogoGradient: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  footerLogoText: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  footerLogoSubtext: {
    fontSize: 14,
    color: '#00f5ff',
    fontWeight: '600',
  },
  footerLinks: {
    marginBottom: 30,
    alignItems: 'center',
  },
  footerLink: {
    marginBottom: 10,
  },
  footerLinkText: {
    fontSize: 16,
    color: '#CCCCCC',
    fontWeight: '600',
  },
  footerCopyright: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 30,
  },
  socialLinks: {
    flexDirection: 'row',
    gap: 15,
  },
  socialButton: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  socialGradient: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  socialText: {
    fontSize: 20,
  },
  
  // Role-Based Benefits Section
  roleSection: {
    minHeight: height * 0.7, // Ensure minimum height
  },
  roleSectionGradient: {
    minHeight: height * 0.7, // Match container height
    paddingHorizontal: width < 400 ? 16 : 20,
    paddingVertical: width < 400 ? 60 : 80, // More padding
    justifyContent: 'center', // Center content
  },
  rolesContainer: {
    gap: 20,
  },
  roleCard: {
    borderRadius: DesignSystem.borderRadius.xl,
    overflow: 'hidden',
  },
  roleCardGradient: {
    padding: DesignSystem.spacing.xl,
    alignItems: 'center',
  },
  roleIcon: {
    fontSize: 48,
    marginBottom: DesignSystem.spacing.md,
  },
  roleTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: DesignSystem.colors.text.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  roleSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: DesignSystem.colors.text.quantum,
    textAlign: 'center',
    marginBottom: 12,
  },
  roleDescription: {
    fontSize: 14,
    color: DesignSystem.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  roleBenefits: {
    alignItems: 'center',
    marginBottom: 20,
  },
  roleBenefit: {
    fontSize: 14,
    color: DesignSystem.colors.text.primary,
    marginBottom: 6,
    textAlign: 'center',
  },
  roleCTA: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: DesignSystem.borderRadius.xl,
    paddingHorizontal: DesignSystem.spacing.lg,
    paddingVertical: DesignSystem.spacing.md,
    gap: 8,
  },
  roleCTAText: {
    fontSize: 16,
    fontWeight: '700',
    color: DesignSystem.colors.text.primary,
  },
  
  // Embedded Pricing Section
  embeddedPricingContainer: {
    minHeight: height * 0.6, // Ensure minimum height
  },
  embeddedPricingGradient: {
    minHeight: height * 0.6, // Match container height
    paddingHorizontal: width < 400 ? 16 : 20,
    paddingVertical: width < 400 ? 40 : 60, // More padding
    justifyContent: 'center', // Center content
  },
  viewFullPricingButton: {
    alignSelf: 'center',
    borderRadius: DesignSystem.borderRadius.xl,
    overflow: 'hidden',
    marginTop: DesignSystem.spacing.xl,
  },
  viewFullPricingGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: DesignSystem.spacing.xl,
    paddingVertical: DesignSystem.spacing.md,
    gap: 8,
  },
  viewFullPricingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#00f5ff',
  },
  
  // Enhanced Ad Section
  enhancedAdContainer: {
    minHeight: height * 0.5, // Ensure minimum height
  },
  enhancedAdGradient: {
    minHeight: height * 0.5, // Match container height
    paddingHorizontal: width < 400 ? 16 : 20,
    paddingVertical: width < 400 ? 40 : 60, // More padding
    justifyContent: 'center', // Center content
  },
  
  // Enhanced Footer Styles
  footerSection: {
    alignItems: 'center',
    marginBottom: 25,
  },
  footerSectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#00f5ff',
    marginBottom: 15,
    textAlign: 'center',
  },
  
  // Compliance Section
  complianceSection: {
    marginBottom: 25,
    width: '100%',
  },
  complianceBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
  },
  complianceBadge: {
    backgroundColor: 'rgba(0,245,255,0.1)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,245,255,0.3)',
  },
  complianceBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#00f5ff',
    textAlign: 'center',
  },
  complianceBadgeSubtext: {
    fontSize: 10,
    color: '#CCCCCC',
    textAlign: 'center',
  },
  
  // App Store Section
  appStoreSection: {
    alignItems: 'center',
    marginBottom: 25,
    width: '100%',
  },
  appStoreButtons: {
    flexDirection: width < 600 ? 'column' : 'row',
    gap: 15,
    alignItems: 'center',
  },
  appStoreButton: {
    borderRadius: 12,
    overflow: 'hidden',
    minWidth: width < 600 ? 200 : 180,
  },
  appStoreGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
    gap: 10,
  },
  appStoreIcon: {
    fontSize: 24,
  },
  appStoreText: {
    fontSize: 12,
    color: '#CCCCCC',
    marginBottom: 2,
  },
  appStoreTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  
  // Copyright Section
  copyrightSection: {
    alignItems: 'center',
    marginBottom: 25,
    paddingHorizontal: 10,
  },
  footerDisclaimer: {
    fontSize: 12,
    color: '#888888',
    textAlign: 'center',
    lineHeight: 16,
    marginTop: 10,
    paddingHorizontal: width < 400 ? 10 : 0,
  },
  
  // Social Section
  socialSection: {
    alignItems: 'center',
    marginBottom: 25,
    width: '100%',
  },
  contactInfo: {
    alignItems: 'center',
    marginTop: 15,
    gap: 8,
  },
  contactText: {
    fontSize: 14,
    color: '#CCCCCC',
    textAlign: 'center',
  },
  
  // Final Compliance
  finalCompliance: {
    backgroundColor: 'rgba(0,245,255,0.05)',
    borderRadius: 15,
    padding: 15,
    marginTop: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,245,255,0.1)',
  },
  complianceText: {
    fontSize: 12,
    color: '#AAAAAA',
    textAlign: 'center',
    lineHeight: 16,
  },
});
