import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors } from '@/constants/Colors';
import { useSubscription } from '@/lib/hooks/useSubscription';
import { PlatformSubscription } from '@/lib/services/subscriptionService';

interface DashboardSubscriptionCardProps {
  userId: string;
  compact?: boolean;
  showUsage?: boolean;
  onUpgrade?: () => void;
}

interface UsageStats {
  ai_lessons_used: number;
  ai_lessons_limit: number;
  homework_graded: number;
  homework_limit: number;
  premium_features_accessed: number;
}

export const DashboardSubscriptionCard: React.FC<DashboardSubscriptionCardProps> = ({
  userId,
  compact = false,
  showUsage = true,
  onUpgrade
}) => {
  const { colorScheme } = useTheme();
  const palette = Colors[colorScheme];
  const {
    subscription,
    isSubscriptionActive,
    isTrialActive,
    getDaysUntilExpiry,
    refreshSubscription,
    loading
  } = useSubscription();

  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  const [loadingUsage, setLoadingUsage] = useState(false);

  // Fetch usage statistics
  const fetchUsageStats = async () => {
    if (!showUsage) return;
    
    setLoadingUsage(true);
    try {
      // TODO: Replace with actual usage tracking service
      // This would typically call a service to get real usage data
      const mockStats: UsageStats = {
        ai_lessons_used: Math.floor(Math.random() * 50),
        ai_lessons_limit: subscription ? 100 : 5, // Free: 5, Premium: 100
        homework_graded: Math.floor(Math.random() * 20),
        homework_limit: subscription ? 50 : 3, // Free: 3, Premium: 50
        premium_features_accessed: Math.floor(Math.random() * 10),
      };
      setUsageStats(mockStats);
    } catch (error) {
      console.error('Failed to fetch usage stats:', error);
    } finally {
      setLoadingUsage(false);
    }
  };

  useEffect(() => {
    fetchUsageStats();
  }, [subscription, showUsage]);

  const isActive = isSubscriptionActive();
  const isTrial = isTrialActive();
  const daysUntilExpiry = getDaysUntilExpiry();
  const isFreeTier = !subscription || subscription.plan?.name?.toLowerCase().includes('free');

  const getStatusInfo = () => {
    if (!subscription) {
      return {
        status: 'Free',
        color: '#6B7280',
        bgColor: ['#F3F4F6', '#E5E7EB'],
        icon: 'star.circle'
      };
    }

    switch (subscription.status) {
      case 'active':
        return {
          status: 'Active',
          color: '#10B981',
          bgColor: ['#D1FAE5', '#A7F3D0'],
          icon: 'checkmark.circle.fill'
        };
      case 'trial':
        return {
          status: 'Trial',
          color: '#F59E0B',
          bgColor: ['#FEF3C7', '#FDE68A'],
          icon: 'clock.fill'
        };
      case 'past_due':
        return {
          status: 'Past Due',
          color: '#EF4444',
          bgColor: ['#FEE2E2', '#FECACA'],
          icon: 'exclamationmark.triangle.fill'
        };
      default:
        return {
          status: 'Inactive',
          color: '#6B7280',
          bgColor: ['#F3F4F6', '#E5E7EB'],
          icon: 'xmark.circle.fill'
        };
    }
  };

  const statusInfo = getStatusInfo();

  const handleUpgradePress = () => {
    if (onUpgrade) {
      onUpgrade();
    } else {
      router.push('/pricing');
    }
  };

  const handleManagePress = () => {
    Alert.alert(
      'Manage Subscription',
      'Choose an option',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'View Billing', onPress: () => router.push('/(dashboard)/account/billing') },
        { text: 'Change Plan', onPress: () => router.push('/pricing') },
      ]
    );
  };

  const getUsagePercentage = (used: number, limit: number) => {
    if (limit === 0) return 0;
    return Math.min((used / limit) * 100, 100);
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return '#EF4444';
    if (percentage >= 75) return '#F59E0B';
    return '#10B981';
  };

  if (compact) {
    return (
      <TouchableOpacity 
        style={[styles.compactCard, { backgroundColor: palette.surface }]}
        onPress={isFreeTier ? handleUpgradePress : handleManagePress}
      >
        <View style={styles.compactContent}>
          <View style={styles.compactStatus}>
            <IconSymbol name={statusInfo.icon} size={16} color={statusInfo.color} />
            <Text style={[styles.compactStatusText, { color: statusInfo.color }]}>
              {statusInfo.status}
            </Text>
          </View>
          <Text style={[styles.compactPlan, { color: palette.text }]}>
            {subscription?.plan?.name || 'Free Plan'}
          </Text>
          {isFreeTier && (
            <LinearGradient
              colors={['#8B5CF6', '#7C3AED']}
              style={styles.compactUpgrade}
            >
              <Text style={styles.compactUpgradeText}>Upgrade</Text>
            </LinearGradient>
          )}
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.card, { backgroundColor: palette.surface }]}>
      <LinearGradient
        colors={statusInfo.bgColor}
        style={styles.cardGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.statusContainer}>
            <View style={[styles.statusBadge, { backgroundColor: `${statusInfo.color}20` }]}>
              <IconSymbol name={statusInfo.icon} size={14} color={statusInfo.color} />
              <Text style={[styles.statusText, { color: statusInfo.color }]}>
                {statusInfo.status}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.manageButton}
              onPress={handleManagePress}
            >
              <IconSymbol name="gear" size={16} color={palette.textSecondary} />
            </TouchableOpacity>
          </View>
          
          <Text style={[styles.planName, { color: palette.text }]}>
            {subscription?.plan?.name || 'Free Plan'}
          </Text>
          
          {subscription && (
            <Text style={[styles.planPrice, { color: palette.textSecondary }]}>
              R{subscription.amount}/{subscription.billing_interval === 'monthly' ? 'month' : 'year'}
            </Text>
          )}
        </View>

        {/* Trial Warning */}
        {isTrial && daysUntilExpiry !== null && daysUntilExpiry <= 7 && (
          <View style={styles.warningContainer}>
            <IconSymbol name="exclamationmark.triangle.fill" size={14} color="#F59E0B" />
            <Text style={[styles.warningText, { color: palette.text }]}>
              Trial expires in {daysUntilExpiry} day{daysUntilExpiry !== 1 ? 's' : ''}
            </Text>
          </View>
        )}

        {/* Usage Statistics */}
        {showUsage && usageStats && !loadingUsage && (
          <View style={styles.usageSection}>
            <Text style={[styles.usageTitle, { color: palette.text }]}>
              Current Usage
            </Text>
            
            <View style={styles.usageGrid}>
              {/* AI Lessons */}
              <View style={styles.usageItem}>
                <View style={styles.usageHeader}>
                  <IconSymbol name="brain.head.profile" size={16} color="#8B5CF6" />
                  <Text style={[styles.usageLabel, { color: palette.textSecondary }]}>
                    AI Lessons
                  </Text>
                </View>
                <View style={styles.usageBar}>
                  <View 
                    style={[
                      styles.usageBarFill,
                      { 
                        width: `${getUsagePercentage(usageStats.ai_lessons_used, usageStats.ai_lessons_limit)}%`,
                        backgroundColor: getUsageColor(getUsagePercentage(usageStats.ai_lessons_used, usageStats.ai_lessons_limit))
                      }
                    ]} 
                  />
                </View>
                <Text style={[styles.usageNumbers, { color: palette.text }]}>
                  {usageStats.ai_lessons_used}/{usageStats.ai_lessons_limit}
                </Text>
              </View>

              {/* Homework Grading */}
              <View style={styles.usageItem}>
                <View style={styles.usageHeader}>
                  <IconSymbol name="doc.text.below.ecg" size={16} color="#10B981" />
                  <Text style={[styles.usageLabel, { color: palette.textSecondary }]}>
                    Homework AI
                  </Text>
                </View>
                <View style={styles.usageBar}>
                  <View 
                    style={[
                      styles.usageBarFill,
                      { 
                        width: `${getUsagePercentage(usageStats.homework_graded, usageStats.homework_limit)}%`,
                        backgroundColor: getUsageColor(getUsagePercentage(usageStats.homework_graded, usageStats.homework_limit))
                      }
                    ]} 
                  />
                </View>
                <Text style={[styles.usageNumbers, { color: palette.text }]}>
                  {usageStats.homework_graded}/{usageStats.homework_limit}
                </Text>
              </View>
            </View>
          </View>
        )}

        {loadingUsage && showUsage && (
          <View style={styles.loadingUsage}>
            <ActivityIndicator size="small" color={palette.textSecondary} />
            <Text style={[styles.loadingText, { color: palette.textSecondary }]}>
              Loading usage...
            </Text>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actions}>
          {isFreeTier || isTrial ? (
            <TouchableOpacity
              style={styles.upgradeButton}
              onPress={handleUpgradePress}
            >
              <LinearGradient
                colors={['#8B5CF6', '#7C3AED']}
                style={styles.upgradeButtonGradient}
              >
                <Text style={styles.upgradeButtonText}>
                  {isTrial ? 'Upgrade Now' : 'Go Premium'}
                </Text>
                <IconSymbol name="arrow.up.right" size={14} color="#FFFFFF" />
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.manageSubscriptionButton}
              onPress={handleManagePress}
            >
              <Text style={[styles.manageSubscriptionText, { color: palette.primary }]}>
                Manage Subscription
              </Text>
              <IconSymbol name="arrow.right" size={12} color={palette.primary} />
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardGradient: {
    padding: 20,
  },
  
  // Compact version styles
  compactCard: {
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  compactContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  compactStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  compactStatusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  compactPlan: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  compactUpgrade: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  compactUpgradeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Full version styles
  header: {
    marginBottom: 16,
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  manageButton: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  planName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
  },
  planPrice: {
    fontSize: 14,
    fontWeight: '500',
  },
  
  // Warning
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245,158,11,0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  warningText: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  
  // Usage section
  usageSection: {
    marginBottom: 16,
  },
  usageTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  usageGrid: {
    gap: 12,
  },
  usageItem: {
    gap: 6,
  },
  usageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  usageLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  usageBar: {
    height: 4,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  usageBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  usageNumbers: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'right',
  },
  
  // Loading
  loadingUsage: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  loadingText: {
    fontSize: 12,
  },
  
  // Actions
  actions: {
    gap: 8,
  },
  upgradeButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  upgradeButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 6,
  },
  upgradeButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  manageSubscriptionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 4,
  },
  manageSubscriptionText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
