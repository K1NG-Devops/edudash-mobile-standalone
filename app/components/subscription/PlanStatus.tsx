import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { SubscriptionTier, SubscriptionData } from '@/contexts/SubscriptionContext';
import { router } from 'expo-router';

interface PlanStatusProps {
  subscription: SubscriptionData | null;
  loading?: boolean;
  compact?: boolean;
}

const getPlanConfig = (tier: SubscriptionTier) => {
  switch (tier) {
    case 'free':
      return {
        name: 'Free Plan',
        color: '#6B7280',
        bgColor: '#F3F4F6',
        icon: 'person.crop.circle',
        description: 'Basic features',
        actionText: 'Upgrade',
        actionColor: '#3B82F6',
      };
    case 'premium':
      return {
        name: 'Premium Plan',
        color: '#8B5CF6',
        bgColor: '#F3E8FF',
        icon: 'star.circle.fill',
        description: 'All features',
        actionText: 'Manage',
        actionColor: '#8B5CF6',
      };
    case 'enterprise':
      return {
        name: 'Enterprise Plan',
        color: '#059669',
        bgColor: '#D1FAE5',
        icon: 'building.2',
        description: 'Enterprise features',
        actionText: 'Manage',
        actionColor: '#059669',
      };
    default:
      return {
        name: 'Unknown Plan',
        color: '#6B7280',
        bgColor: '#F3F4F6',
        icon: 'questionmark.circle',
        description: 'Plan details unavailable',
        actionText: 'Check',
        actionColor: '#6B7280',
      };
  }
};

export const PlanStatus: React.FC<PlanStatusProps> = ({ 
  subscription, 
  loading = false, 
  compact = false 
}) => {
  if (loading) {
    return (
      <View style={[styles.container, compact && styles.compactContainer]}>
        <View style={[styles.planBadge, { backgroundColor: '#F3F4F6' }]}>
          <Text style={[styles.planText, { color: '#6B7280' }]}>Loading...</Text>
        </View>
      </View>
    );
  }

  if (!subscription) {
    return (
      <View style={[styles.container, compact && styles.compactContainer]}>
        <View style={[styles.planBadge, { backgroundColor: '#FEE2E2' }]}>
          <IconSymbol name="exclamationmark.circle" size={16} color="#DC2626" />
          <Text style={[styles.planText, { color: '#DC2626', marginLeft: 4 }]}>
            No Plan
          </Text>
        </View>
      </View>
    );
  }

  const config = getPlanConfig(subscription.tier);
  const isExpiringSoon = subscription.expiresAt && 
    new Date(subscription.expiresAt).getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000; // 7 days

  const handlePlanAction = () => {
    if (subscription.tier === 'free') {
      router.push('/screens/subscription/upgrade' as any);
    } else {
      router.push('/screens/subscription/manage' as any);
    }
  };

  if (compact) {
    return (
      <TouchableOpacity 
        style={[styles.compactContainer, { backgroundColor: config.bgColor }]} 
        onPress={handlePlanAction}
      >
        <IconSymbol name={config.icon as any} size={16} color={config.color} />
        <Text style={[styles.compactText, { color: config.color }]}>
          {subscription.tier === 'free' ? 'Free' : subscription.tier.charAt(0).toUpperCase() + subscription.tier.slice(1)}
        </Text>
        {subscription.tier === 'free' && (
          <IconSymbol name="arrow.up.circle" size={12} color={config.actionColor} style={{ marginLeft: 2 }} />
        )}
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.planCard, { borderColor: config.color }]}>
        <View style={styles.planHeader}>
          <View style={styles.planInfo}>
            <View style={[styles.planIcon, { backgroundColor: config.bgColor }]}>
              <IconSymbol name={config.icon as any} size={20} color={config.color} />
            </View>
            <View style={styles.planDetails}>
              <Text style={styles.planName}>{config.name}</Text>
              <Text style={styles.planDescription}>{config.description}</Text>
              {subscription.expiresAt && (
                <Text style={[
                  styles.planExpiry,
                  isExpiringSoon && styles.planExpiryWarning
                ]}>
                  {isExpiringSoon ? 'Expires soon' : 'Active'}
                </Text>
              )}
            </View>
          </View>
          <TouchableOpacity 
            style={[styles.actionButton, { borderColor: config.actionColor }]}
            onPress={handlePlanAction}
          >
            <Text style={[styles.actionButtonText, { color: config.actionColor }]}>
              {config.actionText}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  compactText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  planBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  planText: {
    fontSize: 12,
    fontWeight: '600',
  },
  planCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  planInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  planIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  planDetails: {
    flex: 1,
  },
  planName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  planDescription: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  planExpiry: {
    fontSize: 11,
    color: '#10B981',
    marginTop: 2,
  },
  planExpiryWarning: {
    color: '#F59E0B',
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
