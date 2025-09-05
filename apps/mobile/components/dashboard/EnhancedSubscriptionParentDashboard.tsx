 
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
  Alert,
  Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import ProofOfPaymentUpload, { ProofOfPaymentData } from '@/components/payments/ProofOfPaymentUpload';
import { PaymentService } from '@/lib/services/paymentService';

import { IconSymbol } from '@/components/ui/IconSymbol';
import { MobileHeader } from '@/components/navigation/MobileHeader';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DashboardSubscriptionCard } from '@/components/dashboard/DashboardSubscriptionCard';
import SubscriptionAwareStatsCards from '@/components/dashboard/SubscriptionAwareStatsCards';
import { AdComponents } from '@/components/advertising/AdComponents';
import { StudentDataService, EnhancedStudent, ParentDashboardData } from '@/lib/services/studentDataService';
import { UsageTrackingService, UsageStats } from '@/lib/services/usageTrackingService';
import { useTheme } from '@/contexts/ThemeContext';
import { useSubscription } from '@/lib/hooks/useSubscription';
import { Colors } from '@/constants/Colors';
import { supabase } from '@/lib/supabase';
import { PageHeader, EmptyState, Button } from '@/design-system';

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

import i18n, { useT } from '@/i18n';

const { width: screenWidth } = Dimensions.get('window');
const isSmallScreen = screenWidth < 375;
const isVerySmallScreen = screenWidth < 320;

const EnhancedSubscriptionParentDashboard: React.FC<EnhancedSubscriptionParentDashboardProps> = ({
  userId,
  userProfile,
  tenantName,
  onSignOut
}) => {
  const { colorScheme } = useTheme();
  const { t } = useT();
  const palette = Colors[colorScheme];
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();
  const { subscription, isSubscriptionActive, refreshSubscription } = useSubscription();
  
  const [dashboardData, setDashboardData] = useState<ParentDashboardData | null>(null);
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [selectedChild, setSelectedChild] = useState<EnhancedStudent | null>(null);
  const [showChildSelector, setShowChildSelector] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPopModal, setShowPopModal] = useState(false);
  const [contacts, setContacts] = useState<any[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [profileComplete, setProfileComplete] = useState(false);

  const isFreeTier = !subscription || subscription.plan?.tier === 'free';
  const subscriptionTier = subscription?.plan?.tier || 'free';

  // Ads gating per WARP rules: only show when explicitly enabled
  const enableAds = process.env.EXPO_PUBLIC_ENABLE_ADS === 'true';
  const isProd = (process.env.EXPO_PUBLIC_ENVIRONMENT === 'production') || (process.env.NODE_ENV === 'production');

  // Load contacts for messaging
  const loadContacts = async () => {
    try {
      setLoadingContacts(true);
      
      // Use the same RPC as messaging center to get contacts
      const { data, error } = await supabase.rpc('get_messaging_contacts', {
        p_include_staff: true,
        p_include_parents: false, // Parents don't need to see other parents
        p_limit: 100,
      });
      
      if (error) {
        console.warn('Could not load contacts:', error);
        return;
      }
      
      const mapped = (data || []).map((row: any) => ({
        id: row.id,
        name: row.name || i18n.t('common.unknown'),
        role: row.role,
        avatar_url: row.avatar_url || undefined,
        email: row.email || undefined,
        class_name: row.class_name || undefined,
        is_online: false,
      }));
      
      setContacts(mapped);
    } catch (error) {
      console.warn('Error loading contacts:', error);
    } finally {
      setLoadingContacts(false);
    }
  };

  // Check profile completeness
  const checkProfileCompleteness = async () => {
    try {
      // Get parent's internal user profile
      const { data: parentProfile, error } = await supabase
        .from('users')
        .select('name, email, phone, street_address')
        .eq('auth_user_id', userId)
        .limit(1)
        .single();

      if (!error && parentProfile) {
        // Check if required profile fields are completed
        const requiredFields = ['name', 'email', 'phone', 'street_address'];
        const completedFields = requiredFields.filter(field => {
          const value = parentProfile[field as keyof typeof parentProfile];
          return value && value.toString().trim() !== '';
        });

        setProfileComplete(completedFields.length === requiredFields.length);
      }
    } catch (error) {
      console.warn('Error checking profile completeness:', error);
    }
  };

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch parent dashboard data, usage stats, and contacts in parallel
      const [data, stats] = await Promise.all([
        StudentDataService.getParentDashboardData(userId),
        UsageTrackingService.getUserUsageStats(userId)
      ]);
      
      // Load contacts separately (non-blocking)
      loadContacts();

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
      setError(t('errors.somethingWentWrong'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchDashboardData();
    checkProfileCompleteness();
  }, [userId]);

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchDashboardData(),
      refreshSubscription(),
      loadContacts(),
      checkProfileCompleteness()
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
    router.push('/screens/subscription-management');
  };

  // Handle AI feature usage
  const handleAIFeatureUsage = async (featureType: 'ai_lesson' | 'homework_grading' | 'ai_tutoring') => {
    const permission = await UsageTrackingService.canPerformAction(userId, featureType);
    
    if (!permission.allowed) {
      if (permission.upgradeRequired) {
        Alert.alert(
          i18n.t('subscription.alerts.upgradeRequired'),
          permission.reason + '\n\n' + i18n.t('subscription.actions.upgradeUnlimited'),
          [
            { text: i18n.t('common.cancel'), style: 'cancel' },
            { text: i18n.t('subscription.actions.upgradeNow'), onPress: handleUpgrade }
          ]
        );
      } else {
        Alert.alert(i18n.t('subscription.alerts.limitReached'), permission.reason);
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
    if (hour < 12) return t('dashboard.goodMorning');
    if (hour < 17) return t('dashboard.goodAfternoon');
    return t('dashboard.goodEvening');
  };

  const timeAgo = (isoDate: string) => {
    const now = Date.now();
    const then = new Date(isoDate).getTime();
    const diff = Math.max(0, now - then);
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return t('relative.justNow');
    if (minutes < 60) return t('relative.minutes', { count: minutes });
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return t('relative.hours', { count: hours });
    const days = Math.floor(hours / 24);
    return t('relative.days', { count: days });
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
        router.push(`/screens/homework${selectedChildId ? `?childId=${selectedChildId}` : ''}` as any);
        break;
      case 'activities':
        router.push('/(tabs)/activities');
        break;
      case 'calendar':
        router.push('/screens/lessons');
        break;
      case 'messages':
        router.push('/messages');
        break;
      case 'upload-pop':
        setShowPopModal(true);
        break;
      case 'complete-profile':
        router.push('/screens/complete-profile');
        break;
      case 'ai-lessons':
        router.push('/screens/ai-lesson-generator' as any);
        break;
      case 'homework-ai':
        router.push('/screens/homework' as any);
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
      <View style={[styles.container, { backgroundColor: palette.background }]} className="flex-1 bg-background">
        <MobileHeader
          user={userProfile}
          schoolName={tenantName}
          onNotificationsPress={() => {}}
          onSignOut={onSignOut}
          onNavigate={handleNavigate}
          notificationCount={0}
          actionsPlacement="below"
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B5CF6" />
          <Text style={[styles.loadingText, { color: palette.textSecondary }]}>
            {t('dashboard.loading')}
          </Text>
        </View>
      </View>
    );
  }

  // If there's an error, show error message
  if (error && !loading && !refreshing) {
    return (
      <View style={[styles.container, { backgroundColor: palette.background }]} className="flex-1 bg-background">
        <MobileHeader
          user={userProfile}
          schoolName={tenantName}
          onNotificationsPress={() => {}}
          onSignOut={onSignOut}
          onNavigate={handleNavigate}
          notificationCount={0}
          actionsPlacement="below"
        />
        <View style={styles.errorContainer}>
          <IconSymbol name="exclamationmark.triangle.fill" size={48} color="#EF4444" />
          <Text style={[styles.errorTitle, { color: palette.text }]}>{t('errors.somethingWentWrong')}</Text>
          <Text style={[styles.errorMessage, { color: palette.textSecondary }]}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchDashboardData}>
            <Text style={styles.retryButtonText}>{t('common.retry')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]} className="flex-1 bg-background">
      {/* Mobile Header */}
      <MobileHeader
        user={userProfile}
        schoolName={tenantName}
        onNotificationsPress={() => {}}
        onSignOut={onSignOut}
        onNavigate={handleNavigate}
        notificationCount={dashboardData?.recent_updates.length || 0}
        actionsPlacement="below"
      />

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(100, insets.bottom + 80) }
        ]}
      >
        {/* Modern Responsive Header Section (Google-style) */}
        <View style={[
          styles.modernHeaderSection,
          { 
            paddingLeft: Math.max(12, insets.left + (isSmallScreen ? 12 : 16)),
            paddingRight: Math.max(12, insets.right + (isSmallScreen ? 12 : 16))
          }
        ]}>
          <View style={styles.titleSection}>
            <Text style={[
              styles.modernTitle,
              (isVerySmallScreen ? styles.modernTitleVerySmall : (isSmallScreen ? styles.modernTitleSmall : styles.modernTitleDefault)),
              { color: palette.text }
            ]}>{getGreeting()} 👋</Text>
            <Text style={[
              styles.modernSubtitle,
              (isSmallScreen ? styles.modernSubtitleSmall : styles.modernSubtitleDefault),
              { color: palette.textSecondary }
            ]}>
{selectedChild ? t('dashboard.parent.seeHowChildDoing', { name: selectedChild.first_name }) : t('dashboard.parent.welcome')}
            </Text>
            {tenantName && (
              <View style={[
                styles.tenantBadge,
                isDark ? styles.tenantBadgeDark : styles.tenantBadgeLight
              ]}>
                <Text style={styles.tenantLabel} numberOfLines={1} ellipsizeMode="tail">🏫 {tenantName}</Text>
              </View>
            )}
          </View>
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
            adUnitId={Platform.OS === 'ios' ? 'ca-app-pub-3940256099942544/2934735716' : 'ca-app-pub-3940256099942544/6300978111'}
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
🎂 {t('age.years', { count: selectedChild.age || 0 })}
                  </Text>
                  <Text style={styles.childDetails}>
👩‍🏫 {selectedChild.teacher_name || i18n.t('dashboard.parent.noTeacherAssigned')}
                  </Text>
                </View>
                <View style={styles.childEmoji}>
                  <Text style={styles.emojiLarge}>👤</Text>
                </View>
              </View>
              
              <View style={styles.childCardFooter}>
                <View style={styles.childBadge}>
                  <Text style={styles.childBadgeText}>
{selectedChild.class_name || selectedChild.age_group_name || i18n.t('common.unassigned')}
                  </Text>
                </View>
                <TouchableOpacity style={styles.attendanceButton} onPress={() => router.push(`/screens/attendance${selectedChildId ? `?childId=${selectedChildId}` : ''}` as any)}>
                  <Text style={styles.attendanceText}>
{t('education.attendance')}: {selectedChild.attendance_percentage}%
                  </Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <View style={styles.emptyStateCard}>
            <EmptyState
              icon={<IconSymbol name="person.2.fill" size={40} color="#9CA3AF" />}
              title={loading ? t('common.loading') : (dashboardData && dashboardData.children.length === 0 ? t('dashboard.parent.noChildrenTitle') : t('dashboard.parent.welcome'))}
              description={loading ? t('dashboard.loading') : (dashboardData && dashboardData.children.length === 0 ? t('dashboard.parent.noChildrenDescription') : t('dashboard.quickOverview'))}
              primaryAction={!loading && dashboardData && dashboardData.children.length === 0 ? { label: t('dashboard.parent.registerChild'), onPress: () => router.push('/(tabs)/register') } : undefined}
            />
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
                    {t('age.years', { count: child.age || 0 })} • {child.class_name || child.age_group_name || i18n.t('common.unassigned')} • {child.teacher_name || i18n.t('dashboard.parent.noTeacher')}
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
<Text style={[styles.sectionHeading, { color: palette.text }]}>🚀 {t('dashboard.quickActions')}</Text>
          
          <View style={styles.quickActions}>
            {/* Standard actions */}
            <TouchableOpacity 
              style={styles.quickAction}
              onPress={() => handleQuickAction('calendar')}
            >
              <View style={styles.quickActionIcon}>
                <IconSymbol name="book.fill" size={24} color="#6B7280" />
              </View>
              <Text style={[styles.quickActionLabel, { color: palette.textSecondary }]}>{t('education.lessons')}</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.quickAction}
              onPress={() => handleQuickAction('homework')}
            >
              <View style={styles.quickActionIcon}>
                <IconSymbol name="doc.text.fill" size={24} color="#6B7280" />
              </View>
              <Text style={[styles.quickActionLabel, { color: palette.textSecondary }]}>{t('education.homework')}</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.quickAction}
              onPress={() => handleQuickAction('activities')}
            >
              <View style={styles.quickActionIcon}>
                <IconSymbol name="location.fill" size={24} color="#6B7280" />
              </View>
              <Text style={[styles.quickActionLabel, { color: palette.textSecondary }]}>{t('education.activities')}</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.quickAction}
              onPress={() => handleQuickAction('messages')}
            >
              <View style={styles.quickActionIcon}>
                <IconSymbol name="message.fill" size={24} color="#6B7280" />
              </View>
              <Text style={[styles.quickActionLabel, { color: palette.textSecondary }]}>{t('nav.messages')}</Text>
            </TouchableOpacity>

            {/* Upload POP */}
            <TouchableOpacity 
              style={styles.quickAction}
              onPress={() => handleQuickAction('upload-pop')}
            >
              <View style={styles.quickActionIcon}>
                <IconSymbol name="doc.text.fill" size={24} color="#6B7280" />
              </View>
              <Text style={[styles.quickActionLabel, { color: palette.textSecondary }]}>{t('payments.uploadPOP')}</Text>
            </TouchableOpacity>

            {/* Complete Profile */}
            <TouchableOpacity 
              style={styles.quickAction}
              onPress={() => handleQuickAction('complete-profile')}
            >
              <View style={[
                styles.quickActionIcon,
                !profileComplete && styles.incompleteProfileIcon
              ]}>
                <IconSymbol 
                  name={profileComplete ? "checkmark.circle.fill" : "person.circle"} 
                  size={24} 
                  color={profileComplete ? "#10B981" : "#EF4444"} 
                />
                {!profileComplete && (
                  <View style={styles.alertBadge}>
                    <IconSymbol name="exclamationmark.circle" size={8} color="#FFFFFF" />
                  </View>
                )}
              </View>
              <Text
                style={styles.quickActionLabel}
                className={profileComplete ? 'text-muted-foreground' : 'text-red-500'}
              >
                {profileComplete ? t('profile.complete') : t('profile.completeProfileAction')}
              </Text>
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
              <Text style={styles.quickActionLabel} className="text-violet-500">{t('dashboard.cards.aiLessons.title')}</Text>
              {usageStats?.quotas.ai_lessons_per_month && (
                <Text style={styles.usageIndicator}>
                  {usageStats.ai_lessons_used_this_month}/{usageStats.quotas.ai_lessons_per_month}
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
              <Text style={styles.quickActionLabel} className="text-violet-500">{t('dashboard.cards.homeworkAi.title')}</Text>
              {usageStats?.quotas.homework_grading_per_month && (
                <Text style={styles.usageIndicator}>
                  {usageStats.homework_graded_this_month}/{usageStats.quotas.homework_grading_per_month}
                </Text>
              )}
            </TouchableOpacity>
        </View>
        </View>

        {/* Free Tier Interstitial Ad */}
        {isFreeTier && (
          <AdComponents.SafeInterstitialAd 
            adUnitId={Platform.OS === 'ios' ? 'ca-app-pub-3940256099942544/4411468910' : 'ca-app-pub-3940256099942544/1033173712'}
          />
        )}

        {/* Recent Activity for selected child */}
        {selectedChild && dashboardData && dashboardData.recent_updates && (
          <View style={styles.activitySection}>
<Text style={[styles.sectionHeading, { color: palette.text }]}>🕒 {t('dashboard.recentActivity')}</Text>
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
<Text style={[styles.sectionHeading, { color: palette.text }]}>🏆 {t('dashboard.achievements.recent')}</Text>
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
<Text style={[styles.sectionHeading, { color: palette.text }]}>📅 {t('dashboard.parent.upcomingEventsTitle')}</Text>
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
              <Text style={[styles.usageSummaryTitle, { color: palette.text }]}>{t('subscription.usage.thisMonthTitle')}</Text>
            </View>
            <Text style={[styles.usageSummaryText, { color: palette.textSecondary }]}>
              {t('subscription.usage.summaryText', { aiUsed: usageStats.ai_lessons_used_this_month, aiLimit: usageStats.quotas.ai_lessons_per_month ?? '∞', hwUsed: usageStats.homework_graded_this_month, hwLimit: usageStats.quotas.homework_grading_per_month ?? '∞' })}
            </Text>
            <TouchableOpacity style={styles.upgradeNowButton} onPress={handleUpgrade}>
              <Text style={styles.upgradeNowText}>{t('subscription.actions.upgradeUnlimited')}</Text>
              <IconSymbol name="arrow.up.right" size={14} color="#FFFFFF" />
            </TouchableOpacity>

            {/* Ad placeholder below upgrade button (free tier only), gated by env */}
            {enableAds && (
              <AdComponents.SafeBannerAd
                style={styles.adBanner}
                adUnitId={isProd
                  ? (Platform.OS === 'android'
                      ? (process.env.EXPO_PUBLIC_ADMOB_ANDROID_BANNER_UNIT_ID || 'ca-app-pub-3940256099942544/6300978111')
                      : (process.env.EXPO_PUBLIC_ADMOB_IOS_BANNER_UNIT_ID || 'ca-app-pub-3940256099942544/2934735716'))
                  : (Platform.OS === 'ios'
                      ? 'ca-app-pub-3940256099942544/2934735716'
                      : 'ca-app-pub-3940256099942544/6300978111')}
              />
            )}
          </View>
        )}

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
        {/* Bottom safe area compensation */}
        <View style={{ height: Math.max(0, insets.bottom) }} />
      </ScrollView>

      {/* POP Upload Modal */}
      {showPopModal && (
        <ProofOfPaymentUpload
          isVisible={showPopModal}
          onClose={() => setShowPopModal(false)}
          studentId={selectedChildId || ''}
          childName={selectedChild?.full_name || selectedChild?.name || i18n.t('common.child')}
          amountPaid={subscription?.plan?.price || 0}
          feeDescription={t('payments.subscriptionPayment')}
          onUploadSuccess={async (data: ProofOfPaymentData) => {
            try {
              await PaymentService.submitProofOfPayment(data);
              Alert.alert(
                i18n.t('payments.proof.successTitle'),
                i18n.t('payments.proof.successMessage'),
                [{ text: i18n.t('common.ok'), onPress: () => setShowPopModal(false) }]
              );
              await refreshSubscription();
            } catch (error) {
              Alert.alert(
                i18n.t('payments.proof.errorTitle'),
                i18n.t('payments.proof.errorMessage'),
                [{ text: i18n.t('common.ok') }]
              );
            }
          }}
        />
      )}
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
  // Modern Header Section - Google Style
  modernHeaderSection: {
    paddingHorizontal: 4,
    paddingVertical: 20,
    marginBottom: 8,
  },
  titleSection: {
    marginBottom: 20,
  },
  modernTitle: {
    fontWeight: '300', // Light weight for Google style
    letterSpacing: -0.5,
    marginBottom: 8,
    color: '#1F2937',
  },
  modernTitleDefault: { fontSize: 32, lineHeight: 40 },
  modernTitleSmall: { fontSize: 28, lineHeight: 34 },
  modernTitleVerySmall: { fontSize: 24, lineHeight: 30 },
  modernSubtitle: {
    opacity: 0.7,
    color: '#6B7280',
  },
  modernSubtitleDefault: { fontSize: 14, lineHeight: 20 },
  modernSubtitleSmall: { fontSize: 13, lineHeight: 20 },
  tenantBadge: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  tenantBadgeLight: { backgroundColor: 'rgba(66, 133, 244, 0.1)' },
  tenantBadgeDark: { backgroundColor: 'rgba(66, 133, 244, 0.2)' },
  tenantLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4285F4',
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
  sectionHeading: {
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
  incompleteProfileIcon: {
    borderWidth: 2,
    borderColor: '#FEE2E2',
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
  alertBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#EF4444',
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
