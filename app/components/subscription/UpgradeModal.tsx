import React from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Modal, 
  ScrollView 
} from 'react-native';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { router } from 'expo-router';

interface UpgradeModalProps {
  visible: boolean;
  onClose: () => void;
  featureName: string;
  featureDescription?: string;
}

const PREMIUM_FEATURES = [
  {
    icon: 'brain.head.profile',
    name: 'AI Lesson Generator',
    description: 'Generate custom lessons using AI',
  },
  {
    icon: 'doc.badge.plus',
    name: 'AI Homework Grader',
    description: 'Automatically grade assignments',
  },
  {
    icon: 'lightbulb.max',
    name: 'Premium STEM Activities',
    description: 'Access to advanced STEM content',
  },
  {
    icon: 'chart.bar.xaxis',
    name: 'Progress Analytics',
    description: 'Detailed student progress tracking',
  },
];

export const UpgradeModal: React.FC<UpgradeModalProps> = ({
  visible,
  onClose,
  featureName,
  featureDescription,
}) => {
  const handleUpgrade = () => {
    onClose();
    router.push('/screens/subscription/upgrade' as any);
  };

  const handleLearnMore = () => {
    onClose();
    router.push('/screens/subscription/features' as any);
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.premiumIcon}>
                <IconSymbol name="star.circle.fill" size={32} color="#8B5CF6" />
              </View>
              <Text style={styles.title}>Upgrade to Premium</Text>
              <Text style={styles.subtitle}>
                Unlock {featureName} and all premium features
              </Text>
            </View>

            {/* Feature highlight */}
            <View style={styles.featureHighlight}>
              <IconSymbol name="lock.fill" size={16} color="#F59E0B" />
              <Text style={styles.lockedFeature}>
                <Text style={styles.featureName}>{featureName}</Text> requires Premium
              </Text>
            </View>

            {featureDescription && (
              <Text style={styles.featureDescription}>
                {featureDescription}
              </Text>
            )}

            {/* Premium features list */}
            <View style={styles.featuresSection}>
              <Text style={styles.featuresTitle}>Premium includes:</Text>
              {PREMIUM_FEATURES.map((feature, index) => (
                <View key={index} style={styles.featureItem}>
                  <View style={styles.featureIcon}>
                    <IconSymbol name={feature.icon as any} size={20} color="#8B5CF6" />
                  </View>
                  <View style={styles.featureContent}>
                    <Text style={styles.featureItemName}>{feature.name}</Text>
                    <Text style={styles.featureItemDescription}>{feature.description}</Text>
                  </View>
                  <IconSymbol name="checkmark.circle.fill" size={16} color="#10B981" />
                </View>
              ))}
            </View>

            {/* Pricing highlight */}
            <View style={styles.pricingBox}>
              <Text style={styles.pricingText}>
                Starting at <Text style={styles.price}>$9.99/month</Text>
              </Text>
              <Text style={styles.pricingSubtext}>
                Cancel anytime • Free 7-day trial
              </Text>
            </View>

            {/* Action buttons */}
            <View style={styles.actions}>
              <TouchableOpacity style={styles.upgradeButton} onPress={handleUpgrade}>
                <Text style={styles.upgradeButtonText}>Start Free Trial</Text>
                <IconSymbol name="arrow.right" size={16} color="#FFFFFF" />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.learnMoreButton} onPress={handleLearnMore}>
                <Text style={styles.learnMoreText}>Learn More About Premium</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>

          {/* Close button */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <IconSymbol name="xmark.circle.fill" size={24} color="#6B7280" />
          </TouchableOpacity>
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
    padding: 20,
  },
  modal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    maxHeight: '90%',
    position: 'relative',
  },
  content: {
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  premiumIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
  },
  featureHighlight: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#F59E0B',
  },
  lockedFeature: {
    fontSize: 14,
    color: '#92400E',
    marginLeft: 8,
  },
  featureName: {
    fontWeight: '600',
  },
  featureDescription: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
    marginBottom: 24,
  },
  featuresSection: {
    marginBottom: 24,
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  featureContent: {
    flex: 1,
  },
  featureItemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  featureItemDescription: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  pricingBox: {
    backgroundColor: '#F8FAFC',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 24,
  },
  pricingText: {
    fontSize: 16,
    color: '#1F2937',
  },
  price: {
    fontSize: 18,
    fontWeight: '700',
    color: '#8B5CF6',
  },
  pricingSubtext: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  actions: {
    gap: 12,
  },
  upgradeButton: {
    backgroundColor: '#8B5CF6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 8,
    gap: 8,
  },
  upgradeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  learnMoreButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  learnMoreText: {
    color: '#8B5CF6',
    fontSize: 14,
    fontWeight: '500',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
});
