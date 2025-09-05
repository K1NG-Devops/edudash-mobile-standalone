import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ActivityIndicator,
  Animated,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { DesignSystem } from '@/constants/DesignSystem';
import { useOverageTracking, OverageStatus, QuotaLimits } from '@/hooks/useOverageTracking';

interface UsageWarningBannerProps {
  quotaType: keyof QuotaLimits;
  overageStatus: OverageStatus;
  onDismiss?: () => void;
  onUpgrade?: () => void;
  compact?: boolean;
}

export const UsageWarningBanner: React.FC<UsageWarningBannerProps> = ({
  quotaType,
  overageStatus,
  onDismiss,
  onUpgrade,
  compact = false,
}) => {
  if (!overageStatus.isAtLimit && overageStatus.percentageUsed < overageStatus.warningThreshold) {
    return null;
  }

  const getWarningColor = () => {
    if (overageStatus.isOverLimit) return '#ef4444'; // Red
    if (overageStatus.percentageUsed >= 90) return '#f59e0b'; // Orange
    return '#10b981'; // Green
  };

  const getWarningIcon = () => {
    if (overageStatus.isOverLimit) return 'exclamationmark.triangle.fill';
    if (overageStatus.percentageUsed >= 90) return 'exclamationmark.circle.fill';
    return 'info.circle.fill';
  };

  const getWarningMessage = () => {
    const quotaName = quotaType.replace(/([A-Z])/g, ' $1').toLowerCase();
    
    if (overageStatus.isOverLimit) {
      return `You've exceeded your ${quotaName} limit. Upgrade to continue.`;
    }
    
    if (overageStatus.percentageUsed >= 90) {
      return `You're at ${Math.round(overageStatus.percentageUsed)}% of your ${quotaName} quota.`;
    }
    
    return `You're using ${Math.round(overageStatus.percentageUsed)}% of your ${quotaName} quota.`;
  };

  return (
    <View style={[styles.warningBanner, compact && styles.warningBannerCompact]}>
      <LinearGradient
        colors={[
          `${getWarningColor()}20`,
          `${getWarningColor()}10`,
        ]}
        style={styles.warningGradient}
      >
        <View style={styles.warningContent}>
          <IconSymbol
            name={getWarningIcon()}
            size={compact ? 16 : 20}
            color={getWarningColor()}
          />
          
          <View style={styles.warningText}>
            <Text style={[styles.warningMessage, compact && styles.warningMessageCompact]}>
              {getWarningMessage()}
            </Text>
            
            {!compact && overageStatus.remainingQuota > 0 && (
              <Text style={styles.remainingText}>
                {overageStatus.remainingQuota === -1 
                  ? 'Unlimited remaining' 
                  : `${overageStatus.remainingQuota} remaining`}
              </Text>
            )}
          </View>
          
          <View style={styles.warningActions}>
            {overageStatus.suggestedUpgrade && (
              <TouchableOpacity
                style={styles.upgradeButton}
                onPress={onUpgrade || (() => router.push('/pricing'))}
              >
                <Text style={styles.upgradeButtonText}>Upgrade</Text>
              </TouchableOpacity>
            )}
            
            {onDismiss && (
              <TouchableOpacity
                style={styles.dismissButton}
                onPress={onDismiss}
              >
                <IconSymbol name="xmark" size={14} color="#9ca3af" />
              </TouchableOpacity>
            )}
          </View>
        </View>
        
        {/* Progress bar */}
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill,
              { 
                width: `${Math.min(100, overageStatus.percentageUsed)}%`,
                backgroundColor: getWarningColor(),
              }
            ]} 
          />
        </View>
      </LinearGradient>
    </View>
  );
};

interface QuotaBlockerModalProps {
  visible: boolean;
  quotaType: keyof QuotaLimits;
  overageStatus: OverageStatus;
  onClose: () => void;
  onUpgrade?: () => void;
  actionTitle?: string;
}

export const QuotaBlockerModal: React.FC<QuotaBlockerModalProps> = ({
  visible,
  quotaType,
  overageStatus,
  onClose,
  onUpgrade,
  actionTitle = 'Continue',
}) => {
  const [isUpgrading, setIsUpgrading] = useState(false);

  const quotaName = quotaType.replace(/([A-Z])/g, ' $1').toLowerCase();

  const handleUpgrade = async () => {
    setIsUpgrading(true);
    try {
      if (onUpgrade) {
        await onUpgrade();
      } else {
        router.push('/pricing');
      }
    } finally {
      setIsUpgrading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.quotaBlockerContent}>
          <LinearGradient colors={DesignSystem.gradients.hero} style={styles.quotaBlockerGradient}>
            <TouchableOpacity 
              style={styles.modalCloseButton}
              onPress={onClose}
            >
              <IconSymbol name="xmark" size={24} color="#ffffff" />
            </TouchableOpacity>
            
            <View style={styles.quotaBlockerIcon}>
              <IconSymbol name="exclamationmark.triangle.fill" size={48} color="#f59e0b" />
            </View>
            
            <Text style={styles.quotaBlockerTitle}>
              {quotaName.charAt(0).toUpperCase() + quotaName.slice(1)} Limit Reached
            </Text>
            
            <Text style={styles.quotaBlockerMessage}>
              You've reached your {quotaName} limit for this month. 
              Upgrade your plan to continue using this feature.
            </Text>
            
            <View style={styles.quotaBlockerStats}>
              <View style={styles.quotaBlockerStat}>
                <Text style={styles.quotaBlockerStatNumber}>
                  {overageStatus.remainingQuota === -1 ? '∞' : '0'}
                </Text>
                <Text style={styles.quotaBlockerStatLabel}>Remaining</Text>
              </View>
              
              <View style={styles.quotaBlockerStat}>
                <Text style={styles.quotaBlockerStatNumber}>
                  {Math.round(overageStatus.percentageUsed)}%
                </Text>
                <Text style={styles.quotaBlockerStatLabel}>Used</Text>
              </View>
              
              <View style={styles.quotaBlockerStat}>
                <Text style={styles.quotaBlockerStatNumber}>
                  {Math.ceil((overageStatus.nextResetDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))}
                </Text>
                <Text style={styles.quotaBlockerStatLabel}>Days to Reset</Text>
              </View>
            </View>
            
            <View style={styles.quotaBlockerActions}>
              <TouchableOpacity 
                style={styles.quotaUpgradeButton}
                onPress={handleUpgrade}
                disabled={isUpgrading}
              >
                <LinearGradient
                  colors={DesignSystem.gradients.primary}
                  style={styles.quotaUpgradeGradient}
                >
                  {isUpgrading ? (
                    <ActivityIndicator size="small" color="#000000" />
                  ) : (
                    <>
                      <IconSymbol name="arrow.up.circle.fill" size={20} color="#000000" />
                      <Text style={styles.quotaUpgradeText}>
                        {overageStatus.suggestedUpgrade 
                          ? `Upgrade to ${overageStatus.suggestedUpgrade}` 
                          : 'View Plans'}
                      </Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.quotaLaterButton}
                onPress={onClose}
              >
                <Text style={styles.quotaLaterText}>Maybe Later</Text>
              </TouchableOpacity>
            </View>
            
            <Text style={styles.quotaBlockerNote}>
              Your quota will reset on {overageStatus.nextResetDate.toLocaleDateString()}
            </Text>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
};

interface UsageProgressIndicatorProps {
  quotaType: keyof QuotaLimits;
  overageStatus: OverageStatus;
  showLabel?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export const UsageProgressIndicator: React.FC<UsageProgressIndicatorProps> = ({
  quotaType,
  overageStatus,
  showLabel = true,
  size = 'medium',
}) => {
  const getProgressColor = () => {
    if (overageStatus.isOverLimit) return '#ef4444';
    if (overageStatus.percentageUsed >= 90) return '#f59e0b';
    if (overageStatus.percentageUsed >= 75) return '#eab308';
    return '#10b981';
  };

  const sizeStyles = {
    small: { height: 4, borderRadius: 2 },
    medium: { height: 6, borderRadius: 3 },
    large: { height: 8, borderRadius: 4 },
  };

  const quotaName = quotaType.replace(/([A-Z])/g, ' $1').toLowerCase();

  return (
    <View style={styles.usageIndicator}>
      {showLabel && (
        <View style={styles.usageLabel}>
          <Text style={styles.usageLabelText}>
            {quotaName.charAt(0).toUpperCase() + quotaName.slice(1)}
          </Text>
          <Text style={styles.usagePercentage}>
            {overageStatus.remainingQuota === -1 
              ? 'Unlimited' 
              : `${Math.round(overageStatus.percentageUsed)}%`}
          </Text>
        </View>
      )}
      
      <View style={[styles.progressContainer, sizeStyles[size]]}>
        <View 
          style={[
            styles.progressIndicatorFill,
            {
              width: `${Math.min(100, overageStatus.percentageUsed)}%`,
              backgroundColor: getProgressColor(),
            },
            sizeStyles[size],
          ]} 
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  // Warning Banner Styles
  warningBanner: {
    marginVertical: DesignSystem.spacing.sm,
    marginHorizontal: DesignSystem.spacing.md,
    borderRadius: DesignSystem.borderRadius.lg,
    overflow: 'hidden',
  },
  warningBannerCompact: {
    marginVertical: DesignSystem.spacing.xs,
    marginHorizontal: DesignSystem.spacing.sm,
  },
  warningGradient: {
    padding: DesignSystem.spacing.md,
  },
  warningContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: DesignSystem.spacing.xs,
  },
  warningText: {
    flex: 1,
    marginHorizontal: DesignSystem.spacing.sm,
  },
  warningMessage: {
    fontSize: 14,
    fontWeight: '600',
    color: DesignSystem.colors.text.primary,
    marginBottom: 2,
  },
  warningMessageCompact: {
    fontSize: 12,
    marginBottom: 0,
  },
  remainingText: {
    fontSize: 12,
    color: DesignSystem.colors.text.secondary,
  },
  warningActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignSystem.spacing.xs,
  },
  upgradeButton: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  upgradeButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10b981',
  },
  dismissButton: {
    padding: 4,
  },
  progressBar: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 1.5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 1.5,
  },

  // Quota Blocker Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  quotaBlockerContent: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    borderRadius: DesignSystem.borderRadius.xxl,
    overflow: 'hidden',
  },
  quotaBlockerGradient: {
    padding: 30,
    alignItems: 'center',
    position: 'relative',
  },
  modalCloseButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    zIndex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 15,
    padding: 8,
  },
  quotaBlockerIcon: {
    marginBottom: 20,
  },
  quotaBlockerTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 12,
  },
  quotaBlockerMessage: {
    fontSize: 16,
    color: '#cccccc',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 25,
  },
  quotaBlockerStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 30,
  },
  quotaBlockerStat: {
    alignItems: 'center',
  },
  quotaBlockerStatNumber: {
    fontSize: 24,
    fontWeight: '900',
    color: '#00f5ff',
    marginBottom: 4,
  },
  quotaBlockerStatLabel: {
    fontSize: 12,
    color: '#9ca3af',
    fontWeight: '600',
  },
  quotaBlockerActions: {
    width: '100%',
    gap: 15,
    marginBottom: 20,
  },
  quotaUpgradeButton: {
    borderRadius: DesignSystem.borderRadius.lg,
    overflow: 'hidden',
  },
  quotaUpgradeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 8,
  },
  quotaUpgradeText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
  },
  quotaLaterButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  quotaLaterText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#9ca3af',
  },
  quotaBlockerNote: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    fontStyle: 'italic',
  },

  // Usage Progress Indicator Styles
  usageIndicator: {
    marginVertical: DesignSystem.spacing.xs,
  },
  usageLabel: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: DesignSystem.spacing.xs,
  },
  usageLabelText: {
    fontSize: 14,
    fontWeight: '600',
    color: DesignSystem.colors.text.primary,
  },
  usagePercentage: {
    fontSize: 12,
    fontWeight: '600',
    color: DesignSystem.colors.text.quantum,
  },
  progressContainer: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  progressIndicatorFill: {
    height: '100%',
  },
});
