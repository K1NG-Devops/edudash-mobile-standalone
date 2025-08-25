/* eslint-disable */
// @ts-nocheck
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
  Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';

import { IconSymbol } from '@/components/ui/IconSymbol';
import { MobileHeader } from '@/components/navigation/MobileHeader';
import { DashboardSubscriptionCard } from '@/components/dashboard/DashboardSubscriptionCard';
import SubscriptionAwareStatsCards from '@/components/dashboard/SubscriptionAwareStatsCards';
import { AdComponents } from '@/components/advertising/AdComponents';
import { StudentDataService, EnhancedStudent, ParentDashboardData } from '@/lib/services/studentDataService';
import { UsageTrackingService, UsageStats } from '@/lib/services/usageTrackingService';
import { useTheme } from '@/contexts/ThemeContext';
import { useSubscription } from '@/lib/hooks/useSubscription';
import { Colors } from '@/constants/Colors';

interface EnhancedSubscriptionParentDashboardProps {
  userId: string;
  userProfile: {
    name: string;
    role: string;
    avatar?: string | null;
  };
  tenantName?: string;
  onSignOut: () => Promise<void>;
}

const { width: screenWidth } = Dimensions.get('window');

const EnhancedSubscriptionParentDashboard: React.FC<EnhancedSubscriptionParentDashboardProps> = ({
  userId,
  userProfile,
  tenantName,
  onSignOut
}) => {
  const { colorScheme } = useTheme();
  const palette = Colors[colorScheme];
  const { subscription, isSubscriptionActive, refreshSubscription } = useSubscription();
  
  const [dashboardData, setDashboardData] = useState<ParentDashboardData | null>(null);
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [selectedChild, setSelectedChild] = useState<EnhancedStudent | null>(null);
  const [showChildSelector, setShowChildSelector] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isFreeTier = !subscription || subscription.plan?.tier === 'free';
  const subscriptionTier = subscription?.plan?.tier || 'free';

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch parent dashboard data and usage stats in parallel
      const [data, stats] = await Promise.all([
        StudentDataService.getParentDashboardData(userId),
        UsageTrackingService.getUserUsageStats(userId)
      ]);

      setDashboardData(data);
      setUsageStats(stats);

      if (data.children.length > 0) {
        if (!selectedChildId || !data.children.find(c => c.id === selectedChildId)) {
          setSelectedChildId(data.children[0].id);
          setSelectedChild(data.children[0]);
        } else {
          const child = data.children.find(c => c.id === selectedChildId);
          if (child) {
            setSelectedChild(child);
          }
        }
      } else {
        setSelectedChildId(null);
        setSelectedChild(null);
      }
    } catch (err) {
      console.error('Error fetching parent dashboard data:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchDashboardData();
  }, [userId]);

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchDashboardData(),
      refreshSubscription()
    ]);
  };

  // Handle child selection
  const handleSelectChild = async (childId: string) => {
    setSelectedChildId(childId);
    setShowChildSelector(false);

    if (dashboardData) {
      const child = dashboardData.children.find(c => c.id === childId);
      if (child) {
        setSelectedChild(child);
      }
    }
  };

  // Handle upgrade action
  const handleUpgrade = () => {
    router.push('/pricing');
  };

  // Handle AI feature usage
  const handleAIFeatureUsage = async (featureType: 'ai_lesson' | 'homework_grading' | 'ai_tutoring') => {
    const permission = await UsageTrackingService.canPerformAction(userId, featureType);
    
    if (!permission.allowed) {
      if (permission.upgradeRequired) {
        Alert.alert(
          'Upgrade Required',
          permission.reason + '\n\nUpgrade your subscription to access unlimited AI features.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Upgrade Now', onPress: handleUpgrade }
          ]
        );
      } else {
        Alert.alert('Limit Reached', permission.reason);
      }
      return false;
    }

    // Record the usage
    await UsageTrackingService.recordUsage(userId, featureType, featureType, 1);
    
    // Refresh usage stats
    const updatedStats = await UsageTrackingService.getUserUsageStats(userId);
    setUsageStats(updatedStats);
    
    return true;
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning!';
    if (hour < 17) return 'Good afternoon!';
    return 'Good evening!';
  };

  const timeAgo = (isoDate: string) => {
    const now = Date.now();
    const then = new Date(isoDate).getTime();
    const diff = Math.max(0, now - then);
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  // Navigation handlers
  const handleNavigate = (route: string) => {
    if (route.startsWith('/(tabs)')) {
      router.push(route as any);
    } else if (route.startsWith('/')) {
      const screenName = route.substring(1);
      router.push(`/screens/${screenName}` as any);
    }
  };

  const handleQuickAction = async (action: string) => {
    // Check if action requires AI features
    if (['ai-lessons', 'homework-ai', 'ai-tutoring'].includes(action)) {
      const featureType = action.replace('-', '_') as any;
      const canProceed = await handleAIFeatureUsage(featureType);
      if (!canProceed) return;
    }

    switch (action) {
      case 'home':
        router.push('/(tabs)/dashboard');
        break;
      case 'homework':
        router.push('/screens/homework' as any);
        break;
      case 'activities':
        router.push('/(tabs)/activities');
        break;
      case 'calendar':
        router.push('/(tabs)/lessons');
        break;
      case 'messages':
        router.push('/(tabs)/messages');
        break;
      case 'ai-lessons':
        router.push('/screens/ai-lessons' as any);
        break;
      case 'homework-ai':
        router.push('/screens/homework-ai' as any);
        break;
      case 'ai-tutoring':
        router.push('/screens/ai-tutoring' as any);
        break;
      default:
        break;
    }
  };

  // If loading initially, show loading indicator
  if (loading && !refreshing && !dashboardData) {
    return (
      <View style={[styles.container, { backgroundColor: palette.background }]}>
        <MobileHeader
          user={userProfile}
          schoolName={tenantName}
          onNotificationsPress={() => {}}
          onSignOut={onSignOut}
          onNavigate={handleNavigate}
          notificationCount={0}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B5CF6" />
          <Text style={[styles.loadingText, { color: palette.textSecondary }]}>
            Loading your dashboard...
          </Text>
        </View>
      </View>
    );
  }

  // If there's an error, show error message
  if (error && !loading && !refreshing) {
    return (
      <View style={[styles.container, { backgroundColor: palette.background }]}>
        <MobileHeader
          user={userProfile}
          schoolName={tenantName}
          onNotificationsPress={() => {}}
          onSignOut={onSignOut}
          onNavigate={handleNavigate}
          notificationCount={0}
        />
        <View style={styles.errorContainer}>
          <IconSymbol name="exclamationmark.triangle.fill" size={48} color="#EF4444" />
          <Text style={[styles.errorTitle, { color: palette.text }]}>Something went wrong</Text>
          <Text style={[styles.errorMessage, { color: palette.textSecondary }]}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchDashboardData}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      {/* Mobile Header */}
      <MobileHeader
        user={userProfile}
        schoolName={tenantName}
        onNotificationsPress={() => {}}
        onSignOut={onSignOut}
        onNavigate={handleNavigate}
        notificationCount={dashboardData?.recent_updates.length || 0}
      />

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header Text */}
        <View style={styles.headerTextSection}>
          <Text style={[styles.greeting, { color: palette.text }]}>{getGreeting()} 👋</Text>
          <Text style={[styles.subtitle, { color: palette.textSecondary }]}>
            {selectedChild 
              ? `Let's see how ${selectedChild.first_name} is doing today`
              : 'Welcome to your dashboard'}
          </Text>
          {tenantName && (
            <View style={styles.tenantInfo}>
              <Text style={[styles.tenantLabel, { color: palette.text }]}>🏫 {tenantName}</Text>
            </View>
          )}
        </View>

        {/* Subscription Management Card */}
        <DashboardSubscriptionCard
          userId={userId}
          showUsage={true}
          onUpgrade={handleUpgrade}
        />

        {/* Free Tier Ad Banner */}
        {isFreeTier && (
          <AdComponents.SafeBannerAd 
            style={styles.adBanner}
            adUnitId="ca-app-pub-3940256099942544/6300978111" // Test ID
          />
        )}

        {/* Child Selector Card */}
        {selectedChild ? (
          <TouchableOpacity 
            style={styles.childSelectorCard}
            onPress={() => setShowChildSelector(!showChildSelector)}
          >
            <LinearGradient
              colors={['#8B5CF6', '#A855F7', '#C084FC']}
              style={styles.childCard}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.childCardHeader}>
                <View style={styles.childInfo}>
                  <View style={styles.childNameRow}>
                    <Text style={styles.childName}>{selectedChild.full_name}</Text>
                    {dashboardData && dashboardData.children.length > 1 && (
                      <IconSymbol 
                        name="chevron.down" 
                        size={20} 
                        color="rgba(255, 255, 255, 0.8)" 
                      />
                    )}
                  </View>
                  <Text style={styles.childDetails}>
                    🎂 {selectedChild.age} years old
                  </Text>
                  <Text style={styles.childDetails}>
                    👩‍🏫 {selectedChild.teacher_name || 'No Teacher Assigned'}
                  </Text>
                </View>
                <View style={styles.childEmoji}>
                  <Text style={styles.emojiLarge}>👤</Text>
                </View>
              </View>
              
              <View style={styles.childCardFooter}>
                <View style={styles.childBadge}>
                  <Text style={styles.childBadgeText}>
                    {selectedChild.class_name || selectedChild.age_group_name || 'Unassigned'}
                  </Text>
                </View>
                <View style={styles.attendanceButton}>
                  <Text style={styles.attendanceText}>
                    Attendance: {selectedChild.attendance_percentage}%
                  </Text>
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <View style={styles.emptyStateCard}>
            <LinearGradient
              colors={['#F3F4F6', '#E5E7EB', '#D1D5DB']}
              style={styles.childCard}
            >
              <View style={styles.emptyStateContent}>
                {loading ? (
                  <>
                    <Text style={[styles.emptyStateTitle, { color: palette.text }]}>Loading...</Text>
                    <Text style={[styles.emptyStateText, { color: palette.textSecondary }]}>
                      Fetching your child's information
                    </Text>
                  </>
                ) : dashboardData && dashboardData.children.length === 0 ? (
                  <>
                    <Text style={[styles.emptyStateTitle, { color: palette.text }]}>No Children Found</Text>
                    <Text style={[styles.emptyStateText, { color: palette.textSecondary }]}>
                      You don't have any children registered
                    </Text>
                    <TouchableOpacity 
                      style={styles.registerButton}
                      onPress={() => router.push('/(tabs)/register')}
                    >
                      <Text style={styles.registerButtonText}>Register a Child</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <Text style={[styles.emptyStateTitle, { color: palette.text }]}>Welcome!</Text>
                    <Text style={[styles.emptyStateText, { color: palette.textSecondary }]}>
                      Setting up your dashboard...
                    </Text>
                  </>
                )}
              </View>
            </LinearGradient>
          </View>
        )}

        {/* Child Selector Dropdown */}
        {showChildSelector && dashboardData && dashboardData.children.length > 1 && (
          <View style={[styles.childDropdown, { backgroundColor: palette.surface }]}>
            {dashboardData.children.map((child) => (
              <TouchableOpacity
                key={child.id}
                style={[
                  styles.childDropdownItem,
                  { borderBottomColor: palette.outline },
                  child.id === selectedChildId && styles.childDropdownItemSelected
                ]}
                onPress={() => handleSelectChild(child.id)}
              >
                <View style={styles.childDropdownEmoji}>
                  <Text style={styles.childDropdownEmojiText}>👤</Text>
                </View>
                <View style={styles.childDropdownInfo}>
                  <Text style={[styles.childDropdownName, { color: palette.text }]}>
                    {child.full_name}
                  </Text>
                  <Text style={[styles.childDropdownDetails, { color: palette.textSecondary }]}>
                    {child.age} years • {child.class_name || child.age_group_name || 'Unassigned'} • {child.teacher_name || 'No Teacher'}
                  </Text>
                </View>
                {child.id === selectedChildId && (
                  <IconSymbol name="checkmark" size={16} color="#10B981" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Enhanced Stats Cards */}
        <SubscriptionAwareStatsCards
          userId={userId}
          childData={selectedChild ? {
            completed_activities: selectedChild.completed_activities || 0,
            pending_homework: selectedChild.pending_homework || 0,
            attendance_percentage: selectedChild.attendance_percentage || 0
          } : undefined}
          onUpgradePress={handleUpgrade}
        />

        {/* Enhanced Quick Actions with AI Features */}
        <View style={styles.quickActionsSection}>
          <Text style={[styles.sectionTitle, { color: palette.text }]}>🚀 Quick Actions</Text>
          
          <View style={styles.quickActions}>
            {/* Standard actions */}
            <TouchableOpacity 
              style={styles.quickAction}
              onPress={() => handleQuickAction('home')}
            >
              <View style={styles.quickActionIcon}>
                <IconSymbol name="house.fill" size={24} color="#6B7280" />
              </View>
              <Text style={[styles.quickActionLabel, { color: palette.textSecondary }]}>Home</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.quickAction}
              onPress={() => handleQuickAction('homework')}
            >
              <View style={styles.quickActionIcon}>
                <IconSymbol name="doc.text.fill" size={24} color="#6B7280" />
              </View>
              <Text style={[styles.quickActionLabel, { color: palette.textSecondary }]}>Homework</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.quickAction}
              onPress={() => handleQuickAction('activities')}
            >
              <View style={styles.quickActionIcon}>
                <IconSymbol name="location.fill" size={24} color="#6B7280" />
              </View>
              <Text style={[styles.quickActionLabel, { color: palette.textSecondary }]}>Activities</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.quickAction}
              onPress={() => handleQuickAction('messages')}
            >
              <View style={styles.quickActionIcon}>
                <IconSymbol name="message.fill" size={24} color="#6B7280" />
              </View>
              <Text style={[styles.quickActionLabel, { color: palette.textSecondary }]}>Messages</Text>
            </TouchableOpacity>

            {/* AI-powered actions */}
            <TouchableOpacity 
              style={[styles.quickAction, styles.aiAction]}
              onPress={() => handleQuickAction('ai-lessons')}
            >
              <View style={[styles.quickActionIcon, styles.aiActionIcon]}>
                <IconSymbol name="brain.head.profile" size={24} color="#FFFFFF" />
                {usageStats && !usageStats.can_use_ai_lessons && (
                  <View style={styles.lockBadge}>
                    <IconSymbol name="lock.fill" size={10} color="#EF4444" />
                  </View>
                )}
              </View>
              <Text style={[styles.quickActionLabel, { color: '#8B5CF6' }]}>AI Lessons</Text>
              {usageStats?.quotas.ai_lessons_per_day && (
                <Text style={styles.usageIndicator}>
                  {usageStats.ai_lessons_used_today}/{usageStats.quotas.ai_lessons_per_day}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.quickAction, styles.aiAction]}
              onPress={() => handleQuickAction('homework-ai')}
            >
              <View style={[styles.quickActionIcon, styles.aiActionIcon]}>
                <IconSymbol name="doc.text.below.ecg" size={24} color="#FFFFFF" />
                {usageStats && !usageStats.can_use_homework_grading && (
                  <View style={styles.lockBadge}>
                    <IconSymbol name="lock.fill" size={10} color="#EF4444" />
                  </View>
                )}
              </View>
              <Text style={[styles.quickActionLabel, { color: '#8B5CF6' }]}>AI Grading</Text>
              {usageStats?.quotas.homework_grading_per_day && (
                <Text style={styles.usageIndicator}>
                  {usageStats.homework_graded_today}/{usageStats.quotas.homework_grading_per_day}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Free Tier Interstitial Ad */}
        {isFreeTier && (
          <AdComponents.SafeInterstitialAd 
            adUnitId="ca-app-pub-3940256099942544/1033173712" // Test ID
          />
        )}

        {/* Recent Activity for selected child */}
        {selectedChild && dashboardData && dashboardData.recent_updates && (
          <View style={styles.activitySection}>
            <Text style={[styles.sectionTitle, { color: palette.text }]}>🕒 Recent Activity</Text>
            {dashboardData.recent_updates
              .filter((u) => !selectedChild || u.student_id === selectedChild.id)
              .slice(0, 5)
              .map((u) => (
                <View key={u.id} style={[styles.activityItemRow, { backgroundColor: palette.surface }]}>
                  <View style={styles.activityIconWrap}>
                    <IconSymbol
                      name={u.icon as any}
                      size={16}
                      color={u.type === 'homework' ? '#3B82F6' : u.type === 'activity' ? '#10B981' : '#8B5CF6'}
                    />
                  </View>
                  <View style={styles.activityContent}>
                    <Text style={[styles.activityTitleText, { color: palette.text }]}>{u.title}</Text>
                    <Text style={[styles.activityDescText, { color: palette.textSecondary }]}>{u.description}</Text>
                  </View>
                  <Text style={[styles.activityTimeText, { color: palette.textSecondary }]}>{timeAgo(u.timestamp)}</Text>
                </View>
              ))}
          </View>
        )}

        {/* Recent Achievements */}
        {selectedChild && selectedChild.recent_achievements && selectedChild.recent_achievements.length > 0 && (
          <View style={styles.achievementsSection}>
            <Text style={[styles.sectionTitle, { color: palette.text }]}>🏆 Recent Achievements</Text>
            <View style={styles.achievementsList}>
              {selectedChild.recent_achievements.map((achievement, index) => (
                <View key={index} style={styles.achievementBadge}>
                  <Text style={styles.achievementText}>{achievement}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Upcoming Events */}
        {dashboardData && dashboardData.upcoming_events.length > 0 && (
          <View style={styles.eventsSection}>
            <Text style={[styles.sectionTitle, { color: palette.text }]}>📅 Upcoming Events</Text>
            {dashboardData.upcoming_events.slice(0, 3).map((event) => (
              <TouchableOpacity key={event.id} style={[styles.eventItem, { backgroundColor: palette.surface }]}>
                <View style={styles.eventDate}>
                  <Text style={styles.eventDateText}>{event.date}</Text>
                  <Text style={[styles.eventTimeText, { color: palette.textSecondary }]}>{event.time}</Text>
                </View>
                <View style={styles.eventContent}>
                  <Text style={[styles.eventTitle, { color: palette.text }]}>{event.title}</Text>
                  {event.location && (
                    <Text style={[styles.eventLocation, { color: palette.textSecondary }]}>📍 {event.location}</Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Usage Summary for Free Users */}
        {isFreeTier && usageStats && (
          <View style={[styles.usageSummary, { backgroundColor: palette.surface }]}>
            <View style={styles.usageSummaryHeader}>
              <IconSymbol name="chart.bar.xaxis" size={20} color="#8B5CF6" />
              <Text style={[styles.usageSummaryTitle, { color: palette.text }]}>Today's Usage</Text>
            </View>
            <Text style={[styles.usageSummaryText, { color: palette.textSecondary }]}>
              You've used {usageStats.ai_lessons_used_today} of {usageStats.quotas.ai_lessons_per_day} AI lessons and {usageStats.homework_graded_today} of {usageStats.quotas.homework_grading_per_day} homework gradings today.
            </Text>
            <TouchableOpacity style={styles.upgradeNowButton} onPress={handleUpgrade}>
              <Text style={styles.upgradeNowText}>Upgrade for Unlimited Access</Text>
              <IconSymbol name="arrow.up.right" size={14} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        )}

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100, // Space for tab bar
  },
  headerTextSection: {
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 16,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 22,
  },
  tenantInfo: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  tenantLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E40AF',
  },

  // Ad banner
  adBanner: {
    marginHorizontal: 20,
    marginVertical: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },

  // Child selector
  childSelectorCard: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  childCard: {
    borderRadius: 20,
    padding: 24,
    minHeight: 160,
  },
  childCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  childInfo: {
    flex: 1,
  },
  childNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  childName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  childDetails: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 4,
  },
  childEmoji: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emojiLarge: {
    fontSize: 32,
  },
  childCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  childBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  childBadgeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  attendanceButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  attendanceText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },

  // Empty state
  emptyStateCard: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  emptyStateContent: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 160,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  registerButton: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  registerButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },

  // Child dropdown
  childDropdown: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  childDropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  childDropdownItemSelected: {
    backgroundColor: '#F0FDF4',
  },
  childDropdownEmoji: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  childDropdownEmojiText: {
    fontSize: 20,
  },
  childDropdownInfo: {
    flex: 1,
  },
  childDropdownName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  childDropdownDetails: {
    fontSize: 14,
  },

  // Enhanced quick actions
  quickActionsSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  quickAction: {
    alignItems: 'center',
    width: (screenWidth - 80) / 3, // 3 columns
  },
  aiAction: {
    width: (screenWidth - 60) / 2, // 2 columns for AI actions
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
  },
  aiActionIcon: {
    backgroundColor: '#8B5CF6',
  },
  lockBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActionLabel: {
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
    fontWeight: '500',
  },
  usageIndicator: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 2,
    textAlign: 'center',
  },

  // Activity section
  activitySection: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  activityItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  activityIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitleText: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  activityDescText: {
    fontSize: 12,
  },
  activityTimeText: {
    fontSize: 11,
    marginLeft: 8,
  },

  // Achievements
  achievementsSection: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  achievementsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  achievementBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  achievementText: {
    fontSize: 12,
    color: '#92400E',
    fontWeight: '500',
  },

  // Events
  eventsSection: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  eventItem: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  eventDate: {
    width: 80,
    alignItems: 'center',
    marginRight: 12,
  },
  eventDateText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3B82F6',
    marginBottom: 2,
  },
  eventTimeText: {
    fontSize: 11,
  },
  eventContent: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  eventLocation: {
    fontSize: 12,
  },

  // Usage summary
  usageSummary: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  usageSummaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  usageSummaryTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  usageSummaryText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  upgradeNowButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8B5CF6',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  upgradeNowText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },

  // Loading and error states
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingText: {
    fontSize: 16,
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },

  bottomSpacing: {
    height: 20,
  },
});

export default EnhancedSubscriptionParentDashboard;
