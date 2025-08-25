import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { DesignSystem } from '@/constants/DesignSystem';
import { useSubscription } from '@/lib/hooks/useSubscription';
import { PlatformSubscription } from '@/lib/services/subscriptionService';

interface SubscriptionStatusCardProps {
  subscription: PlatformSubscription | null;
  showManageButton?: boolean;
  embedded?: boolean;
  onUpgrade?: () => void;
}

export const SubscriptionStatusCard: React.FC<SubscriptionStatusCardProps> = ({
  subscription,
  showManageButton = true,
  embedded = false,
  onUpgrade
}) => {
  const { 
    isSubscriptionActive, 
    isTrialActive, 
    getDaysUntilExpiry, 
    cancelSubscription, 
    refreshSubscription,
    loading 
  } = useSubscription();
  
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [canceling, setCanceling] = useState(false);

  if (!subscription) {
    return (
      <View style={[styles.card, embedded && styles.embeddedCard]}>
        <LinearGradient
          colors={DesignSystem.gradients.primarySubtle}
          style={styles.cardGradient}
        >
          <View style={styles.noSubscriptionContent}>
            <IconSymbol name="star.circle" size={48} color="#00f5ff" />
            <Text style={styles.noSubscriptionTitle}>No Active Subscription</Text>
            <Text style={styles.noSubscriptionText}>
              Subscribe to unlock AI-powered learning features
            </Text>
            <TouchableOpacity 
              style={styles.upgradeButton}
              onPress={() => router.push('/pricing')}
            >
              <LinearGradient
                colors={DesignSystem.gradients.primary}
                style={styles.upgradeButtonGradient}
              >
                <Text style={styles.upgradeButtonText}>View Plans</Text>
                <IconSymbol name="arrow.right" size={16} color="#000000" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>
    );
  }

  const daysUntilExpiry = getDaysUntilExpiry();
  const isActive = isSubscriptionActive();
  const isTrial = isTrialActive();

  const getStatusColor = () => {
    switch (subscription.status) {
      case 'active': return '#10b981';
      case 'trial': return '#f59e0b';
      case 'past_due': return '#ef4444';
      case 'canceled': return '#6b7280';
      case 'expired': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const getStatusText = () => {
    switch (subscription.status) {
      case 'active': return 'Active';
      case 'trial': return 'Free Trial';
      case 'past_due': return 'Past Due';
      case 'canceled': return 'Canceled';
      case 'expired': return 'Expired';
      default: return subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1);
    }
  };

  const getStatusIcon = () => {
    switch (subscription.status) {
      case 'active': return 'checkmark.circle.fill';
      case 'trial': return 'clock.fill';
      case 'past_due': return 'exclamationmark.triangle.fill';
      case 'canceled': return 'xmark.circle.fill';
      case 'expired': return 'xmark.circle.fill';
      default: return 'info.circle.fill';
    }
  };

  const handleCancelSubscription = async () => {
    setCanceling(true);
    try {
      const success = await cancelSubscription();
      if (success) {
        Alert.alert('Success', 'Your subscription has been canceled');
        setShowCancelModal(false);
      } else {
        Alert.alert('Error', 'Failed to cancel subscription. Please contact support.');
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setCanceling(false);
    }
  };

  const handleManageSubscription = () => {
    Alert.alert(
      'Manage Subscription',
      'Choose an action',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'View Payment History', onPress: () => router.push('/(dashboard)/account/billing') },
        { text: 'Change Plan', onPress: () => router.push('/pricing') },
        ...(subscription.status === 'active' ? [
          { text: 'Cancel Subscription', style: 'destructive', onPress: () => setShowCancelModal(true) }
        ] : []),
      ]
    );
  };

  const CancelConfirmationModal = () => (
    <Modal
      visible={showCancelModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowCancelModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <LinearGradient
            colors={DesignSystem.gradients.hero}
            style={styles.modalGradient}
          >
            <View style={styles.modalHeader}>
              <IconSymbol name="exclamationmark.triangle.fill" size={40} color="#ef4444" />
              <Text style={styles.modalTitle}>Cancel Subscription</Text>
            </View>

            <Text style={styles.modalMessage}>
              Are you sure you want to cancel your {subscription.plan?.name || 'subscription'}? 
              You'll lose access to premium features at the end of your current billing period.
            </Text>

            <View style={styles.modalFeatures}>
              <Text style={styles.modalFeaturesTitle}>You'll lose access to:</Text>
              <View style={styles.featuresList}>
                <Text style={styles.featureItem}>• AI-powered lesson generation</Text>
                <Text style={styles.featureItem}>• Advanced analytics</Text>
                <Text style={styles.featureItem}>• Priority support</Text>
                <Text style={styles.featureItem}>• All premium features</Text>
              </View>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalKeepButton}
                onPress={() => setShowCancelModal(false)}
              >
                <LinearGradient
                  colors={DesignSystem.gradients.primary}
                  style={styles.modalButtonGradient}
                >
                  <Text style={styles.modalKeepButtonText}>Keep Subscription</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={handleCancelSubscription}
                disabled={canceling}
              >
                {canceling ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.modalCancelButtonText}>Cancel Anyway</Text>
                )}
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );

  return (
    <>
      <View style={[styles.card, embedded && styles.embeddedCard]}>
        <LinearGradient
          colors={isActive 
            ? DesignSystem.gradients.secondary 
            : DesignSystem.gradients.primarySubtle
          }
          style={styles.cardGradient}
        >
          {/* Status Header */}
          <View style={styles.statusHeader}>
            <View style={styles.statusInfo}>
              <View style={styles.statusBadge}>
                <IconSymbol 
                  name={getStatusIcon()} 
                  size={16} 
                  color={getStatusColor()} 
                />
                <Text style={[styles.statusText, { color: getStatusColor() }]}>
                  {getStatusText()}
                </Text>
              </View>
              <Text style={styles.planName}>
                {subscription.plan?.name || 'Unknown Plan'}
              </Text>
            </View>

            {showManageButton && (
              <TouchableOpacity
                style={styles.manageButton}
                onPress={handleManageSubscription}
              >
                <IconSymbol name="gear" size={20} color="#ffffff" />
              </TouchableOpacity>
            )}
          </View>

          {/* Subscription Details */}
          <View style={styles.detailsContainer}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Amount:</Text>
              <Text style={styles.detailValue}>
                R{subscription.amount}/{subscription.billing_interval === 'monthly' ? 'month' : 'year'}
              </Text>
            </View>

            {isTrial && daysUntilExpiry !== null && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Trial ends:</Text>
                <Text style={[styles.detailValue, { color: '#f59e0b' }]}>
                  {daysUntilExpiry > 0 ? `${daysUntilExpiry} days` : 'Today'}
                </Text>
              </View>
            )}

            {!isTrial && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Next billing:</Text>
                <Text style={styles.detailValue}>
                  {new Date(subscription.current_period_end).toLocaleDateString()}
                </Text>
              </View>
            )}

            {subscription.canceled_at && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Canceled on:</Text>
                <Text style={styles.detailValue}>
                  {new Date(subscription.canceled_at).toLocaleDateString()}
                </Text>
              </View>
            )}
          </View>

          {/* Action Buttons */}
          {isActive && (
            <View style={styles.actionsContainer}>
              {isTrial && (
                <TouchableOpacity
                  style={styles.upgradeButton}
                  onPress={onUpgrade || (() => router.push('/pricing'))}
                >
                  <LinearGradient
                    colors={DesignSystem.gradients.primary}
                    style={styles.upgradeButtonGradient}
                  >
                    <Text style={styles.upgradeButtonText}>Upgrade Now</Text>
                    <IconSymbol name="arrow.up.right" size={16} color="#000000" />
                  </LinearGradient>
                </TouchableOpacity>
              )}

              {!embedded && (
                <TouchableOpacity
                  style={styles.viewHistoryButton}
                  onPress={() => router.push('/(dashboard)/account/billing')}
                >
                  <Text style={styles.viewHistoryButtonText}>View Billing History</Text>
                  <IconSymbol name="arrow.right" size={14} color="#00f5ff" />
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Trial Warning */}
          {isTrial && daysUntilExpiry !== null && daysUntilExpiry <= 3 && (
            <View style={styles.warningContainer}>
              <LinearGradient
                colors={['rgba(245,158,11,0.2)', 'rgba(245,158,11,0.1)']}
                style={styles.warningGradient}
              >
                <IconSymbol name="exclamationmark.triangle.fill" size={16} color="#f59e0b" />
                <Text style={styles.warningText}>
                  Your trial expires in {daysUntilExpiry} day{daysUntilExpiry !== 1 ? 's' : ''}. 
                  Upgrade to continue using premium features.
                </Text>
              </LinearGradient>
            </View>
          )}

          {/* Past Due Warning */}
          {subscription.status === 'past_due' && (
            <View style={styles.warningContainer}>
              <LinearGradient
                colors={['rgba(239,68,68,0.2)', 'rgba(239,68,68,0.1)']}
                style={styles.warningGradient}
              >
                <IconSymbol name="exclamationmark.triangle.fill" size={16} color="#ef4444" />
                <Text style={styles.warningText}>
                  Your payment is overdue. Please update your payment method to continue.
                </Text>
              </LinearGradient>
            </View>
          )}
        </LinearGradient>
      </View>

      <CancelConfirmationModal />
    </>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: DesignSystem.borderRadius.xl,
    overflow: 'hidden',
    marginVertical: DesignSystem.spacing.md,
  },
  embeddedCard: {
    marginVertical: DesignSystem.spacing.sm,
  },
  cardGradient: {
    padding: DesignSystem.spacing.lg,
  },

  // No Subscription State
  noSubscriptionContent: {
    alignItems: 'center',
    paddingVertical: DesignSystem.spacing.lg,
  },
  noSubscriptionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginTop: DesignSystem.spacing.sm,
    marginBottom: DesignSystem.spacing.xs,
  },
  noSubscriptionText: {
    fontSize: 14,
    color: '#cccccc',
    textAlign: 'center',
    marginBottom: DesignSystem.spacing.lg,
  },

  // Status Header
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: DesignSystem.spacing.md,
  },
  statusInfo: {
    flex: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: DesignSystem.spacing.sm,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
    textTransform: 'uppercase',
  },
  planName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
  },
  manageButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    padding: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },

  // Details
  detailsContainer: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: DesignSystem.spacing.md,
    marginBottom: DesignSystem.spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  detailLabel: {
    fontSize: 14,
    color: '#cccccc',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '600',
  },

  // Actions
  actionsContainer: {
    gap: DesignSystem.spacing.sm,
  },
  upgradeButton: {
    borderRadius: DesignSystem.borderRadius.lg,
    overflow: 'hidden',
  },
  upgradeButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    gap: 8,
  },
  upgradeButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
  },
  viewHistoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 6,
  },
  viewHistoryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#00f5ff',
  },

  // Warning
  warningContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: DesignSystem.spacing.sm,
  },
  warningGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: DesignSystem.spacing.md,
    gap: 12,
  },
  warningText: {
    flex: 1,
    fontSize: 12,
    color: '#ffffff',
    lineHeight: 18,
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
    borderRadius: DesignSystem.borderRadius.xl,
    overflow: 'hidden',
  },
  modalGradient: {
    padding: 24,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    marginTop: 8,
  },
  modalMessage: {
    fontSize: 16,
    color: '#cccccc',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  modalFeatures: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  modalFeaturesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
  },
  featuresList: {
    gap: 4,
  },
  featureItem: {
    fontSize: 12,
    color: '#cccccc',
  },
  modalButtons: {
    gap: 12,
  },
  modalKeepButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalButtonGradient: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  modalKeepButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
  },
  modalCancelButton: {
    backgroundColor: 'rgba(239,68,68,0.2)',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
  },
  modalCancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ef4444',
  },
});
