import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Modal,
  ScrollView,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { DesignSystem, trackRevenue, formatCurrency } from '@/constants/DesignSystem';

const { width } = Dimensions.get('window');

// Child-Safe Ad Banner Component (for AdMob/AdSense integration)
export const SafeBannerAd = ({ 
  adUnitId,
  style,
  onAdLoaded,
  onAdFailedToLoad,
  userTier = 'free',
  testMode = true
}: {
  adUnitId: string;
  style?: any;
  onAdLoaded?: () => void;
  onAdFailedToLoad?: (error: string) => void;
  userTier?: 'free' | 'basic' | 'premium' | 'enterprise';
  testMode?: boolean;
}) => {
  // Don't show ads for paid users
  if (userTier !== 'free') return null;

  // Child-safe ad configuration
  const [adLoaded, setAdLoaded] = useState(false);
  const [adError, setAdError] = useState<string | null>(null);

  // For now, show educational content placeholder
  // In production, this would integrate with AdMob with child-safe settings
  useEffect(() => {
    if (testMode) {
      // Simulate ad loading
      setTimeout(() => {
        setAdLoaded(true);
        onAdLoaded?.();
      }, 1000);
    }
  }, [testMode]);

  if (adError) {
    onAdFailedToLoad?.(adError);
    return null;
  }

  if (!adLoaded && testMode) {
    return (
      <View style={[styles.adPlaceholder, style]}>
        <Text style={styles.adPlaceholderText}>Loading child-safe ads...</Text>
      </View>
    );
  }

  // Child-safe educational ads only
  const childSafeAds = [
    {
      id: 'edu-books',
      title: '📚 Educational Books for Kids',
      subtitle: 'Age-appropriate reading materials',
      cta: 'Explore',
      background: ['rgba(52, 152, 219, 0.1)', 'rgba(155, 89, 182, 0.1)'],
      safe: true
    },
    {
      id: 'stem-toys',
      title: '🔬 STEM Learning Toys',
      subtitle: 'Safe, educational play materials',
      cta: 'Shop',
      background: ['rgba(46, 204, 113, 0.1)', 'rgba(52, 152, 219, 0.1)'],
      safe: true
    },
    {
      id: 'art-supplies',
      title: '🎨 Child-Safe Art Supplies',
      subtitle: 'Non-toxic creative materials',
      cta: 'Browse',
      background: ['rgba(230, 126, 34, 0.1)', 'rgba(231, 76, 60, 0.1)'],
      safe: true
    }
  ];

  const [currentAd] = useState(
    childSafeAds[Math.floor(Math.random() * childSafeAds.length)]
  );

  const handleSafeAdClick = () => {
    // Track child-safe ad interaction
    trackRevenue({
      type: 'child-safe-ad',
      value: 0.5, // Lower revenue but child-safe
      source: 'safe-banner',
      userId: 'current-user',
      metadata: {
        ad_id: currentAd.id,
        child_safe: true,
        educational: true
      }
    });
  };

  return (
    <TouchableOpacity 
      style={[styles.safeBannerAd, style]}
      onPress={handleSafeAdClick}
      activeOpacity={0.8}
    >
      <LinearGradient 
        colors={currentAd.background as [string, string]}
        style={styles.safeBannerGradient}
      >
        <View style={styles.safeBannerContent}>
          <View style={styles.adInfo}>
            <Text style={styles.safeAdTitle}>{currentAd.title}</Text>
            <Text style={styles.safeAdSubtitle}>{currentAd.subtitle}</Text>
          </View>
          <View style={styles.adCTA}>
            <Text style={styles.safeAdCTA}>{currentAd.cta}</Text>
            <IconSymbol name="arrow.right" size={14} color="#3498db" />
          </View>
        </View>
        <View style={styles.childSafeBadge}>
          <IconSymbol name="shield.fill" size={10} color="#27ae60" />
          <Text style={styles.childSafeBadgeText}>CHILD SAFE</Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

// Child-Safe Interstitial Ad Component
export const SafeInterstitialAd = ({
  adUnitId,
  onAdClosed,
  onAdFailedToLoad,
  showAd = false
}: {
  adUnitId: string;
  onAdClosed?: () => void;
  onAdFailedToLoad?: (error: string) => void;
  showAd?: boolean;
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (showAd) {
      // Show child-safe interstitial with delay
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 3000); // 3 second delay
      
      return () => clearTimeout(timer);
    }
  }, [showAd]);

  const handleClose = () => {
    setIsVisible(false);
    onAdClosed?.();
  };

  if (!isVisible) return null;

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.interstitialOverlay}>
        <View style={styles.interstitialAd}>
          <LinearGradient
            colors={['rgba(52, 152, 219, 0.1)', 'rgba(155, 89, 182, 0.1)']}
            style={styles.interstitialGradient}
          >
            <TouchableOpacity style={styles.interstitialClose} onPress={handleClose}>
              <IconSymbol name="xmark" size={20} color="#7f8c8d" />
            </TouchableOpacity>
            
            <Text style={styles.interstitialTitle}>🎓 Educational Content</Text>
            <Text style={styles.interstitialSubtitle}>
              Discover age-appropriate learning materials for your child
            </Text>
            
            <View style={styles.interstitialContent}>
              <Text style={styles.interstitialText}>
                🔒 All content is child-safe and educational
              </Text>
              <Text style={styles.interstitialText}>
                📚 Curated by education experts
              </Text>
              <Text style={styles.interstitialText}>
                ⭐ Parent-approved materials only
              </Text>
            </View>
            
            <TouchableOpacity style={styles.interstitialCTA} onPress={handleClose}>
              <Text style={styles.interstitialCTAText}>Continue Learning</Text>
            </TouchableOpacity>
            
            <View style={styles.childSafeBadge}>
              <IconSymbol name="shield.fill" size={12} color="#27ae60" />
              <Text style={styles.childSafeBadgeText}>CHILD SAFE</Text>
            </View>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
};

// Traditional Ad Banner Component (preserved for backward compatibility)
export const AdBanner = ({ 
  placement, 
  size = 'medium',
  userTier = 'free',
  onAdClick,
  testMode = true
}: {
  placement: string;
  size?: 'small' | 'medium' | 'large';
  userTier?: 'free' | 'basic' | 'premium' | 'enterprise';
  onAdClick?: (adData: any) => void;
  testMode?: boolean;
}) => {
  // Don't show ads for paid users
  if (userTier !== 'free') return null;

  const mockAds = [
    {
      id: 'tablet-001',
      title: '🚀 Quantum Learning Tablets',
      subtitle: 'Next-gen devices for AI education',
      cta: 'Shop Now',
      affiliate: 'educational-tech',
      revenue: 45.00,
      background: ['rgba(0,245,255,0.1)', 'rgba(0,128,255,0.1)'],
    },
    {
      id: 'stem-002', 
      title: '🧠 STEM Activity Kits',
      subtitle: 'Hands-on learning for ages 3-6',
      cta: 'Explore',
      affiliate: 'educational-supplies',
      revenue: 25.50,
      background: ['rgba(128,0,255,0.1)', 'rgba(255,0,128,0.1)'],
    },
    {
      id: 'books-003',
      title: '📚 AI-Recommended Books',
      subtitle: 'Curated for your child\'s level',
      cta: 'Browse',
      affiliate: 'educational-content',
      revenue: 15.75,
      background: ['rgba(255,0,128,0.1)', 'rgba(255,128,0,0.1)'],
    },
  ];

  const [currentAd] = useState(mockAds[Math.floor(Math.random() * mockAds.length)]);

  const handleAdClick = () => {
    trackRevenue({
      type: 'ad-click',
      value: currentAd.revenue,
      source: `banner-${placement}`,
      userId: 'current-user', // Replace with actual user ID
      metadata: {
        ad_id: currentAd.id,
        affiliate: currentAd.affiliate,
        placement: placement,
      }
    });
    
    onAdClick?.(currentAd);
  };

  const sizes = {
    small: { height: 60, padding: 10 },
    medium: { height: 100, padding: 15 },
    large: { height: 150, padding: 20 },
  };

  return (
    <TouchableOpacity 
      style={[styles.adBanner, { height: sizes[size].height }]}
      onPress={handleAdClick}
      activeOpacity={0.8}
    >
      <LinearGradient 
        colors={currentAd.background as [string, string]}
        style={[styles.adBannerGradient, { padding: sizes[size].padding }]}
      >
        <View style={styles.adBannerContent}>
          <View style={styles.adInfo}>
            <Text style={styles.adTitle}>{currentAd.title}</Text>
            <Text style={styles.adSubtitle}>{currentAd.subtitle}</Text>
          </View>
          <View style={styles.adCTA}>
            <Text style={styles.adCTAText}>{currentAd.cta}</Text>
            <IconSymbol name="arrow.right" size={14} color="#00f5ff" />
          </View>
        </View>
        {testMode && (
          <View style={styles.adLabel}>
            <Text style={styles.adLabelText}>AD</Text>
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
};

// Sponsored Content Component
export const SponsoredContent = ({ 
  content,
  onInteraction,
  compact = false 
}: {
  content: {
    title: string;
    description: string;
    image?: string;
    cta: string;
    sponsor: string;
    value: number;
  };
  onInteraction?: (type: 'view' | 'click', data: any) => void;
  compact?: boolean;
}) => {
  useEffect(() => {
    // Track content view
    onInteraction?.('view', { content_id: content.title });
  }, []);

  const handleClick = () => {
    trackRevenue({
      type: 'affiliate',
      value: content.value,
      source: 'sponsored-content',
      userId: 'current-user',
      metadata: {
        sponsor: content.sponsor,
        content_title: content.title,
      }
    });
    
    onInteraction?.('click', content);
  };

  return (
    <TouchableOpacity style={styles.sponsoredCard} onPress={handleClick}>
      <LinearGradient 
        colors={DesignSystem.colors.advertising.background ? 
          [DesignSystem.colors.advertising.background, 'rgba(255,255,255,0.02)'] : 
          ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)']}
        style={styles.sponsoredGradient}
      >
        <View style={styles.sponsoredHeader}>
          <Text style={styles.sponsoredLabel}>Sponsored</Text>
          <Text style={styles.sponsorName}>{content.sponsor}</Text>
        </View>
        
        {content.image && !compact && (
          <View style={styles.sponsoredImageContainer}>
            <Image source={{ uri: content.image }} style={styles.sponsoredImage} />
          </View>
        )}
        
        <Text style={styles.sponsoredTitle}>{content.title}</Text>
        {!compact && (
          <Text style={styles.sponsoredDescription}>{content.description}</Text>
        )}
        
        <TouchableOpacity style={styles.sponsoredCTA}>
          <Text style={styles.sponsoredCTAText}>{content.cta}</Text>
          <IconSymbol name="external" size={14} color="#00f5ff" />
        </TouchableOpacity>
      </LinearGradient>
    </TouchableOpacity>
  );
};

// Upgrade Prompt Component (Conversion-focused)
export const UpgradePrompt = ({
  trigger,
  userBehavior,
  onUpgrade,
  onDismiss,
  visible = false
}: {
  trigger: string;
  userBehavior: any;
  onUpgrade: (plan: string) => void;
  onDismiss: () => void;
  visible: boolean;
}) => {
  const [showDetails, setShowDetails] = useState(false);

  const benefits = {
    basic: [
      'Unlimited AI lesson generation',
      'Up to 25 students per class',
      'Advanced analytics dashboard',
      'Priority customer support',
      'No advertisements',
    ],
    premium: [
      'Everything in Basic, plus:',
      'Unlimited students and classes',
      'Custom branding options',
      'Advanced AI tutoring features',
      'Parent engagement tools',
      'Offline capabilities',
    ],
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <View style={styles.upgradeOverlay}>
        <View style={styles.upgradeModal}>
          <LinearGradient 
            colors={DesignSystem.gradients.primary}
            style={styles.upgradeGradient}
          >
            <TouchableOpacity style={styles.upgradeClose} onPress={onDismiss}>
              <IconSymbol name="xmark" size={24} color="#000000" />
            </TouchableOpacity>

            <Text style={styles.upgradeTitle}>🚀 Ready to Transcend?</Text>
            <Text style={styles.upgradeSubtitle}>
              You've been getting amazing results! Unlock even more potential.
            </Text>

            <View style={styles.upgradeStats}>
              <View style={styles.upgradeStat}>
                <Text style={styles.upgradeStatNumber}>{userBehavior?.daysActive || 7}</Text>
                <Text style={styles.upgradeStatLabel}>Days Active</Text>
              </View>
              <View style={styles.upgradeStat}>
                <Text style={styles.upgradeStatNumber}>{userBehavior?.limitHits || 3}</Text>
                <Text style={styles.upgradeStatLabel}>Limits Hit</Text>
              </View>
              <View style={styles.upgradeStat}>
                <Text style={styles.upgradeStatNumber}>95%</Text>
                <Text style={styles.upgradeStatLabel}>Satisfaction</Text>
              </View>
            </View>

            <ScrollView style={styles.upgradePlans} showsVerticalScrollIndicator={false}>
              <TouchableOpacity 
                style={styles.upgradePlan}
                onPress={() => onUpgrade('basic')}
              >
                <View style={styles.upgradePlanHeader}>
                  <Text style={styles.upgradePlanName}>Basic Plan</Text>
                  <Text style={styles.upgradePlanPrice}>R299/month</Text>
                </View>
                <View style={styles.upgradePlanBenefits}>
                  {benefits.basic.map((benefit, index) => (
                    <Text key={index} style={styles.upgradePlanBenefit}>
                      ✓ {benefit}
                    </Text>
                  ))}
                </View>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.upgradePlan, styles.upgradePlanPopular]}
                onPress={() => onUpgrade('premium')}
              >
                <View style={styles.popularBadge}>
                  <Text style={styles.popularBadgeText}>MOST POPULAR</Text>
                </View>
                <View style={styles.upgradePlanHeader}>
                  <Text style={styles.upgradePlanName}>Premium Plan</Text>
                  <Text style={styles.upgradePlanPrice}>R499/month</Text>
                </View>
                <View style={styles.upgradePlanBenefits}>
                  {benefits.premium.map((benefit, index) => (
                    <Text key={index} style={styles.upgradePlanBenefit}>
                      ✓ {benefit}
                    </Text>
                  ))}
                </View>
              </TouchableOpacity>
            </ScrollView>

            <Text style={styles.upgradeNote}>
              30-day money-back guarantee • Cancel anytime • No hidden fees
            </Text>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
};

// Affiliate Product Recommendation
export const ProductRecommendation = ({
  product,
  context,
  onPurchase
}: {
  product: {
    name: string;
    description: string;
    price: number;
    image: string;
    rating: number;
    affiliate_url: string;
    commission: number;
  };
  context: 'lesson' | 'activity' | 'progress';
  onPurchase?: (product: any) => void;
}) => {
  const contextMessages = {
    lesson: "Perfect for this lesson:",
    activity: "Enhance this activity:",
    progress: "Support your child's growth:",
  };

  const handlePurchase = () => {
    trackRevenue({
      type: 'affiliate',
      value: product.commission,
      source: `product-recommendation-${context}`,
      userId: 'current-user',
      metadata: {
        product_name: product.name,
        product_price: product.price,
        commission: product.commission,
        context: context,
      }
    });
    
    onPurchase?.(product);
  };

  return (
    <View style={styles.productRecommendation}>
      <LinearGradient
        colors={['rgba(255,128,0,0.1)', 'rgba(255,128,0,0.05)']}
        style={styles.productGradient}
      >
        <Text style={styles.productContext}>{contextMessages[context]}</Text>
        
        <View style={styles.productContent}>
          <Image source={{ uri: product.image }} style={styles.productImage} />
          <View style={styles.productInfo}>
            <Text style={styles.productName}>{product.name}</Text>
            <Text style={styles.productDescription}>{product.description}</Text>
            
            <View style={styles.productDetails}>
              <Text style={styles.productPrice}>
                {formatCurrency(product.price)}
              </Text>
              <View style={styles.productRating}>
                {[...Array(Math.floor(product.rating))].map((_, i) => (
                  <Text key={i} style={styles.star}>⭐</Text>
                ))}
                <Text style={styles.ratingText}>({product.rating})</Text>
              </View>
            </View>
          </View>
        </View>
        
        <TouchableOpacity style={styles.productCTA} onPress={handlePurchase}>
          <Text style={styles.productCTAText}>View Product</Text>
          <IconSymbol name="external" size={16} color="#ff8000" />
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );
};

// Revenue Banner (Premium Features Promotion)
export const RevenueBanner = ({
  type,
  discount,
  onUpgrade,
  onDismiss
}: {
  type: 'freemium-limit' | 'engagement-high' | 'feature-unlock';
  discount?: number;
  onUpgrade: () => void;
  onDismiss: () => void;
}) => {
  const bannerContent = {
    'freemium-limit': {
      title: '🚀 You\'re on fire!',
      subtitle: 'You\'ve reached your daily AI limit. Upgrade for unlimited access.',
      cta: 'Upgrade Now',
      color: DesignSystem.gradients.primary,
    },
    'engagement-high': {
      title: '⭐ You\'re a power user!',
      subtitle: 'Unlock advanced features to supercharge your results.',
      cta: 'See Premium',
      color: DesignSystem.gradients.secondary,
    },
    'feature-unlock': {
      title: '✨ New features available!',
      subtitle: 'Get access to advanced analytics and AI tutoring.',
      cta: 'Learn More',
      color: DesignSystem.gradients.accent,
    },
  };

  const content = bannerContent[type];

  return (
    <View style={styles.revenueBanner}>
      <LinearGradient colors={content.color} style={styles.revenueBannerGradient}>
        <TouchableOpacity style={styles.revenueBannerClose} onPress={onDismiss}>
          <IconSymbol name="xmark" size={16} color="#000000" />
        </TouchableOpacity>
        
        <View style={styles.revenueBannerContent}>
          <Text style={styles.revenueBannerTitle}>{content.title}</Text>
          <Text style={styles.revenueBannerSubtitle}>{content.subtitle}</Text>
          {discount && (
            <Text style={styles.revenueBannerDiscount}>
              {discount}% OFF - Limited Time!
            </Text>
          )}
        </View>
        
        <TouchableOpacity style={styles.revenueBannerCTA} onPress={onUpgrade}>
          <Text style={styles.revenueBannerCTAText}>{content.cta}</Text>
          <IconSymbol name="arrow.right" size={16} color="#000000" />
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );
};

// Social Sharing Component (Viral Growth)
export const SocialShare = ({
  contentType,
  data,
  onShare
}: {
  contentType: 'achievement' | 'lesson' | 'progress';
  data: any;
  onShare?: (platform: string, content: any) => void;
}) => {
  const [showModal, setShowModal] = useState(false);
  
  const shareContent = {
    achievement: {
      title: `🎉 ${data.childName} achieved a new milestone!`,
      description: `See how ${data.childName} is growing with EduDash Pro`,
      hashtags: ['#EduDashPro', '#ChildDevelopment', '#ProudParent'],
    },
    lesson: {
      title: `📚 Amazing ${data.subject} lesson completed!`,
      description: `Interactive learning that makes education fun`,
      hashtags: ['#STEMLearning', '#EduDashPro', '#Education'],
    },
    progress: {
      title: `📊 Monthly progress report is amazing!`,
      description: `Track real development with AI insights`,
      hashtags: ['#ChildProgress', '#EduDashPro', '#ParentLife'],
    },
  };

  const platforms = [
    { id: 'facebook', name: 'Facebook', icon: '📘', color: '#1877f2' },
    { id: 'instagram', name: 'Instagram', icon: '📷', color: '#e4405f' },
    { id: 'whatsapp', name: 'WhatsApp', icon: '💬', color: '#25d366' },
    { id: 'twitter', name: 'Twitter', icon: '🐦', color: '#1da1f2' },
  ];

  const handleShare = (platform: string) => {
    const content = shareContent[contentType];
    
    // Track viral sharing for growth metrics
    trackRevenue({
      type: 'affiliate', // Indirect revenue through growth
      value: 0, // No direct revenue but valuable for growth
      source: `social-share-${platform}`,
      userId: 'current-user',
      metadata: {
        content_type: contentType,
        platform: platform,
        has_hashtags: content.hashtags.length > 0,
      }
    });
    
    onShare?.(platform, content);
    setShowModal(false);
  };

  return (
    <>
      <TouchableOpacity 
        style={styles.shareButton} 
        onPress={() => setShowModal(true)}
      >
        <LinearGradient
          colors={['rgba(0,245,255,0.2)', 'rgba(128,0,255,0.1)']}
          style={styles.shareButtonGradient}
        >
          <IconSymbol name="square.and.arrow.up" size={18} color="#00f5ff" />
          <Text style={styles.shareButtonText}>Share Success</Text>
        </LinearGradient>
      </TouchableOpacity>

      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.shareModalOverlay}>
          <View style={styles.shareModal}>
            <LinearGradient
              colors={DesignSystem.gradients.card}
              style={styles.shareModalGradient}
            >
              <Text style={styles.shareModalTitle}>Share Your Success</Text>
              <Text style={styles.shareModalSubtitle}>
                {shareContent[contentType].title}
              </Text>

              <View style={styles.platformsGrid}>
                {platforms.map((platform) => (
                  <TouchableOpacity
                    key={platform.id}
                    style={styles.platformButton}
                    onPress={() => handleShare(platform.id)}
                  >
                    <Text style={styles.platformIcon}>{platform.icon}</Text>
                    <Text style={styles.platformName}>{platform.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={styles.shareModalClose}
                onPress={() => setShowModal(false)}
              >
                <Text style={styles.shareModalCloseText}>Cancel</Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        </View>
      </Modal>
    </>
  );
};

// Freemium Limit Indicator
export const FreemiumLimitIndicator = ({
  used,
  limit,
  type,
  onUpgrade
}: {
  used: number;
  limit: number;
  type: 'ai-generations' | 'students' | 'storage';
  onUpgrade: () => void;
}) => {
  const percentage = (used / limit) * 100;
  const isNearLimit = percentage >= 80;
  const isAtLimit = percentage >= 100;

  const labels = {
    'ai-generations': 'AI Lessons Generated',
    'students': 'Students in Classes',
    'storage': 'Storage Used',
  };

  const getColor = () => {
    if (isAtLimit) return DesignSystem.colors.error;
    if (isNearLimit) return DesignSystem.colors.warning;
    return DesignSystem.colors.success;
  };

  return (
    <View style={styles.limitIndicator}>
      <View style={styles.limitHeader}>
        <Text style={styles.limitLabel}>{labels[type]}</Text>
        <Text style={styles.limitUsage}>{used}/{limit}</Text>
      </View>
      
      <View style={styles.limitProgressBar}>
        <View 
          style={[
            styles.limitProgress, 
            { 
              width: `${Math.min(percentage, 100)}%`,
              backgroundColor: getColor(),
            }
          ]} 
        />
      </View>

      {(isNearLimit || isAtLimit) && (
        <TouchableOpacity style={styles.limitUpgrade} onPress={onUpgrade}>
          <Text style={styles.limitUpgradeText}>
            {isAtLimit ? 'Upgrade to Continue' : 'Upgrade for Unlimited'}
          </Text>
          <IconSymbol name="arrow.right" size={14} color="#00f5ff" />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  // Ad Banner Styles
  adBanner: {
    width: '100%',
    borderRadius: DesignSystem.borderRadius.md,
    overflow: 'hidden',
    marginVertical: DesignSystem.spacing.sm,
  },
  adBannerGradient: {
    flex: 1,
    position: 'relative',
  },
  adBannerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  adInfo: {
    flex: 1,
  },
  adTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: DesignSystem.colors.text.primary,
    marginBottom: 4,
  },
  adSubtitle: {
    fontSize: 12,
    color: DesignSystem.colors.text.secondary,
  },
  adCTA: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  adCTAText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#00f5ff',
  },
  adLabel: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  adLabelText: {
    fontSize: 8,
    color: '#ffffff',
    fontWeight: '600',
  },

  // Sponsored Content Styles
  sponsoredCard: {
    borderRadius: DesignSystem.borderRadius.lg,
    overflow: 'hidden',
    marginVertical: DesignSystem.spacing.md,
  },
  sponsoredGradient: {
    padding: DesignSystem.spacing.lg,
  },
  sponsoredHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: DesignSystem.spacing.sm,
  },
  sponsoredLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: DesignSystem.colors.advertising?.sponsor || '#ff8000',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  sponsorName: {
    fontSize: 12,
    color: DesignSystem.colors.text.tertiary,
    fontWeight: '500',
  },
  sponsoredImageContainer: {
    borderRadius: DesignSystem.borderRadius.sm,
    overflow: 'hidden',
    marginBottom: DesignSystem.spacing.sm,
  },
  sponsoredImage: {
    width: '100%',
    height: 120,
    resizeMode: 'cover',
  },
  sponsoredTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: DesignSystem.colors.text.primary,
    marginBottom: DesignSystem.spacing.xs,
  },
  sponsoredDescription: {
    fontSize: 14,
    color: DesignSystem.colors.text.secondary,
    lineHeight: 18,
    marginBottom: DesignSystem.spacing.md,
  },
  sponsoredCTA: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sponsoredCTAText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#00f5ff',
  },

  // Upgrade Prompt Styles
  upgradeOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  upgradeModal: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    borderRadius: DesignSystem.borderRadius.xxl,
    overflow: 'hidden',
  },
  upgradeGradient: {
    padding: 30,
    position: 'relative',
  },
  upgradeClose: {
    position: 'absolute',
    top: 15,
    right: 15,
    zIndex: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 15,
    padding: 8,
  },
  upgradeTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 8,
  },
  upgradeSubtitle: {
    fontSize: 16,
    color: 'rgba(0,0,0,0.8)',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  upgradeStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 25,
  },
  upgradeStat: {
    alignItems: 'center',
  },
  upgradeStatNumber: {
    fontSize: 20,
    fontWeight: '900',
    color: '#000000',
  },
  upgradeStatLabel: {
    fontSize: 12,
    color: 'rgba(0,0,0,0.7)',
    fontWeight: '600',
  },
  upgradePlans: {
    maxHeight: 300,
  },
  upgradePlan: {
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: DesignSystem.borderRadius.lg,
    padding: 20,
    marginBottom: 15,
    position: 'relative',
  },
  upgradePlanPopular: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  popularBadge: {
    position: 'absolute',
    top: -8,
    right: 15,
    backgroundColor: '#ff0080',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  popularBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 1,
  },
  upgradePlanHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  upgradePlanName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#000000',
  },
  upgradePlanPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
  },
  upgradePlanBenefits: {
    gap: 6,
  },
  upgradePlanBenefit: {
    fontSize: 14,
    color: 'rgba(0,0,0,0.8)',
  },
  upgradeNote: {
    fontSize: 12,
    color: 'rgba(0,0,0,0.6)',
    textAlign: 'center',
    marginTop: 20,
    fontStyle: 'italic',
  },

  // Product Recommendation Styles
  productRecommendation: {
    borderRadius: DesignSystem.borderRadius.lg,
    overflow: 'hidden',
    marginVertical: DesignSystem.spacing.md,
  },
  productGradient: {
    padding: DesignSystem.spacing.lg,
  },
  productContext: {
    fontSize: 12,
    fontWeight: '600',
    color: DesignSystem.colors.advertising?.sponsor || '#ff8000',
    marginBottom: DesignSystem.spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  productContent: {
    flexDirection: 'row',
    marginBottom: DesignSystem.spacing.md,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: DesignSystem.borderRadius.sm,
    marginRight: DesignSystem.spacing.md,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '700',
    color: DesignSystem.colors.text.primary,
    marginBottom: 4,
  },
  productDescription: {
    fontSize: 14,
    color: DesignSystem.colors.text.secondary,
    lineHeight: 18,
    marginBottom: 8,
  },
  productDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: DesignSystem.colors.advertising?.premium || '#ffd700',
  },
  productRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  star: {
    fontSize: 12,
  },
  ratingText: {
    fontSize: 12,
    color: DesignSystem.colors.text.tertiary,
    marginLeft: 4,
  },
  productCTA: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  productCTAText: {
    fontSize: 14,
    fontWeight: '600',
    color: DesignSystem.colors.advertising?.sponsor || '#ff8000',
  },

  // Revenue Banner Styles
  revenueBanner: {
    borderRadius: DesignSystem.borderRadius.lg,
    overflow: 'hidden',
    marginVertical: DesignSystem.spacing.sm,
  },
  revenueBannerGradient: {
    padding: DesignSystem.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  revenueBannerClose: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    padding: 6,
  },
  revenueBannerContent: {
    flex: 1,
    marginRight: DesignSystem.spacing.md,
  },
  revenueBannerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#000000',
    marginBottom: 4,
  },
  revenueBannerSubtitle: {
    fontSize: 14,
    color: 'rgba(0,0,0,0.8)',
    lineHeight: 18,
  },
  revenueBannerDiscount: {
    fontSize: 12,
    fontWeight: '700',
    color: '#000000',
    marginTop: 4,
  },
  revenueBannerCTA: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 6,
  },
  revenueBannerCTAText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000000',
  },

  // Social Share Styles
  shareButton: {
    borderRadius: DesignSystem.borderRadius.lg,
    overflow: 'hidden',
  },
  shareButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: DesignSystem.spacing.md,
    paddingVertical: DesignSystem.spacing.sm,
    gap: 8,
  },
  shareButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#00f5ff',
  },
  shareModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  shareModal: {
    borderTopLeftRadius: DesignSystem.borderRadius.xxl,
    borderTopRightRadius: DesignSystem.borderRadius.xxl,
    overflow: 'hidden',
  },
  shareModalGradient: {
    padding: 30,
  },
  shareModalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: DesignSystem.colors.text.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  shareModalSubtitle: {
    fontSize: 14,
    color: DesignSystem.colors.text.secondary,
    textAlign: 'center',
    marginBottom: 25,
  },
  platformsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 15,
    marginBottom: 25,
  },
  platformButton: {
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: DesignSystem.borderRadius.md,
    minWidth: 80,
  },
  platformIcon: {
    fontSize: 24,
    marginBottom: 6,
  },
  platformName: {
    fontSize: 12,
    fontWeight: '600',
    color: DesignSystem.colors.text.primary,
  },
  shareModalClose: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: DesignSystem.borderRadius.lg,
    paddingVertical: 12,
    alignItems: 'center',
  },
  shareModalCloseText: {
    fontSize: 16,
    fontWeight: '600',
    color: DesignSystem.colors.text.secondary,
  },

  // Freemium Limit Indicator Styles
  limitIndicator: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: DesignSystem.borderRadius.md,
    padding: DesignSystem.spacing.md,
    marginVertical: DesignSystem.spacing.sm,
  },
  limitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: DesignSystem.spacing.sm,
  },
  limitLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: DesignSystem.colors.text.primary,
  },
  limitUsage: {
    fontSize: 14,
    fontWeight: '700',
    color: DesignSystem.colors.text.quantum,
  },
  limitProgressBar: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: DesignSystem.spacing.sm,
  },
  limitProgress: {
    height: '100%',
    borderRadius: 3,
  },
  limitUpgrade: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,245,255,0.1)',
    borderRadius: DesignSystem.borderRadius.sm,
    paddingVertical: 8,
  },
  limitUpgradeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#00f5ff',
  },

  // Child-Safe Ad Styles
  adPlaceholder: {
    height: 100,
    backgroundColor: 'rgba(52, 152, 219, 0.1)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(52, 152, 219, 0.2)',
    borderStyle: 'dashed',
  },
  adPlaceholderText: {
    fontSize: 14,
    color: '#3498db',
    fontWeight: '500',
  },
  safeBannerAd: {
    borderRadius: 12,
    overflow: 'hidden',
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  safeBannerGradient: {
    padding: 16,
    position: 'relative',
    minHeight: 80,
  },
  safeBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  safeAdTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  safeAdSubtitle: {
    fontSize: 12,
    color: '#34495e',
  },
  safeAdCTA: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3498db',
  },
  childSafeBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(39, 174, 96, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 3,
  },
  childSafeBadgeText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#27ae60',
    letterSpacing: 0.5,
  },

  // Interstitial Ad Styles
  interstitialOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  interstitialAd: {
    width: '100%',
    maxWidth: 350,
    borderRadius: 20,
    overflow: 'hidden',
  },
  interstitialGradient: {
    padding: 30,
    alignItems: 'center',
    position: 'relative',
  },
  interstitialClose: {
    position: 'absolute',
    top: 15,
    right: 15,
    backgroundColor: 'rgba(127, 140, 141, 0.2)',
    borderRadius: 15,
    padding: 8,
  },
  interstitialTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 8,
  },
  interstitialSubtitle: {
    fontSize: 14,
    color: '#34495e',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  interstitialContent: {
    alignItems: 'flex-start',
    marginBottom: 20,
    gap: 8,
  },
  interstitialText: {
    fontSize: 13,
    color: '#2c3e50',
    lineHeight: 18,
  },
  interstitialCTA: {
    backgroundColor: '#3498db',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    shadowColor: '#3498db',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  interstitialCTAText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
});

// Export all components as AdComponents object for easy import
export const AdComponents = {
  SafeBannerAd,
  SafeInterstitialAd,
  AdBanner,
  SponsoredContent,
  UpgradePrompt,
  ProductRecommendation,
  RevenueBanner,
  SocialShare,
  FreemiumLimitIndicator
};
