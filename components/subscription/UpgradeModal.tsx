import { IconSymbol } from '@/components/ui/IconSymbol';
import { useSubscription as useSubscriptionContext } from '@/contexts/SubscriptionContext';
import { useSubscription as useSubscriptionHook } from '@/lib/hooks/useSubscription';
import { SubscriptionService } from '@/lib/services/subscriptionService';
import { useTheme } from '@/contexts/ThemeContext';
import React from 'react';
import {
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { router } from 'expo-router';
import { shadow } from '@/lib/ui/shadow';

interface UpgradeModalProps {
    visible: boolean;
    featureName: string;
    featureDescription: string;
    onClose: () => void;
    onUpgrade?: () => void;
}

const UpgradeModal: React.FC<UpgradeModalProps> = ({
    visible,
    featureName,
    featureDescription,
    onClose,
    onUpgrade,
}) => {
    const { theme } = useTheme();
    const { subscription, aiUsage } = useSubscriptionContext();
    const { plans, createSubscription } = useSubscriptionHook();
    const isDark = theme.isDark;

    const [premiumPrice, setPremiumPrice] = React.useState<number | null>(null);
    React.useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const res = await SubscriptionService.getEffectivePricing('quantum-pro', 'monthly');
                if (!cancelled && res && typeof res.price === 'number') {
                    setPremiumPrice(res.price);
                }
            } catch {}
        })();
        return () => { cancelled = true; };
    }, []);

    const colors = {
        background: isDark ? '#0B1220' : '#F9FAFB',
        modal: isDark ? '#1E293B' : '#FFFFFF',
        text: isDark ? '#F1F5F9' : '#1F2937',
        textSecondary: isDark ? '#94A3B8' : '#6B7280',
        border: isDark ? '#334155' : '#E5E7EB',
        premium: '#8B5CF6',
        success: '#10B981',
        warning: '#F59E0B',
    };

    const handleUpgrade = async () => {
        if (onUpgrade) {
            onUpgrade();
            onClose();
            return;
        }

        try {
            // Prefer creating a subscription directly for the Premium tier
            const premiumPlan = plans.find(p => p.tier === 'premium');
            const planId = premiumPlan?.id || 'quantum-pro'; // slug fallback supported by service

            const result = await createSubscription({
                plan_id: planId,
                billing_interval: 'monthly',
                payment_provider: 'payfast',
            });

            // createSubscription will redirect if a payment_url/approval_url is returned (web)
            if (!result.success) {
                // Fallback: open pricing/manage screen so the user can pick another plan
                router.push('/pricing' as any);
            }
        } catch (err) {
            // Final fallback if anything unexpected happens
            Alert.alert('Upgrade', 'Redirecting to pricing…');
            try { router.push('/pricing' as any); } catch {}
        } finally {
            onClose();
        }
    };

    const premiumFeatures = [
        { icon: 'brain', text: 'Unlimited AI lesson generation' },
        { icon: 'doc.badge.plus', text: 'AI-powered homework grading' },
        { icon: 'lightbulb', text: 'Premium STEM activities library' },
        { icon: 'chart.bar', text: 'Advanced progress analytics' },
        { icon: 'bell', text: 'Priority customer support' },
        { icon: 'cloud', text: 'Extended cloud storage' },
    ];

    const isAILimitReached = aiUsage && aiUsage.remainingUsage === 0 && aiUsage.monthlyLimit !== -1;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={[styles.modal, shadow(8), { backgroundColor: colors.modal }]}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.headerIcon}>
                            <IconSymbol name="lock.fill" size={32} color={colors.premium} />
                        </View>
                        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                            <IconSymbol name="xmark" size={20} color={colors.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView 
                        style={styles.content}
                        contentContainerStyle={{ paddingBottom: 16 }}
                        showsVerticalScrollIndicator={false}
                    >
                        {/* Feature Info */}
                        <View style={styles.featureSection}>
                            <Text style={[styles.featureTitle, { color: colors.text }]}>
                                {featureName}
                            </Text>
                            <Text style={[styles.featureDescription, { color: colors.textSecondary }]}>
                                {featureDescription}
                            </Text>
                        </View>

                        {/* AI Usage Warning */}
                        {isAILimitReached && (
                            <View style={[styles.warningBox, { backgroundColor: `${colors.warning}15`, borderColor: colors.warning }]}>
                                <IconSymbol name="exclamationmark.triangle.fill" size={20} color={colors.warning} />
                                <View style={styles.warningContent}>
                                    <Text style={[styles.warningTitle, { color: colors.warning }]}>
                                        Monthly AI Limit Reached
                                    </Text>
                                    <Text style={[styles.warningText, { color: colors.textSecondary }]}>
                                        You've used all {aiUsage?.monthlyLimit} AI requests this month.
                                        Upgrade to Premium for unlimited access.
                                    </Text>
                                </View>
                            </View>
                        )}

                        {/* Current Plan */}
                        <View style={styles.currentPlanSection}>
                            <Text style={[styles.sectionTitle, { color: colors.text }]}>Current Plan</Text>
                            <View style={[styles.planCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
                                <View style={styles.planHeader}>
                                    <IconSymbol name="gift" size={20} color={colors.warning} />
                                    <Text style={[styles.planName, { color: colors.text }]}>
                                        {subscription?.planName || 'Free Plan'}
                                    </Text>
                                </View>
                                {aiUsage && (
                                    <Text style={[styles.planUsage, { color: colors.textSecondary }]}>
                                        AI Usage: {aiUsage.currentUsage} / {aiUsage.monthlyLimit === -1 ? '∞' : aiUsage.monthlyLimit} requests
                                    </Text>
                                )}
                            </View>
                        </View>

                        {/* Premium Benefits */}
                        <View style={styles.benefitsSection}>
                            <Text style={[styles.sectionTitle, { color: colors.text }]}>Unlock with Quantum Pro</Text>
                            <View style={[styles.premiumCard, { backgroundColor: `${colors.premium}10`, borderColor: colors.premium }]}>
                                <View style={styles.premiumHeader}>
                                    <IconSymbol name="star.fill" size={24} color={colors.premium} />
                                    <Text style={[styles.premiumTitle, { color: colors.premium }]}>Quantum Pro</Text>
<Text style={[styles.premiumPrice, { color: colors.text }]}>R{Number(premiumPrice ?? plans.find(p => p.tier === 'premium')?.price_monthly ?? 149.99).toFixed(2)}/month</Text>
                                </View>

                                <View style={styles.featuresList}>
                                    {premiumFeatures.map((feature, index) => (
                                        <View key={index} style={styles.featureItem}>
                                            <IconSymbol name={feature.icon as any} size={16} color={colors.success} />
                                            <Text style={[styles.featureText, { color: colors.text }]}>{feature.text}</Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        </View>

                        {/* Pricing Comparison */}
                        <View style={styles.pricingSection}>
                            <Text style={[styles.sectionTitle, { color: colors.text }]}>Choose Your Plan</Text>

                            <View style={styles.pricingCards}>
                                {/* Free Plan */}
                                <View style={[styles.pricingCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
                                    <Text style={[styles.pricingTitle, { color: colors.text }]}>Free</Text>
                                    <Text style={[styles.pricingPrice, { color: colors.text }]}>R0</Text>
                                    <Text style={[styles.pricingPeriod, { color: colors.textSecondary }]}>forever</Text>
                                    <View style={styles.pricingFeatures}>
                                        <Text style={[styles.pricingFeature, { color: colors.textSecondary }]}>• 5 AI requests/month</Text>
                                        <Text style={[styles.pricingFeature, { color: colors.textSecondary }]}>• Basic lessons</Text>
                                        <Text style={[styles.pricingFeature, { color: colors.textSecondary }]}>• Class management</Text>
                                    </View>
                                </View>

                                {/* Premium Plan */}
                                <View style={[styles.pricingCard, styles.recommendedCard, { backgroundColor: `${colors.premium}10`, borderColor: colors.premium }]}>
                                    <View style={[styles.recommendedBadge, { backgroundColor: colors.premium }]}>
                                        <Text style={styles.recommendedText}>RECOMMENDED</Text>
                                    </View>
                                    <Text style={[styles.pricingTitle, { color: colors.premium }]}>Premium</Text>
<Text style={[styles.pricingPrice, { color: colors.text }]}>R{Number(premiumPrice ?? plans.find(p => p.tier === 'premium')?.price_monthly ?? 149.99).toFixed(2)}</Text>
                                    <Text style={[styles.pricingPeriod, { color: colors.textSecondary }]}>per month</Text>
                                    <View style={styles.pricingFeatures}>
                                        <Text style={[styles.pricingFeature, { color: colors.text }]}>• Unlimited AI requests</Text>
                                        <Text style={[styles.pricingFeature, { color: colors.text }]}>• AI homework grading</Text>
                                        <Text style={[styles.pricingFeature, { color: colors.text }]}>• Premium STEM activities</Text>
                                        <Text style={[styles.pricingFeature, { color: colors.text }]}>• Advanced analytics</Text>
                                        <Text style={[styles.pricingFeature, { color: colors.text }]}>• Priority support</Text>
                                    </View>
                                </View>
                            </View>
                        </View>
                    </ScrollView>

                    {/* Action Buttons */}
                    <View style={styles.actions}>
                        <TouchableOpacity
                            style={[styles.upgradeButton, { backgroundColor: colors.premium }]}
                            onPress={handleUpgrade}
                        >
                            <Text style={styles.upgradeButtonText}>Upgrade to Quantum Pro</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                            <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>
                                Maybe Later
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modal: {
        width: '90%',
        maxHeight: '90%',
        borderRadius: 16,
        overflow: 'hidden',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        position: 'relative',
    },
    headerIcon: {
        alignItems: 'center',
    },
    closeButton: {
        position: 'absolute',
        right: 20,
        top: 20,
        padding: 4,
    },
    content: {
        paddingHorizontal: 20,
        flexGrow: 1,
        minHeight: 0,
    },
    featureSection: {
        alignItems: 'center',
        marginBottom: 24,
    },
    featureTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 8,
    },
    featureDescription: {
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 24,
    },
    warningBox: {
        flexDirection: 'row',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 24,
    },
    warningContent: {
        flex: 1,
        marginLeft: 12,
    },
    warningTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    warningText: {
        fontSize: 14,
        lineHeight: 20,
    },
    currentPlanSection: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 12,
    },
    planCard: {
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
    },
    planHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    planName: {
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    planUsage: {
        fontSize: 14,
    },
    benefitsSection: {
        marginBottom: 24,
    },
    premiumCard: {
        padding: 20,
        borderRadius: 12,
        borderWidth: 2,
    },
    premiumHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    premiumTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginLeft: 8,
        flex: 1,
    },
    premiumPrice: {
        fontSize: 18,
        fontWeight: '600',
    },
    featuresList: {
        gap: 8,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    featureText: {
        fontSize: 14,
        marginLeft: 8,
        flex: 1,
    },
    pricingSection: {
        marginBottom: 20,
    },
    pricingCards: {
        flexDirection: 'row',
        gap: 12,
    },
    pricingCard: {
        flex: 1,
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        alignItems: 'center',
    },
    recommendedCard: {
        position: 'relative',
    },
    recommendedBadge: {
        position: 'absolute',
        top: -8,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    recommendedText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: 'bold',
    },
    pricingTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 8,
        marginTop: 8,
    },
    pricingPrice: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    pricingPeriod: {
        fontSize: 12,
        marginBottom: 12,
    },
    pricingFeatures: {
        alignItems: 'flex-start',
    },
    pricingFeature: {
        fontSize: 12,
        marginBottom: 4,
    },
    actions: {
        padding: 20,
        paddingTop: 0,
    },
    upgradeButton: {
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 12,
    },
    upgradeButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    cancelButton: {
        paddingVertical: 12,
        alignItems: 'center',
    },
    cancelButtonText: {
        fontSize: 14,
    },
});

export default UpgradeModal;


