import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors } from '@/constants/Colors';
import { useSubscription } from '@/lib/hooks/useSubscription';
import { UsageTrackingService, UsageStats } from '@/lib/services/usageTrackingService';

const { width: screenWidth } = Dimensions.get('window');

interface SubscriptionAwareStatsCardsProps {
  userId: string;
  childData?: {
    completed_activities: number;
    pending_homework: number;
    attendance_percentage: number;
  };
  onUpgradePress?: () => void;
  compact?: boolean;
}

interface StatCardData {
  id: string;
  title: string;
  value: string;
  subtitle: string;
  icon: string;
  gradient: string[];
  usageInfo?: {
    used: number;
    limit: number | null;
    feature: string;
  };
  isPremium?: boolean;
  isLocked?: boolean;
}

const SubscriptionAwareStatsCards: React.FC<SubscriptionAwareStatsCardsProps> = ({
  userId,
  childData,
  onUpgradePress,
  compact = false
}) => {
  const { colorScheme } = useTheme();
  const palette = Colors[colorScheme];
  const { subscription, isSubscriptionActive } = useSubscription();
  
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [pulseAnim] = useState(new Animated.Value(1));

  // Fetch usage statistics
  useEffect(() => {
    const fetchUsageStats = async () => {
      try {
        setLoading(true);
        const stats = await UsageTrackingService.getUserUsageStats(userId);
        setUsageStats(stats);
      } catch (error) {
        console.error('Failed to fetch usage stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsageStats();
    
    // Refresh every 5 minutes
    const interval = setInterval(fetchUsageStats, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [userId]);

  // Create pulse animation for limits approaching
  useEffect(() => {
    if (usageStats?.upgrade_recommended) {
      const pulse = () => {
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 0.8, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        ]).start(() => {
          setTimeout(pulse, 3000); // Pulse every 3 seconds
        });
      };
      pulse();
    }
  }, [usageStats?.upgrade_recommended, pulseAnim]);

  const isFreeTier = !subscription || subscription.plan?.tier === 'free';
  const subscriptionTier = subscription?.plan?.tier || 'free';

  const getStatCards = (): StatCardData[] => {
    const baseCards: StatCardData[] = [];

    // Child-specific stats (if child data is provided)
    if (childData) {
      baseCards.push({
        id: 'activities',
        title: 'Activities',
        value: childData.completed_activities.toString(),
        subtitle: 'Completed',
        icon: 'figure.run',
        gradient: ['#10B981', '#059669']
      });

      baseCards.push({
        id: 'homework',
        title: 'Homework',
        value: childData.pending_homework.toString(),
        subtitle: 'Pending',
        icon: 'doc.text',
        gradient: ['#F59E0B', '#D97706']
      });

      baseCards.push({
        id: 'attendance',
        title: 'Attendance',
        value: `${childData.attendance_percentage}%`,
        subtitle: 'This Month',
        icon: 'checkmark.circle',
        gradient: ['#3B82F6', '#2563EB']
      });
    }

    // Usage-based stats
    if (usageStats) {
      // AI Lessons card
      baseCards.push({
        id: 'ai_lessons',
        title: 'AI Lessons',
        value: usageStats.ai_lessons_used_today.toString(),
        subtitle: usageStats.quotas.ai_lessons_per_day 
          ? `of ${usageStats.quotas.ai_lessons_per_day} today`
          : 'Unlimited',
        icon: 'brain.head.profile',
        gradient: ['#8B5CF6', '#7C3AED'],
        usageInfo: usageStats.quotas.ai_lessons_per_day ? {
          used: usageStats.ai_lessons_used_today,
          limit: usageStats.quotas.ai_lessons_per_day,
          feature: 'ai_lessons'
        } : undefined,
        isLocked: !usageStats.can_use_ai_lessons
      });

      // Homework AI card
      baseCards.push({
        id: 'homework_ai',
        title: 'Homework AI',
        value: usageStats.homework_graded_today.toString(),
        subtitle: usageStats.quotas.homework_grading_per_day
          ? `of ${usageStats.quotas.homework_grading_per_day} today`
          : 'Unlimited',
        icon: 'doc.text.below.ecg',
        gradient: ['#06B6D4', '#0891B2'],
        usageInfo: usageStats.quotas.homework_grading_per_day ? {
          used: usageStats.homework_graded_today,
          limit: usageStats.quotas.homework_grading_per_day,
          feature: 'homework_grading'
        } : undefined,
        isLocked: !usageStats.can_use_homework_grading
      });

      // AI Tutoring card (Premium feature)
      if (usageStats.quotas.ai_tutoring_sessions_per_day !== null || usageStats.can_access_premium_features) {
        baseCards.push({
          id: 'ai_tutoring',
          title: 'AI Tutoring',
          value: usageStats.ai_tutoring_sessions_today.toString(),
          subtitle: usageStats.quotas.ai_tutoring_sessions_per_day
            ? `of ${usageStats.quotas.ai_tutoring_sessions_per_day} today`
            : 'Unlimited',
          icon: 'person.2.badge.gearshape',
          gradient: ['#EC4899', '#DB2777'],
          usageInfo: usageStats.quotas.ai_tutoring_sessions_per_day ? {
            used: usageStats.ai_tutoring_sessions_today,
            limit: usageStats.quotas.ai_tutoring_sessions_per_day,
            feature: 'ai_tutoring'
          } : undefined,
          isPremium: true,
          isLocked: !usageStats.can_use_ai_tutoring
        });
      }

      // Premium Analytics card
      if (isFreeTier) {
        baseCards.push({
          id: 'premium_analytics',
          title: 'Analytics',
          value: '🔒',
          subtitle: 'Premium Only',
          icon: 'chart.bar.xaxis',
          gradient: ['#6B7280', '#4B5563'],
          isPremium: true,
          isLocked: true
        });
      } else if (usageStats.quotas.advanced_analytics) {
        baseCards.push({
          id: 'premium_analytics',
          title: 'Analytics',
          value: usageStats.premium_features_accessed_today.toString(),
          subtitle: 'Reports Viewed',
          icon: 'chart.bar.xaxis',
          gradient: ['#7C3AED', '#6D28D9'],
          isPremium: true
        });
      }
    }

    return baseCards;
  };

  const handleCardPress = async (card: StatCardData) => {
    if (card.isLocked && card.isPremium) {
      Alert.alert(
        'Premium Feature',
        `${card.title} requires a premium subscription. Would you like to upgrade?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Upgrade', onPress: () => onUpgradePress ? onUpgradePress() : router.push('/pricing') }
        ]
      );
      return;
    }

    if (card.isLocked) {
      const permission = await UsageTrackingService.canPerformAction(userId, card.usageInfo?.feature as any);
      if (!permission.allowed && permission.upgradeRequired) {
        Alert.alert(
          'Usage Limit Reached',
          permission.reason + '\n\nUpgrade for higher limits and unlimited features.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Upgrade', onPress: () => onUpgradePress ? onUpgradePress() : router.push('/pricing') }
          ]
        );
        return;
      }
    }

    // Navigate to relevant screen based on card type
    switch (card.id) {
      case 'activities':
        router.push('/(tabs)/activities');
        break;
      case 'homework':
        router.push('/screens/homework' as any);
        break;
      case 'ai_lessons':
        router.push('/screens/ai-lessons' as any);
        break;
      case 'homework_ai':
        router.push('/screens/homework-ai' as any);
        break;
      case 'ai_tutoring':
        router.push('/screens/ai-tutoring' as any);
        break;
      case 'premium_analytics':
        router.push('/screens/analytics' as any);
        break;
    }
  };

  const renderUsageBar = (usageInfo: { used: number; limit: number; feature: string }) => {
    const percentage = Math.min((usageInfo.used / usageInfo.limit) * 100, 100);
    const isNearLimit = percentage >= 80;
    const isAtLimit = percentage >= 100;

    return (
      <View style={styles.usageBarContainer}>
        <View style={[styles.usageBar, { backgroundColor: palette.surface }]}>
          <View 
            style={[
              styles.usageBarFill,
              {
                width: `${percentage}%`,
                backgroundColor: isAtLimit ? '#EF4444' : isNearLimit ? '#F59E0B' : '#10B981'
              }
            ]}
          />
        </View>
        {isNearLimit && (
          <View style={styles.warningIndicator}>
            <IconSymbol 
              name={isAtLimit ? "exclamationmark.triangle.fill" : "exclamationmark.circle"} 
              size={12} 
              color={isAtLimit ? '#EF4444' : '#F59E0B'} 
            />
          </View>
        )}
      </View>
    );
  };

  const renderStatCard = (card: StatCardData, index: number) => {
    const shouldPulse = card.isLocked && usageStats?.upgrade_recommended;
    
    return (
      <Animated.View
        key={card.id}
        style={[
          compact ? styles.compactCard : styles.statCard,
          shouldPulse && { transform: [{ scale: pulseAnim }] }
        ]}
      >
        <TouchableOpacity
          onPress={() => handleCardPress(card)}
          style={styles.cardTouchable}
          disabled={loading}
        >
          <LinearGradient
            colors={card.gradient}
            style={[compact ? styles.compactCardGradient : styles.cardGradient]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {/* Lock overlay for premium features */}
            {card.isLocked && (
              <View style={styles.lockOverlay}>
                <IconSymbol name="lock.fill" size={16} color="rgba(255,255,255,0.8)" />
              </View>
            )}

            {/* Premium badge */}
            {card.isPremium && !card.isLocked && (
              <View style={styles.premiumBadge}>
                <IconSymbol name="crown.fill" size={10} color="#FFD700" />
                <Text style={styles.premiumBadgeText}>PRO</Text>
              </View>
            )}

            {/* Card content */}
            <View style={styles.cardContent}>
              <View style={compact ? styles.compactCardHeader : styles.cardHeader}>
                <IconSymbol 
                  name={card.icon} 
                  size={compact ? 20 : 28} 
                  color="rgba(255,255,255,0.9)" 
                />
                {compact && (
                  <Text style={[styles.compactCardValue, { opacity: card.isLocked ? 0.6 : 1 }]}>
                    {card.value}
                  </Text>
                )}
              </View>

              {!compact && (
                <>
                  <Text style={[styles.cardValue, { opacity: card.isLocked ? 0.6 : 1 }]}>
                    {card.value}
                  </Text>
                  <Text style={styles.cardTitle}>{card.title}</Text>
                  <Text style={styles.cardSubtitle}>{card.subtitle}</Text>
                </>
              )}

              {compact && (
                <View style={styles.compactCardInfo}>
                  <Text style={styles.compactCardTitle}>{card.title}</Text>
                  <Text style={styles.compactCardSubtitle}>{card.subtitle}</Text>
                </View>
              )}

              {/* Usage progress bar */}
              {card.usageInfo && !compact && renderUsageBar(card.usageInfo)}
            </View>

            {/* Upgrade prompt for locked cards */}
            {card.isLocked && !compact && (
              <TouchableOpacity 
                style={styles.upgradePrompt}
                onPress={() => onUpgradePress ? onUpgradePress() : router.push('/pricing')}
              >
                <Text style={styles.upgradePromptText}>
                  {card.isPremium ? 'Upgrade to Unlock' : 'Increase Limits'}
                </Text>
                <IconSymbol name="arrow.up.right" size={12} color="#FFFFFF" />
              </TouchableOpacity>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={palette.primary} />
        <Text style={[styles.loadingText, { color: palette.textSecondary }]}>
          Loading usage stats...
        </Text>
      </View>
    );
  }

  const statCards = getStatCards();

  return (
    <View style={styles.container}>
      {/* Usage warnings banner */}
      {usageStats?.usage_warnings.length > 0 && !compact && (
        <View style={[styles.warningsBanner, { backgroundColor: palette.surface }]}>
          <IconSymbol name="exclamationmark.triangle.fill" size={16} color="#F59E0B" />
          <Text style={[styles.warningsText, { color: palette.text }]}>
            {usageStats.usage_warnings[0].message}
          </Text>
          {usageStats.upgrade_recommended && (
            <TouchableOpacity 
              style={styles.upgradeButton}
              onPress={() => onUpgradePress ? onUpgradePress() : router.push('/pricing')}
            >
              <Text style={styles.upgradeButtonText}>Upgrade</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Stats cards grid */}
      <View style={compact ? styles.compactGrid : styles.statsGrid}>
        {statCards.map((card, index) => renderStatCard(card, index))}
      </View>

      {/* Subscription tier indicator */}
      {!compact && (
        <View style={[styles.tierIndicator, { backgroundColor: palette.surface }]}>
          <View style={styles.tierInfo}>
            <IconSymbol 
              name={subscriptionTier === 'free' ? 'star' : subscriptionTier === 'enterprise' ? 'crown.fill' : 'star.fill'} 
              size={16} 
              color={subscriptionTier === 'free' ? '#6B7280' : '#8B5CF6'} 
            />
            <Text style={[styles.tierText, { color: palette.text }]}>
              {subscription?.plan?.name || 'Free Plan'}
            </Text>
          </View>
          {isFreeTier && (
            <TouchableOpacity 
              style={styles.tierUpgradeButton}
              onPress={() => onUpgradePress ? onUpgradePress() : router.push('/pricing')}
            >
              <Text style={styles.tierUpgradeText}>Upgrade</Text>
              <IconSymbol name="arrow.right" size={12} color="#8B5CF6" />
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },

  // Warnings banner
  warningsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  warningsText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
  },
  upgradeButton: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  upgradeButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },

  // Stats grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    gap: 12,
  },
  compactGrid: {
    paddingHorizontal: 20,
    gap: 8,
  },

  // Stat cards
  statCard: {
    width: (screenWidth - 64) / 2, // 2 columns with gaps
    aspectRatio: 1.2,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 12,
  },
  compactCard: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardTouchable: {
    flex: 1,
  },
  cardGradient: {
    flex: 1,
    padding: 16,
    position: 'relative',
  },
  compactCardGradient: {
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },

  // Card content
  cardContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  cardHeader: {
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  compactCardHeader: {
    flexDirection: 'column',
    alignItems: 'center',
    marginRight: 12,
    gap: 4,
  },
  cardValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  compactCardValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.95)',
    marginBottom: 2,
  },
  compactCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.95)',
  },
  cardSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 8,
  },
  compactCardSubtitle: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
  },
  compactCardInfo: {
    flex: 1,
  },

  // Usage bar
  usageBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  usageBar: {
    height: 4,
    flex: 1,
    borderRadius: 2,
    overflow: 'hidden',
  },
  usageBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  warningIndicator: {
    marginLeft: 6,
  },

  // Premium features
  premiumBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 2,
    zIndex: 1,
  },
  premiumBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFD700',
  },
  lockOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 1,
  },
  upgradePrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
    marginTop: 8,
  },
  upgradePromptText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Tier indicator
  tierIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginTop: 16,
    padding: 12,
    borderRadius: 12,
  },
  tierInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tierText: {
    fontSize: 14,
    fontWeight: '600',
  },
  tierUpgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tierUpgradeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8B5CF6',
  },
});

export default SubscriptionAwareStatsCards;
