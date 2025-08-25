import { IconSymbol } from '@/components/ui/IconSymbol';
import { AIUsageInfo, SubscriptionData } from '@/contexts/SubscriptionContext';
import { useTheme } from '@/contexts/ThemeContext';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface PlanStatusProps {
    subscription: SubscriptionData | null;
    aiUsage?: AIUsageInfo | null;
    loading?: boolean;
    compact?: boolean;
    onUpgrade?: () => void;
}

export const PlanStatus: React.FC<PlanStatusProps> = ({
    subscription,
    aiUsage,
    loading = false,
    compact = false,
    onUpgrade,
}) => {
    const { theme } = useTheme();
    const isDark = theme.isDark;

    const colors = {
        background: isDark ? '#1E293B' : '#FFFFFF',
        text: isDark ? '#F1F5F9' : '#1F2937',
        textSecondary: isDark ? '#94A3B8' : '#6B7280',
        border: isDark ? '#334155' : '#E5E7EB',
        success: '#10B981',
        warning: '#F59E0B',
        danger: '#EF4444',
        premium: '#8B5CF6',
    };

    if (loading) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading subscription...</Text>
            </View>
        );
    }

    if (!subscription) {
        return null;
    }

    const getTierColor = (tier: string) => {
        switch (tier) {
            case 'premium':
                return colors.premium;
            case 'enterprise':
                return colors.success;
            default:
                return colors.warning;
        }
    };

    const getTierIcon = (tier: string) => {
        switch (tier) {
            case 'premium':
                return 'star.fill';
            case 'enterprise':
                return 'crown.fill';
            default:
                return 'gift';
        }
    };

    const getUsageColor = (usage: number, limit: number) => {
        if (limit === -1) return colors.success; // Unlimited
        const percentage = (usage / limit) * 100;
        if (percentage >= 90) return colors.danger;
        if (percentage >= 70) return colors.warning;
        return colors.success;
    };

    const formatUsageText = (usage: number, limit: number) => {
        if (limit === -1) return `${usage} used (Unlimited)`;
        return `${usage} / ${limit} used`;
    };

    if (compact) {
        return (
            <View style={[styles.compactContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <View style={styles.compactHeader}>
                    <View style={styles.tierBadge}>
                        <IconSymbol
                            name={getTierIcon(subscription.tier) as any}
                            size={12}
                            color={getTierColor(subscription.tier)}
                        />
                        <Text style={[styles.tierText, { color: getTierColor(subscription.tier) }]}>
                            {subscription.tier.toUpperCase()}
                        </Text>
                    </View>

                    {aiUsage && (
                        <View style={styles.usageInfo}>
                            <Text style={[styles.usageText, { color: getUsageColor(aiUsage.currentUsage, aiUsage.monthlyLimit) }]}>
                                AI: {formatUsageText(aiUsage.currentUsage, aiUsage.monthlyLimit)}
                            </Text>
                        </View>
                    )}
                </View>

                {subscription.tier === 'free' && onUpgrade && (
                    <TouchableOpacity style={styles.upgradeButton} onPress={onUpgrade}>
                        <Text style={styles.upgradeButtonText}>Upgrade</Text>
                    </TouchableOpacity>
                )}
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <View style={styles.header}>
                <View style={styles.planInfo}>
                    <IconSymbol
                        name={getTierIcon(subscription.tier) as any}
                        size={24}
                        color={getTierColor(subscription.tier)}
                    />
                    <View style={styles.planDetails}>
                        <Text style={[styles.planName, { color: colors.text }]}>{subscription.planName}</Text>
                        <Text style={[styles.planStatus, { color: colors.textSecondary }]}>
                            Status: {subscription.status}
                        </Text>
                    </View>
                </View>

                {subscription.tier === 'free' && onUpgrade && (
                    <TouchableOpacity style={[styles.upgradeButtonLarge, { borderColor: colors.premium }]} onPress={onUpgrade}>
                        <Text style={[styles.upgradeButtonTextLarge, { color: colors.premium }]}>Upgrade</Text>
                    </TouchableOpacity>
                )}
            </View>

            {aiUsage && (
                <View style={styles.usageSection}>
                    <Text style={[styles.usageTitle, { color: colors.text }]}>AI Features Usage</Text>

                    <View style={styles.usageBar}>
                        <View style={styles.usageBarBackground}>
                            <View
                                style={[
                                    styles.usageBarFill,
                                    {
                                        backgroundColor: getUsageColor(aiUsage.currentUsage, aiUsage.monthlyLimit),
                                        width: aiUsage.monthlyLimit === -1 ? '100%' : `${Math.min((aiUsage.currentUsage / aiUsage.monthlyLimit) * 100, 100)}%`
                                    }
                                ]}
                            />
                        </View>
                        <Text style={[styles.usageBarText, { color: colors.textSecondary }]}>
                            {formatUsageText(aiUsage.currentUsage, aiUsage.monthlyLimit)}
                        </Text>
                    </View>

                    {aiUsage.remainingUsage === 0 && aiUsage.monthlyLimit !== -1 && (
                        <View style={styles.limitWarning}>
                            <IconSymbol name="exclamationmark.triangle.fill" size={16} color={colors.warning} />
                            <Text style={[styles.limitWarningText, { color: colors.warning }]}>
                                You've reached your monthly AI usage limit. Upgrade for more requests.
                            </Text>
                        </View>
                    )}

                    <Text style={[styles.resetText, { color: colors.textSecondary }]}>
                        Resets on {new Date(aiUsage.resetDate).toLocaleDateString()}
                    </Text>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: 12,
        borderWidth: 1,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    compactContainer: {
        borderRadius: 8,
        borderWidth: 1,
        padding: 12,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    loadingText: {
        textAlign: 'center',
        fontSize: 14,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    planInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    planDetails: {
        marginLeft: 12,
        flex: 1,
    },
    planName: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    planStatus: {
        fontSize: 14,
        textTransform: 'capitalize',
    },
    compactHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    tierBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        marginRight: 12,
    },
    tierText: {
        fontSize: 10,
        fontWeight: '600',
        marginLeft: 4,
    },
    usageInfo: {
        flex: 1,
    },
    usageText: {
        fontSize: 12,
        fontWeight: '500',
    },
    upgradeButton: {
        backgroundColor: '#8B5CF6',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
    },
    upgradeButtonText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '600',
    },
    upgradeButtonLarge: {
        borderWidth: 1,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
    },
    upgradeButtonTextLarge: {
        fontSize: 14,
        fontWeight: '600',
    },
    usageSection: {
        borderTopWidth: 1,
        borderTopColor: 'rgba(156, 163, 175, 0.2)',
        paddingTop: 16,
    },
    usageTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 12,
    },
    usageBar: {
        marginBottom: 8,
    },
    usageBarBackground: {
        height: 8,
        backgroundColor: 'rgba(156, 163, 175, 0.2)',
        borderRadius: 4,
        overflow: 'hidden',
        marginBottom: 4,
    },
    usageBarFill: {
        height: '100%',
        borderRadius: 4,
    },
    usageBarText: {
        fontSize: 12,
        textAlign: 'right',
    },
    limitWarning: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        padding: 8,
        borderRadius: 8,
        marginBottom: 8,
    },
    limitWarningText: {
        fontSize: 12,
        marginLeft: 8,
        flex: 1,
    },
    resetText: {
        fontSize: 12,
        textAlign: 'center',
    },
});

