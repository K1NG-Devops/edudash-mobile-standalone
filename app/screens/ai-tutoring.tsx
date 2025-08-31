import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/SimpleWorkingAuth';
import { useSubscription } from '@/lib/hooks/useSubscription';
import { ParentAIAssistant } from '@/components/ai/ParentAIAssistant';
import { UsageTrackingService } from '@/lib/services/usageTrackingService';
import { supabase } from '@/lib/supabase';

const { width: screenWidth } = Dimensions.get('window');

interface Child {
  id: string;
  first_name: string;
  last_name: string;
  age: number;
  class_name: string;
}

export default function AITutoringScreen() {
  const { colorScheme } = useTheme();
  const { user, profile } = useAuth();
  const palette = Colors[colorScheme];
  const { subscription, isSubscriptionActive } = useSubscription();
  
  const [loading, setLoading] = useState(true);
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [canUseTutoring, setCanUseTutoring] = useState(false);
  const [usageStats, setUsageStats] = useState<any>(null);

  const isActive = isSubscriptionActive();
  const isFreeTier = !subscription || subscription.plan?.tier === 'free';

  useEffect(() => {
    if (user?.id) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);

      // Get parent's children
      const { data: parentProfile, error: parentError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', user.id)
        .limit(1)
        .single();

      if (parentError || !parentProfile) {
        throw new Error('Parent profile not found');
      }

      // Fetch children
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select(`
          id,
          first_name,
          last_name,
          date_of_birth,
          classes (
            name
          )
        `)
        .eq('parent_id', parentProfile.id)
        .eq('is_active', true);

      if (studentsError) {
        throw studentsError;
      }

      const formattedChildren: Child[] = (studentsData || []).map((student: any) => {
        const birthDate = new Date(student.date_of_birth);
        const age = Math.floor((Date.now() - birthDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25));
        
        return {
          id: student.id,
          first_name: student.first_name,
          last_name: student.last_name,
          age,
          class_name: student.classes?.name || 'Not Assigned',
        };
      });

      setChildren(formattedChildren);
      if (formattedChildren.length > 0 && !selectedChildId) {
        setSelectedChildId(formattedChildren[0].id);
      }

      // Check usage permissions
      if (user.id) {
        const permission = await UsageTrackingService.canPerformAction(user.id, 'ai_tutoring');
        setCanUseTutoring(permission.allowed);
        
        // Get usage stats
        const stats = await UsageTrackingService.getUserUsageStats(user.id);
        setUsageStats(stats);
      }

    } catch (error) {
      console.error('Error fetching AI tutoring data:', error);
      Alert.alert('Error', 'Failed to load tutoring data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleStartTutoring = async () => {
    if (!user?.id) return;

    if (!canUseTutoring) {
      Alert.alert(
        'Usage Limit Reached',
        'You\'ve reached your AI tutoring limit for this month. Upgrade to get unlimited access.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Upgrade', onPress: () => router.push('/screens/subscription-management') }
        ]
      );
      return;
    }

    const selectedChild = children.find(c => c.id === selectedChildId);
    if (!selectedChild) {
      Alert.alert('Error', 'Please select a child to start AI tutoring.');
      return;
    }

    // Record usage
    try {
      await UsageTrackingService.recordUsage(user.id, 'ai_tutoring', 'ai_tutoring_session', 1);
    } catch (error) {
      console.warn('Could not record usage:', error);
    }

    setShowAIAssistant(true);
  };

  const handleUpgrade = () => {
    router.push('/screens/subscription-management');
  };

  const renderFeatureCard = (
    title: string,
    description: string,
    icon: string,
    color: string,
    available: boolean = true
  ) => (
    <View style={[styles.featureCard, { backgroundColor: palette.surface }]}>
      <View style={[styles.featureIcon, { backgroundColor: `${color}15` }]}>
        <IconSymbol name={icon} size={32} color={available ? color : '#9CA3AF'} />
        {!available && (
          <View style={styles.lockBadge}>
            <IconSymbol name="lock.fill" size={12} color="#F59E0B" />
          </View>
        )}
      </View>
      <Text style={[styles.featureTitle, { color: available ? palette.text : palette.textSecondary }]}>
        {title}
      </Text>
      <Text style={[styles.featureDescription, { color: palette.textSecondary }]}>
        {description}
      </Text>
      {!available && (
        <TouchableOpacity style={styles.upgradeButton} onPress={handleUpgrade}>
          <Text style={styles.upgradeButtonText}>Upgrade</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <IconSymbol name="chevron.left" size={24} color={palette.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: palette.text }]}>
            AI Tutoring
          </Text>
          <View style={{ width: 24 }} />
        </View>
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B5CF6" />
          <Text style={[styles.loadingText, { color: palette.textSecondary }]}>
            Loading AI tutoring...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const selectedChild = children.find(c => c.id === selectedChildId);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <IconSymbol name="chevron.left" size={24} color={palette.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: palette.text }]}>
          AI Tutoring
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <LinearGradient
          colors={['#8B5CF6', '#7C3AED']}
          style={styles.heroSection}
        >
          <View style={styles.heroContent}>
            <IconSymbol name="brain.head.profile" size={64} color="#FFFFFF" />
            <Text style={styles.heroTitle}>AI Personal Tutor</Text>
            <Text style={styles.heroSubtitle}>
              Get personalized help for your child's homework, learning questions, and educational activities
            </Text>
          </View>
        </LinearGradient>

        {/* Child Selector */}
        {children.length > 0 && (
          <View style={[styles.section, { backgroundColor: palette.surface }]}>
            <Text style={[styles.sectionTitle, { color: palette.text }]}>
              Select Child
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {children.map((child) => (
                <TouchableOpacity
                  key={child.id}
                  style={[
                    styles.childCard,
                    selectedChildId === child.id && styles.selectedChildCard
                  ]}
                  onPress={() => setSelectedChildId(child.id)}
                >
                  <View style={styles.childAvatar}>
                    <Text style={styles.childInitial}>
                      {child.first_name.charAt(0)}
                    </Text>
                  </View>
                  <Text style={[styles.childName, { color: palette.text }]}>
                    {child.first_name}
                  </Text>
                  <Text style={[styles.childDetails, { color: palette.textSecondary }]}>
                    Age {child.age} • {child.class_name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {children.length === 0 && (
          <View style={[styles.section, { backgroundColor: palette.surface }]}>
            <View style={styles.emptyState}>
              <IconSymbol name="person.crop.circle.dashed" size={64} color={palette.textSecondary} />
              <Text style={[styles.emptyStateTitle, { color: palette.text }]}>
                No Children Registered
              </Text>
              <Text style={[styles.emptyStateText, { color: palette.textSecondary }]}>
                Please register your child first to use AI tutoring
              </Text>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => router.push('/screens/add-child')}
              >
                <Text style={styles.primaryButtonText}>Add Child</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Usage Stats */}
        {usageStats && (
          <View style={[styles.section, { backgroundColor: palette.surface }]}>
            <Text style={[styles.sectionTitle, { color: palette.text }]}>
              This Month's Usage
            </Text>
            <View style={styles.usageCard}>
              <View style={styles.usageInfo}>
                <IconSymbol name="person.2.badge.gearshape" size={24} color="#EC4899" />
                <Text style={[styles.usageLabel, { color: palette.text }]}>
                  AI Tutoring Sessions
                </Text>
              </View>
              <Text style={[styles.usageValue, { color: palette.text }]}>
                {usageStats.ai_tutoring_sessions_today}
                {usageStats.quotas.ai_tutoring_sessions_per_month !== -1 && 
                  `/${usageStats.quotas.ai_tutoring_sessions_per_month}`
                }
              </Text>
            </View>
          </View>
        )}

        {/* Features */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: palette.text }]}>
            What AI Tutoring Can Help With
          </Text>
          <View style={styles.featuresGrid}>
            {renderFeatureCard(
              'Homework Help',
              'Get step-by-step guidance on assignments',
              'book.pages',
              '#3B82F6',
              true
            )}
            {renderFeatureCard(
              'Learning Activities',
              'Discover fun educational activities',
              'lightbulb',
              '#10B981',
              true
            )}
            {renderFeatureCard(
              'Development Questions',
              'Ask about your child\'s learning progress',
              'questionmark.circle',
              '#8B5CF6',
              true
            )}
            {renderFeatureCard(
              'Study Planning',
              'Create personalized study schedules',
              'calendar.badge.plus',
              '#F59E0B',
              !isFreeTier
            )}
          </View>
        </View>

        {/* Start Tutoring Button */}
        {children.length > 0 && selectedChild && (
          <View style={styles.actionSection}>
            <TouchableOpacity
              style={[
                styles.startButton,
                !canUseTutoring && styles.disabledButton
              ]}
              onPress={handleStartTutoring}
              disabled={!canUseTutoring}
            >
              <LinearGradient
                colors={canUseTutoring ? ['#8B5CF6', '#7C3AED'] : ['#9CA3AF', '#6B7280']}
                style={styles.startButtonGradient}
              >
                <IconSymbol name="brain.head.profile" size={24} color="#FFFFFF" />
                <Text style={styles.startButtonText}>
                  Start AI Tutoring with {selectedChild.first_name}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            {!canUseTutoring && (
              <Text style={[styles.limitText, { color: palette.textSecondary }]}>
                You've reached your AI tutoring limit for this month.
              </Text>
            )}
          </View>
        )}

        {/* Upgrade Card for Free Tier */}
        {isFreeTier && (
          <View style={[styles.upgradeCard, { backgroundColor: palette.surface }]}>
            <LinearGradient
              colors={['#F59E0B', '#D97706']}
              style={styles.upgradeGradient}
            >
              <IconSymbol name="crown.fill" size={32} color="#FFFFFF" />
              <Text style={styles.upgradeTitle}>Unlock Premium Tutoring</Text>
              <Text style={styles.upgradeDescription}>
                Get unlimited AI tutoring sessions, personalized study plans, and advanced learning features
              </Text>
              <TouchableOpacity style={styles.upgradeCardButton} onPress={handleUpgrade}>
                <Text style={styles.upgradeCardButtonText}>View Plans</Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        )}
      </ScrollView>

      {/* AI Assistant Modal */}
      {showAIAssistant && selectedChild && (
        <ParentAIAssistant
          childName={selectedChild.first_name}
          childAge={selectedChild.age}
          userId={user?.id || ''}
          onClose={() => setShowAIAssistant(false)}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  
  // Hero Section
  heroSection: {
    margin: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  heroContent: {
    padding: 32,
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 24,
  },

  // Sections
  section: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },

  // Child Selection
  childCard: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginRight: 12,
    minWidth: 120,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedChildCard: {
    borderColor: '#8B5CF6',
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
  },
  childAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  childInitial: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  childName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  childDetails: {
    fontSize: 12,
    textAlign: 'center',
  },

  // Usage Stats
  usageCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(236, 72, 153, 0.1)',
    borderRadius: 8,
  },
  usageInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  usageLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  usageValue: {
    fontSize: 18,
    fontWeight: '600',
  },

  // Features
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  featureCard: {
    width: (screenWidth - 64) / 2,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  featureIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    position: 'relative',
  },
  lockBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#F59E0B',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  featureDescription: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 12,
  },
  upgradeButton: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
  },
  upgradeButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Action Section
  actionSection: {
    padding: 20,
    alignItems: 'center',
  },
  startButton: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  disabledButton: {
    opacity: 0.6,
  },
  startButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 12,
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  limitText: {
    fontSize: 14,
    textAlign: 'center',
  },

  // Upgrade Card
  upgradeCard: {
    margin: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  upgradeGradient: {
    padding: 24,
    alignItems: 'center',
  },
  upgradeTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 12,
    marginBottom: 8,
  },
  upgradeDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  upgradeCardButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  upgradeCardButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    padding: 32,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  primaryButton: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
