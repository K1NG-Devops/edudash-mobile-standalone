// Enhanced Overage Billing Card Component
// Shows usage overages, costs, and payment options directly in the pricing page

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { DesignSystem } from '@/constants/DesignSystem';
import { overageBillingService } from '@/lib/services/overageBillingService';
import { payFastOveragePaymentService } from '@/lib/services/payfast/overagePaymentService';
import type { OverageBillingRecord, UsageQuota } from '@/lib/services/overageBillingService';
import { useAuth } from '@/contexts/SimpleWorkingAuth';
import { router } from 'expo-router';

interface OverageBillingCardProps {
  userId: string;
  compact?: boolean;
  showPayButton?: boolean;
  onPaymentStarted?: (paymentUrl: string) => void;
}

export const OverageBillingCard: React.FC<OverageBillingCardProps> = ({
  userId,
  compact = false,
  showPayButton = true,
  onPaymentStarted,
}) => {
  const { user } = useAuth();
  const [usageQuotas, setUsageQuotas] = useState<UsageQuota[]>([]);
  const [pendingBilling, setPendingBilling] = useState<OverageBillingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load usage status and pending billing
  useEffect(() => {
    loadOverageData();
  }, [userId]);

  const loadOverageData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Load current usage status
      const usageResult = await overageBillingService.getUserUsageStatus(userId);
      if (usageResult.error) {
        throw new Error(usageResult.error);
      }
      setUsageQuotas(usageResult.data || []);

      // Load pending billing records
      const billingResult = await overageBillingService.getPendingOverageBilling(userId);
      if (billingResult.error) {
        throw new Error(billingResult.error);
      }
      setPendingBilling(billingResult.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load overage data');
    } finally {
      setLoading(false);
    }
  };

  const handlePayOverages = async () => {
    if (!user) {
      Alert.alert('Authentication Required', 'Please sign in to pay for overages.');
      return;
    }

    setProcessingPayment(true);
    try {
      // Get user info for payment
      const userInfo = {
        firstName: user.user_metadata?.first_name || user.email?.split('@')[0] || 'User',
        lastName: user.user_metadata?.last_name || '',
        email: user.email || '',
      };

      // Generate and pay for current overages
      const result = await payFastOveragePaymentService.generateAndPayOverages(
        userId,
        userInfo
      );

      if (result.success && result.paymentUrl) {
        if (onPaymentStarted) {
          onPaymentStarted(result.paymentUrl);
        } else {
          // Redirect to PayFast
          if (typeof window !== 'undefined') {
            window.location.href = result.paymentUrl;
          }
        }
      } else {
        Alert.alert(
          'Payment Error',
          result.error || 'Failed to initiate overage payment'
        );
      }
    } catch (error) {
      Alert.alert(
        'Error',
        'An unexpected error occurred while processing payment'
      );
    } finally {
      setProcessingPayment(false);
    }
  };

  // Calculate total overage cost
  const totalOverageCost = usageQuotas.reduce((sum, quota) => {
    return sum + (quota.overageAmount * quota.unitPrice);
  }, 0);

  const hasOverages = usageQuotas.some(quota => quota.overageAmount > 0);
  const hasPendingBilling = pendingBilling.length > 0;

  if (loading) {
    return (
      <View style={[styles.container, compact && styles.containerCompact]}>
        <ActivityIndicator size="small" color={DesignSystem.colors.primary} />
        <Text style={styles.loadingText}>Loading usage data...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.errorContainer, compact && styles.containerCompact]}>
        <IconSymbol name="exclamationmark.triangle" size={20} color="#ef4444" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadOverageData}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!hasOverages && !hasPendingBilling) {
    return null; // No overages to display
  }

  return (
    <View style={[styles.container, compact && styles.containerCompact]}>
      <LinearGradient
        colors={['rgba(239, 68, 68, 0.1)', 'rgba(239, 68, 68, 0.05)']}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <IconSymbol name="exclamationmark.triangle.fill" size={24} color="#ef4444" />
          <View style={styles.headerText}>
            <Text style={styles.title}>Usage Overages</Text>
            <Text style={styles.subtitle}>
              {hasOverages ? 'You have exceeded your plan limits' : 'Pending payment required'}
            </Text>
          </View>
        </View>

        {/* Usage Details */}
        {hasOverages && (
          <View style={styles.usageDetails}>
            {usageQuotas
              .filter(quota => quota.overageAmount > 0)
              .map((quota, index) => (
                <View key={quota.quotaType} style={styles.usageItem}>
                  <View style={styles.usageInfo}>
                    <Text style={styles.quotaType}>
                      {quota.quotaType.replace(/([A-Z])/g, ' $1').toLowerCase()}
                    </Text>
                    <Text style={styles.usageNumbers}>
                      {quota.currentUsage} / {quota.quotaLimit} (+ {quota.overageAmount} over)
                    </Text>
                  </View>
                  <Text style={styles.overageCost}>
                    R{(quota.overageAmount * quota.unitPrice).toFixed(2)}
                  </Text>
                </View>
              ))}
          </View>
        )}

        {/* Pending Billing */}
        {hasPendingBilling && (
          <View style={styles.pendingBilling}>
            <Text style={styles.pendingTitle}>Pending Payment</Text>
            {pendingBilling.map((record, index) => (
              <View key={record.id} style={styles.billingItem}>
                <Text style={styles.billingDescription}>
                  {record.quotaType} overage ({record.overageUnits} units)
                </Text>
                <Text style={styles.billingAmount}>
                  R{record.totalAmount.toFixed(2)}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Total and Actions */}
        <View style={styles.footer}>
          <View style={styles.totalSection}>
            <Text style={styles.totalLabel}>Total Due:</Text>
            <Text style={styles.totalAmount}>
              R{(totalOverageCost + pendingBilling.reduce((sum, r) => sum + r.totalAmount, 0)).toFixed(2)}
            </Text>
          </View>

          {showPayButton && (
            <View style={styles.actions}>
              <TouchableOpacity
                style={[
                  styles.payButton,
                  processingPayment && styles.payButtonDisabled,
                  Platform.OS === 'web' ? ({ cursor: processingPayment ? 'not-allowed' : 'pointer' } as any) : undefined
                ]}
                onPress={handlePayOverages}
                disabled={processingPayment}
              >
                {processingPayment ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <>
                    <IconSymbol name="creditcard" size={16} color="#ffffff" />
                    <Text style={styles.payButtonText}>Pay Now</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.upgradeButton}
                onPress={() => router.push('/pricing')}
              >
                <Text style={styles.upgradeButtonText}>Upgrade Plan</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Info */}
        <View style={styles.info}>
          <IconSymbol name="info.circle" size={14} color="#6b7280" />
          <Text style={styles.infoText}>
            Overages are charged at the end of each billing period. 
            Upgrade your plan to avoid future overage charges.
          </Text>
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: DesignSystem.spacing.md,
    marginHorizontal: DesignSystem.spacing.lg,
    borderRadius: DesignSystem.borderRadius.lg,
    overflow: 'hidden',
  },
  containerCompact: {
    marginVertical: DesignSystem.spacing.sm,
    marginHorizontal: DesignSystem.spacing.md,
  },
  gradient: {
    padding: DesignSystem.spacing.lg,
  },
  errorContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: DesignSystem.spacing.lg,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: DesignSystem.colors.text.secondary,
    marginTop: DesignSystem.spacing.sm,
  },
  errorText: {
    fontSize: 14,
    color: '#ef4444',
    textAlign: 'center',
    marginVertical: DesignSystem.spacing.sm,
  },
  retryButton: {
    backgroundColor: DesignSystem.colors.primary,
    paddingHorizontal: DesignSystem.spacing.md,
    paddingVertical: DesignSystem.spacing.sm,
    borderRadius: DesignSystem.borderRadius.md,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: DesignSystem.spacing.lg,
  },
  headerText: {
    marginLeft: DesignSystem.spacing.md,
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: DesignSystem.colors.text.primary,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    color: DesignSystem.colors.text.secondary,
  },

  // Usage Details
  usageDetails: {
    marginBottom: DesignSystem.spacing.lg,
  },
  usageItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: DesignSystem.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  usageInfo: {
    flex: 1,
  },
  quotaType: {
    fontSize: 14,
    fontWeight: '600',
    color: DesignSystem.colors.text.primary,
    textTransform: 'capitalize',
  },
  usageNumbers: {
    fontSize: 12,
    color: DesignSystem.colors.text.secondary,
    marginTop: 2,
  },
  overageCost: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ef4444',
  },

  // Pending Billing
  pendingBilling: {
    marginBottom: DesignSystem.spacing.lg,
  },
  pendingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: DesignSystem.colors.text.primary,
    marginBottom: DesignSystem.spacing.sm,
  },
  billingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: DesignSystem.spacing.sm,
  },
  billingDescription: {
    fontSize: 14,
    color: DesignSystem.colors.text.secondary,
    flex: 1,
  },
  billingAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ef4444',
  },

  // Footer
  footer: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    paddingTop: DesignSystem.spacing.md,
    marginBottom: DesignSystem.spacing.md,
  },
  totalSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: DesignSystem.spacing.md,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: DesignSystem.colors.text.primary,
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ef4444',
  },

  // Actions
  actions: {
    flexDirection: 'row',
    gap: DesignSystem.spacing.md,
  },
  payButton: {
    flex: 2,
    backgroundColor: DesignSystem.colors.primary,
    paddingVertical: DesignSystem.spacing.md,
    paddingHorizontal: DesignSystem.spacing.lg,
    borderRadius: DesignSystem.borderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: DesignSystem.spacing.sm,
  },
  payButtonDisabled: {
    backgroundColor: 'rgba(0, 128, 255, 0.5)',
  },
  payButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  upgradeButton: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingVertical: DesignSystem.spacing.md,
    paddingHorizontal: DesignSystem.spacing.lg,
    borderRadius: DesignSystem.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  upgradeButtonText: {
    color: DesignSystem.colors.text.primary,
    fontSize: 14,
    fontWeight: '600',
  },

  // Info
  info: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: DesignSystem.spacing.sm,
    paddingTop: DesignSystem.spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  infoText: {
    fontSize: 12,
    color: '#6b7280',
    lineHeight: 16,
    flex: 1,
  },
});

export default OverageBillingCard;
