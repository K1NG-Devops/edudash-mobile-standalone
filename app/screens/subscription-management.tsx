import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
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
import { UsageTrackingService, UsageStats } from '@/lib/services/usageTrackingService';
import { SubscriptionService } from '@/lib/services/subscriptionService';
import { CompactHeader } from '@/components/navigation/CompactHeader';

const { width: screenWidth } = Dimensions.get('window');

interface BillingHistoryItem {
  id: string;
  amount: number;
  currency: string;
  status: string;
  processed_at: string;
  provider_payment_id: string | null;
}

export default function SubscriptionManagementScreen() {
  const { colorScheme } = useTheme();
  const { user, profile } = useAuth();
  const palette = Colors[colorScheme];
  const isDark = colorScheme === 'dark';
  
  const {
    subscription,
    isSubscriptionActive,
    isTrialActive,
    getDaysUntilExpiry,
    cancelSubscription,
    refreshSubscription,
    loading: subscriptionLoading
  } = useSubscription();

  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  const [billingHistory, setBillingHistory] = useState<BillingHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [billingLoading, setBillingLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'usage' | 'billing' | 'settings'>('overview');

  const isActive = isSubscriptionActive();
  const isTrial = isTrialActive();
  const daysUntilExpiry = getDaysUntilExpiry();
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
      const [stats] = await Promise.all([
        UsageTrackingService.getUserUsageStats(user.id),
      ]);
      setUsageStats(stats);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBillingHistory = async () => {
    if (!user?.id) return;
    
    try {
      setBillingLoading(true);
      const result = await SubscriptionService.getRecentPayments(user.id, 10);
      if (!result.error && result.data) {
        setBillingHistory(result.data);
      }
    } catch (error) {
      console.error('Error fetching billing history:', error);
    } finally {
      setBillingLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'billing' && billingHistory.length === 0) {
      fetchBillingHistory();
    }
  }, [activeTab]);

  const getStatusInfo = () => {
    if (!subscription) {
      return {
        status: 'Free Plan',
        color: '#6B7280',
        bgColor: ['#F3F4F6', '#E5E7EB'] as const,
        icon: 'star.circle'
      };
    }

    if (isTrial) {
      return {
        status: 'Free Trial',
        color: '#F59E0B',
        bgColor: ['#FEF3C7', '#FDE68A'] as const,
        icon: 'clock.fill'
      };
    }

    if (isActive) {
      return {
        status: 'Active',
        color: '#10B981',
        bgColor: ['#D1FAE5', '#A7F3D0'] as const,
        icon: 'checkmark.circle.fill'
      };
    }

    return {
      status: 'Inactive',
      color: '#EF4444',
      bgColor: ['#FEE2E2', '#FECACA'] as const,
      icon: 'exclamationmark.triangle.fill'
    };
  };

  const handleCancelSubscription = () => {
    Alert.alert(
      'Cancel Subscription',
      'Are you sure you want to cancel your subscription? You\'ll lose access to premium features at the end of your current billing period.',
      [
        { text: 'Keep Subscription', style: 'cancel' },
        {
          text: 'Cancel Subscription',
          style: 'destructive',
          onPress: async () => {
            try {
              const success = await cancelSubscription();
              if (success) {
                Alert.alert('Success', 'Your subscription has been cancelled.');
                await refreshSubscription();
              } else {
                Alert.alert('Error', 'Failed to cancel subscription. Please contact support.');
              }
            } catch (error) {
              Alert.alert('Error', 'An error occurred while cancelling your subscription.');
            }
          }
        }
      ]
    );
  };

  const handleUpgrade = () => {
    router.push('/pricing');
  };

  const statusInfo = getStatusInfo();

  const renderOverviewTab = () => (
    <View style={styles.tabContent}>
      {/* Subscription Status Card */}
      <View style={[styles.card, { backgroundColor: palette.surface }]}>
      <LinearGradient
        colors={isDark ? ['#374151', '#4B5563'] : statusInfo.bgColor}
        style={styles.statusCard}
      >
        <View style={styles.statusHeader}>
          <View style={styles.statusBadge}>
            <IconSymbol name={statusInfo.icon} size={20} color={statusInfo.color} />
            <Text style={[styles.statusText, { color: statusInfo.color }]}>
              {statusInfo.status}
            </Text>
          </View>
          <Text style={[styles.planName, { color: isDark ? '#F9FAFB' : palette.text }]}>
            {subscription?.plan?.name || 'Free Plan'}
          </Text>
        </View>

        {subscription && (
          <View style={styles.planDetails}>
            <Text style={[styles.planPrice, { color: isDark ? '#D1D5DB' : palette.textSecondary }]}>
              R{subscription.amount}/{subscription.billing_interval === 'monthly' ? 'month' : 'year'}
            </Text>
            {isTrial && daysUntilExpiry !== null && (
              <Text style={styles.trialWarning}>
                🎯 Trial ends in {daysUntilExpiry} day{daysUntilExpiry !== 1 ? 's' : ''}
              </Text>
            )}
            {!isTrial && subscription.current_period_end && (
              <Text style={[styles.nextBilling, { color: isDark ? '#D1D5DB' : palette.textSecondary }]}>
                Next billing: {new Date(subscription.current_period_end).toLocaleDateString()}
              </Text>
            )}
          </View>
        )}
        </LinearGradient>
      </View>

      {/* Quick Usage Overview */}
      {usageStats && (
        <View style={[styles.card, { backgroundColor: palette.surface }]}>
          <Text style={[styles.cardTitle, { color: palette.text }]}>Current Usage</Text>
          
          <View style={styles.usageGrid}>
            <View style={styles.usageItem}>
              <IconSymbol name="brain.head.profile" size={24} color="#8B5CF6" />
              <Text style={[styles.usageLabel, { color: palette.textSecondary }]}>AI Lessons</Text>
              <Text style={[styles.usageValue, { color: palette.text }]}>
                {usageStats.ai_lessons_used_this_month}
                {usageStats.quotas.ai_lessons_per_month ? `/${usageStats.quotas.ai_lessons_per_month}` : ''}
              </Text>
            </View>

            <View style={styles.usageItem}>
              <IconSymbol name="doc.text.below.ecg" size={24} color="#10B981" />
              <Text style={[styles.usageLabel, { color: palette.textSecondary }]}>Homework AI</Text>
              <Text style={[styles.usageValue, { color: palette.text }]}>
                {usageStats.homework_graded_this_month}
                {usageStats.quotas.homework_grading_per_month ? `/${usageStats.quotas.homework_grading_per_month}` : ''}
              </Text>
            </View>

            <View style={styles.usageItem}>
              <IconSymbol name="person.2.badge.gearshape" size={24} color="#EC4899" />
              <Text style={[styles.usageLabel, { color: palette.textSecondary }]}>AI Tutoring</Text>
              <Text style={[styles.usageValue, { color: palette.text }]}>
                {usageStats.ai_tutoring_sessions_today}
                {usageStats.quotas.ai_tutoring_sessions_per_month ? `/${usageStats.quotas.ai_tutoring_sessions_per_month}` : ''}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        {isFreeTier || isTrial ? (
          <TouchableOpacity style={styles.upgradeButton} onPress={handleUpgrade}>
            <LinearGradient
              colors={['#8B5CF6', '#7C3AED']}
              style={styles.buttonGradient}
            >
              <IconSymbol name="arrow.up.right" size={20} color="#FFFFFF" />
              <Text style={styles.upgradeButtonText}>
                {isTrial ? 'Upgrade Now' : 'Go Premium'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <View style={styles.actionButtonsRow}>
            <TouchableOpacity 
              style={[styles.secondaryButton, { backgroundColor: palette.surface }]}
              onPress={() => router.push('/pricing')}
            >
              <Text style={[styles.secondaryButtonText, { color: palette.primary }]}>
                Change Plan
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.dangerButton]}
              onPress={handleCancelSubscription}
            >
              <Text style={styles.dangerButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );

  const renderUsageTab = () => (
    <View style={styles.tabContent}>
      {usageStats ? (
        <View>
          {/* Usage Details */}
          <View style={[styles.card, { backgroundColor: palette.surface }]}>
            <Text style={[styles.cardTitle, { color: palette.text }]}>This Month's Usage</Text>
            
            {/* AI Lessons */}
            <View style={styles.usageDetailItem}>
              <View style={styles.usageDetailHeader}>
                <IconSymbol name="brain.head.profile" size={20} color="#8B5CF6" />
                <Text style={[styles.usageDetailLabel, { color: palette.text }]}>AI Lesson Generation</Text>
              </View>
              <View style={styles.usageDetailStats}>
                <Text style={[styles.usageDetailValue, { color: palette.text }]}>
                  {usageStats.ai_lessons_used_this_month} used
                </Text>
                {usageStats.quotas.ai_lessons_per_month && (
                  <>
                    <View style={[styles.usageBar, { backgroundColor: palette.outline }]}>
                      <View 
                        style={[
                          styles.usageBarFill,
                          { 
                            width: `${Math.min((usageStats.ai_lessons_used_this_month / usageStats.quotas.ai_lessons_per_month) * 100, 100)}%`,
                            backgroundColor: usageStats.ai_lessons_used_this_month >= usageStats.quotas.ai_lessons_per_month ? '#EF4444' : '#8B5CF6'
                          }
                        ]} 
                      />
                    </View>
                    <Text style={[styles.usageDetailLimit, { color: palette.textSecondary }]}>
                      Limit: {usageStats.quotas.ai_lessons_per_month}
                    </Text>
                  </>
                )}
              </View>
            </View>

            {/* Homework Grading */}
            <View style={styles.usageDetailItem}>
              <View style={styles.usageDetailHeader}>
                <IconSymbol name="doc.text.below.ecg" size={20} color="#10B981" />
                <Text style={[styles.usageDetailLabel, { color: palette.text }]}>Homework Grading</Text>
              </View>
              <View style={styles.usageDetailStats}>
                <Text style={[styles.usageDetailValue, { color: palette.text }]}>
                  {usageStats.homework_graded_this_month} used
                </Text>
                {usageStats.quotas.homework_grading_per_month && (
                  <>
                    <View style={[styles.usageBar, { backgroundColor: palette.outline }]}>
                      <View 
                        style={[
                          styles.usageBarFill,
                          { 
                            width: `${Math.min((usageStats.homework_graded_this_month / usageStats.quotas.homework_grading_per_month) * 100, 100)}%`,
                            backgroundColor: usageStats.homework_graded_this_month >= usageStats.quotas.homework_grading_per_month ? '#EF4444' : '#10B981'
                          }
                        ]} 
                      />
                    </View>
                    <Text style={[styles.usageDetailLimit, { color: palette.textSecondary }]}>
                      Limit: {usageStats.quotas.homework_grading_per_month}
                    </Text>
                  </>
                )}
              </View>
            </View>

            {/* AI Tutoring */}
            <View style={styles.usageDetailItem}>
              <View style={styles.usageDetailHeader}>
                <IconSymbol name="person.2.badge.gearshape" size={20} color="#EC4899" />
                <Text style={[styles.usageDetailLabel, { color: palette.text }]}>AI Tutoring Sessions</Text>
              </View>
              <View style={styles.usageDetailStats}>
                <Text style={[styles.usageDetailValue, { color: palette.text }]}>
                  {usageStats.ai_tutoring_sessions_today} today
                </Text>
                {usageStats.quotas.ai_tutoring_sessions_per_month && (
                  <>
                    <View style={[styles.usageBar, { backgroundColor: palette.outline }]}>
                      <View 
                        style={[
                          styles.usageBarFill,
                          { 
                            width: `${Math.min((usageStats.ai_tutoring_sessions_today / usageStats.quotas.ai_tutoring_sessions_per_month) * 100, 100)}%`,
                            backgroundColor: usageStats.ai_tutoring_sessions_today >= usageStats.quotas.ai_tutoring_sessions_per_month ? '#EF4444' : '#EC4899'
                          }
                        ]} 
                      />
                    </View>
                    <Text style={[styles.usageDetailLimit, { color: palette.textSecondary }]}>
                      Monthly Limit: {usageStats.quotas.ai_tutoring_sessions_per_month}
                    </Text>
                  </>
                )}
              </View>
            </View>
          </View>

          {/* Usage Warnings */}
          {usageStats.usage_warnings && usageStats.usage_warnings.length > 0 && (
            <View style={[styles.card, styles.warningCard]}>
              <IconSymbol name="exclamationmark.triangle.fill" size={24} color="#F59E0B" />
              <View style={styles.warningContent}>
                <Text style={styles.warningTitle}>Usage Warnings</Text>
                {usageStats.usage_warnings.map((warning, index) => (
                  <Text key={index} style={styles.warningMessage}>
                    • {warning.message}
                  </Text>
                ))}
              </View>
            </View>
          )}
        </View>
      ) : (
        <View style={styles.emptyState}>
          <ActivityIndicator size="large" color={palette.primary} />
          <Text style={[styles.emptyStateText, { color: palette.textSecondary }]}>
            Loading usage data...
          </Text>
        </View>
      )}
    </View>
  );

  const renderBillingTab = () => (
    <View style={styles.tabContent}>
      {subscription && (
        <View style={[styles.card, { backgroundColor: palette.surface }]}>
          <Text style={[styles.cardTitle, { color: palette.text }]}>Current Plan</Text>
          <View style={styles.billingPlanInfo}>
            <Text style={[styles.billingPlanName, { color: palette.text }]}>
              {subscription.plan?.name}
            </Text>
            <Text style={[styles.billingPlanPrice, { color: palette.textSecondary }]}>
              R{subscription.amount} per {subscription.billing_interval}
            </Text>
          </View>
        </View>
      )}

      <View style={[styles.card, { backgroundColor: palette.surface }]}>
        <View style={styles.cardHeader}>
          <Text style={[styles.cardTitle, { color: palette.text }]}>Billing History</Text>
          <TouchableOpacity onPress={fetchBillingHistory}>
            <IconSymbol name="arrow.clockwise" size={20} color={palette.primary} />
          </TouchableOpacity>
        </View>
        
        {billingLoading ? (
          <ActivityIndicator size="small" color={palette.primary} />
        ) : billingHistory.length > 0 ? (
          <View style={styles.billingHistoryList}>
            {billingHistory.map((payment) => (
              <View key={payment.id} style={[styles.billingHistoryItem, { borderBottomColor: palette.outline }]}>
                <View style={styles.billingHistoryInfo}>
                  <Text style={[styles.billingHistoryAmount, { color: palette.text }]}>
                    R{payment.amount}
                  </Text>
                  <Text style={[styles.billingHistoryDate, { color: palette.textSecondary }]}>
                    {new Date(payment.processed_at).toLocaleDateString()}
                  </Text>
                </View>
                <View style={[
                  styles.billingHistoryStatus,
                  { backgroundColor: payment.status === 'completed' ? '#10B981' : '#F59E0B' }
                ]}>
                  <Text style={styles.billingHistoryStatusText}>
                    {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <IconSymbol name="doc.text" size={48} color={palette.textSecondary} />
            <Text style={[styles.emptyStateText, { color: palette.textSecondary }]}>
              No billing history available
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  const renderSettingsTab = () => (
    <View style={styles.tabContent}>
      <View style={[styles.card, { backgroundColor: palette.surface }]}>
        <Text style={[styles.cardTitle, { color: palette.text }]}>Account Settings</Text>
        
        <TouchableOpacity 
          style={styles.settingItem}
          onPress={() => router.push('/screens/complete-profile')}
        >
          <IconSymbol name="person.circle" size={24} color={palette.primary} />
          <Text style={[styles.settingItemText, { color: palette.text }]}>
            Update Profile
          </Text>
          <IconSymbol name="chevron.right" size={16} color={palette.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.settingItem}
          onPress={() => router.push('/pricing')}
        >
          <IconSymbol name="crown.fill" size={24} color={palette.primary} />
          <Text style={[styles.settingItemText, { color: palette.text }]}>
            View All Plans
          </Text>
          <IconSymbol name="chevron.right" size={16} color={palette.textSecondary} />
        </TouchableOpacity>

        {subscription && subscription.status === 'active' && (
          <TouchableOpacity 
            style={styles.settingItem}
            onPress={handleCancelSubscription}
          >
            <IconSymbol name="xmark.circle" size={24} color="#EF4444" />
            <Text style={[styles.settingItemText, { color: '#EF4444' }]}>
              Cancel Subscription
            </Text>
            <IconSymbol name="chevron.right" size={16} color={palette.textSecondary} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  if (loading || subscriptionLoading) {
    return (
      <View style={[styles.container, { backgroundColor: palette.background }]}>
        <CompactHeader
          title="Subscription"
          subtitle="Loading..."
          avatarInitial={profile?.name?.charAt(0) || 'U'}
          backgroundMode="surface"
          onBackPress={() => {
            try {
              // Prefer safe back; if none, fall back to a dashboard
              // @ts-ignore - expo-router may expose canGoBack at runtime
              if (router.canGoBack && router.canGoBack()) {
                router.back();
              } else if (typeof window !== 'undefined' && window.history && window.history.length > 1) {
                window.history.back();
              } else {
                router.replace('/screens/principal-dashboard' as any);
              }
            } catch {
              router.replace('/screens/principal-dashboard' as any);
            }
          }}
        />
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={palette.primary} />
          <Text style={[styles.loadingText, { color: palette.textSecondary }]}>
            Loading subscription data...
          </Text>
        </View>
      </View>
    );
  }

  // Prepare status indicators for the header
  const headerIndicators = [];
  if (subscription?.plan?.name && subscription.plan.name !== 'Free Plan') {
    headerIndicators.push({
      icon: 'crown.fill',
      label: subscription.plan.name,
      color: palette.primary,
    });
  }
  if (isActive && !isTrial) {
    headerIndicators.push({
      icon: 'checkmark.circle.fill',
      label: 'Active',
      color: palette.success,
    });
  } else if (isTrial) {
    headerIndicators.push({
      icon: 'clock.fill',
      label: `Trial: ${daysUntilExpiry} days`,
      color: palette.warning,
    });
  }

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      {/* Compact Header */}
      <CompactHeader
        title={profile?.name || 'Subscription'}
        subtitle={'Manage your plan'}
        avatarInitial={profile?.name?.charAt(0) || 'U'}
        statusIndicators={headerIndicators}
        backgroundMode="surface"
        onBackPress={() => {
          try {
            // Prefer safe back; if none, fall back to a dashboard
            // @ts-ignore - expo-router may expose canGoBack at runtime
            if (router.canGoBack && router.canGoBack()) {
              router.back();
            } else if (typeof window !== 'undefined' && window.history && window.history.length > 1) {
              window.history.back();
            } else {
              router.replace('/screens/principal-dashboard' as any);
            }
          } catch {
            router.replace('/screens/principal-dashboard' as any);
          }
        }}
      />

      {/* Tab Navigation */}
      <View style={[styles.tabNavigation, { backgroundColor: palette.surface }]}>
        {[
          { key: 'overview', label: 'Overview', icon: 'square.grid.2x2' },
          { key: 'usage', label: 'Usage', icon: 'chart.bar.fill' },
          { key: 'billing', label: 'Billing', icon: 'creditcard.fill' },
          { key: 'settings', label: 'Settings', icon: 'gear.fill' }
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tab,
              activeTab === tab.key && [styles.activeTab, { backgroundColor: palette.primary }]
            ]}
            onPress={() => setActiveTab(tab.key as any)}
          >
            <IconSymbol 
              name={tab.icon} 
              size={16} 
              color={activeTab === tab.key ? '#FFFFFF' : palette.textSecondary} 
            />
            <Text style={[
              styles.tabText,
              { color: activeTab === tab.key ? '#FFFFFF' : palette.textSecondary }
            ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab Content */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {activeTab === 'overview' && renderOverviewTab()}
        {activeTab === 'usage' && renderUsageTab()}
        {activeTab === 'billing' && renderBillingTab()}
        {activeTab === 'settings' && renderSettingsTab()}
      </ScrollView>
    </View>
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
  
  // Tab Navigation
  tabNavigation: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginHorizontal: 2,
    gap: 4,
  },
  activeTab: {
    backgroundColor: '#8B5CF6',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Content
  scrollView: {
    flex: 1,
  },
  tabContent: {
    padding: 20,
  },
  card: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },

  // Status Card
  statusCard: {
    borderRadius: 12,
    padding: 16,
  },
  statusHeader: {
    marginBottom: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  planName: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  planDetails: {
    gap: 4,
  },
  planPrice: {
    fontSize: 16,
    fontWeight: '500',
  },
  trialWarning: {
    fontSize: 14,
    color: '#F59E0B',
    fontWeight: '500',
  },
  nextBilling: {
    fontSize: 14,
  },

  // Usage Grid
  usageGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  usageItem: {
    alignItems: 'center',
    gap: 8,
  },
  usageLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  usageValue: {
    fontSize: 16,
    fontWeight: '600',
  },

  // Usage Details
  usageDetailItem: {
    marginBottom: 20,
  },
  usageDetailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  usageDetailLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  usageDetailStats: {
    gap: 8,
  },
  usageDetailValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  usageBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  usageBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  usageDetailLimit: {
    fontSize: 12,
  },

  // Warning Card
  warningCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF3C7',
    gap: 12,
  },
  warningContent: {
    flex: 1,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 8,
  },
  warningMessage: {
    fontSize: 14,
    color: '#92400E',
    lineHeight: 20,
  },

  // Billing
  billingPlanInfo: {
    alignItems: 'center',
    gap: 4,
  },
  billingPlanName: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  billingPlanPrice: {
    fontSize: 16,
  },
  billingHistoryList: {
    gap: 12,
  },
  billingHistoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  billingHistoryInfo: {
    flex: 1,
  },
  billingHistoryAmount: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  billingHistoryDate: {
    fontSize: 14,
  },
  billingHistoryStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  billingHistoryStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Settings
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  settingItemText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },

  // Action Buttons
  actionButtons: {
    marginTop: 8,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  upgradeButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 8,
  },
  upgradeButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  secondaryButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  dangerButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#EF4444',
    alignItems: 'center',
  },
  dangerButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 16,
  },
  emptyStateText: {
    fontSize: 16,
    textAlign: 'center',
  },
});
