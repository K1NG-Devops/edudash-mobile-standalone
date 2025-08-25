// EduDash Pro - Unified Design System
// Society 5.0 Futuristic Theme with Professional App Integration

import { ColorValue } from 'react-native';

export const DesignSystem = {
  // Brand Identity - Consistent across all touchpoints
  brand: {
    name: 'EduDash Pro',
    tagline: 'Society 5.0 • Neural Education',
    version: '2.0',
    mission: 'Transcending Reality • Built for the Multiverse',
  },

  // Unified Color Palette - Futuristic yet Professional
  colors: {
    // Primary Brand Colors (Consistent across all surfaces)
    primary: '#0080ff',        // Quantum Blue (main brand)
    primaryLight: '#00f5ff',   // Cyber Cyan (accents)
    primaryDark: '#0040cc',    // Deep Neural Blue (depth)
    
    // Secondary Palette (Supporting brand)
    secondary: '#8000ff',      // Neural Purple
    secondaryLight: '#a855f7', // Soft Neural Purple
    secondaryDark: '#5b21b6',  // Deep Purple
    
    // Accent Colors (Call-to-action)
    accent: '#ff0080',         // Quantum Pink
    accentLight: '#ff4da6',    // Soft Pink
    accentDark: '#cc0066',     // Deep Pink
    
    // Success & Status Colors (Universal)
    success: '#10b981',        // Emerald Green
    warning: '#f59e0b',        // Amber
    error: '#ef4444',          // Red
    info: '#3b82f6',          // Blue
    
    // Neutral Colors (Adaptive)
    text: {
      primary: '#ffffff',       // White text on dark backgrounds
      secondary: '#e5e7eb',     // Light gray
      tertiary: '#9ca3af',      // Medium gray
      inverse: '#1f2937',       // Dark text for light backgrounds
      inverseSecondary: '#6b7280', // Medium gray for light backgrounds
      quantum: '#00f5ff',       // Quantum text (special highlights)
    },
    
    // Background Colors (Theme-aware)
    background: {
      primary: '#0a0a0f',       // Deep space black (landing)
      secondary: '#1a1a2e',     // Dark navy (sections)
      tertiary: '#16213e',      // Midnight blue (cards)
      card: '#ffffff',          // White cards (dashboard)
      cardDark: '#111827',      // Dark cards (dark mode)
      overlay: 'rgba(0,0,0,0.8)', // Modal overlay
      glass: 'rgba(255,255,255,0.1)', // Glass morphism
    },
    
    // Professional Dashboard Colors
    dashboard: {
      background: '#f8fafc',    // Light gray background
      backgroundDark: '#0b1220', // Dark background
      card: '#ffffff',          // White cards
      cardDark: '#111827',      // Dark cards
      border: '#e5e7eb',        // Light border
      borderDark: '#374151',    // Dark border
      accent: '#0080ff',        // Uses brand primary
    },

    // Advertising & Monetization Colors
    advertising: {
      sponsor: '#ff8000',       // Orange for sponsored content
      premium: '#ffd700',       // Gold for premium features
      affiliate: '#ff6b6b',     // Coral for affiliate links
      background: 'rgba(255,255,255,0.05)', // Subtle ad backgrounds
      border: 'rgba(0,245,255,0.3)', // Glowing ad borders
    },
  },

  // Gradient Definitions
  gradients: {
    // Primary Gradients (Futuristic)
    primary: ['#00f5ff', '#0080ff', '#8000ff'] as readonly [ColorValue, ColorValue, ...ColorValue[]],
    primarySubtle: ['#00f5ff', '#0080ff'] as readonly [ColorValue, ColorValue, ...ColorValue[]],
    secondary: ['#8000ff', '#ff0080'] as readonly [ColorValue, ColorValue, ...ColorValue[]],
    accent: ['#ff0080', '#ff8000'] as readonly [ColorValue, ColorValue, ...ColorValue[]],
    
    // Background Gradients
    hero: ['#0a0a0f', '#1a0a2e', '#16213e', '#0f3460', '#533a71'] as readonly [ColorValue, ColorValue, ...ColorValue[]],
    section: ['#1a1a2e', '#16213e'] as readonly [ColorValue, ColorValue, ...ColorValue[]],
    card: ['rgba(0,245,255,0.1)', 'rgba(128,0,255,0.1)'] as readonly [ColorValue, ColorValue, ...ColorValue[]],
    
    // Professional Gradients (for dashboard compatibility)
    professional: ['#3b82f6', '#1d4ed8'] as readonly [ColorValue, ColorValue, ...ColorValue[]],
    success: ['#10b981', '#059669'] as readonly [ColorValue, ColorValue, ...ColorValue[]],
    warning: ['#f59e0b', '#d97706'] as readonly [ColorValue, ColorValue, ...ColorValue[]],
    error: ['#ef4444', '#dc2626'] as readonly [ColorValue, ColorValue, ...ColorValue[]],
  },

  // Typography Scale
  typography: {
    // Futuristic Headers
    heroTitle: {
      fontSize: 48,
      fontWeight: '900',
      letterSpacing: 2,
    },
    heroSubtitle: {
      fontSize: 18,
      fontWeight: '400',
      lineHeight: 24,
    },
    
    // Section Titles
    sectionTitle: {
      fontSize: 32,
      fontWeight: '900',
      letterSpacing: 2,
    },
    sectionSubtitle: {
      fontSize: 16,
      fontWeight: '600',
    },
    
    // Professional Typography (Dashboard)
    h1: {
      fontSize: 24,
      fontWeight: 'bold',
    },
    h2: {
      fontSize: 20,
      fontWeight: '600',
    },
    h3: {
      fontSize: 18,
      fontWeight: '600',
    },
    body: {
      fontSize: 16,
      fontWeight: '400',
      lineHeight: 22,
    },
    caption: {
      fontSize: 14,
      fontWeight: '400',
    },
    small: {
      fontSize: 12,
      fontWeight: '400',
    },
  },

  // Spacing Scale
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
    huge: 40,
  },

  // Border Radius
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 25,
    round: 50,
  },

  // Shadow Definitions
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 5,
    },
    glow: {
      shadowColor: '#00f5ff',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.3,
      shadowRadius: 10,
      elevation: 8,
    },
  },

  // Role-specific Color Schemes
  roles: {
    parent: {
      primary: '#10b981',      // Emerald - nurturing, growth
      secondary: '#059669',
      background: ['#ecfdf5', '#d1fae5'] as readonly [ColorValue, ColorValue, ...ColorValue[]],
      icon: '👨‍👩‍👧‍👦',
    },
    teacher: {
      primary: '#3b82f6',      // Blue - trust, knowledge
      secondary: '#1d4ed8', 
      background: ['#eff6ff', '#dbeafe'] as readonly [ColorValue, ColorValue, ...ColorValue[]],
      icon: '👩‍🏫',
    },
    principal: {
      primary: '#8b5cf6',      // Purple - leadership, authority
      secondary: '#7c3aed',
      background: ['#f3e8ff', '#e9d5ff'] as readonly [ColorValue, ColorValue, ...ColorValue[]],
      icon: '👩‍💼',
    },
    admin: {
      primary: '#ef4444',      // Red - power, control
      secondary: '#dc2626',
      background: ['#fef2f2', '#fee2e2'] as readonly [ColorValue, ColorValue, ...ColorValue[]],
      icon: '👨‍💻',
    },
  },

  // Component Styles
  components: {
    button: {
      primary: {
        background: ['#00f5ff', '#0080ff', '#8000ff'],
        color: '#000000',
        padding: { vertical: 16, horizontal: 32 },
        borderRadius: 30,
      },
      secondary: {
        background: 'transparent',
        borderColor: '#00f5ff',
        borderWidth: 2,
        color: '#00f5ff',
        padding: { vertical: 16, horizontal: 32 },
        borderRadius: 30,
      },
      professional: {
        background: '#3b82f6',
        color: '#ffffff',
        padding: { vertical: 12, horizontal: 24 },
        borderRadius: 8,
      },
    },
    card: {
      futuristic: {
        background: ['rgba(0,245,255,0.1)', 'rgba(128,0,255,0.1)'],
        borderRadius: 20,
        padding: 20,
      },
      professional: {
        background: '#ffffff',
        borderRadius: 12,
        padding: 16,
        shadow: 'md',
      },
    },
  },

  // Advertising & Revenue Strategy
  advertising: {
    // Ad Placement Configuration
    placements: {
      banner: {
        parentDashboard: 'footer',
        freeUserScreens: 'header',
        lessonLibrary: 'between-content',
      },
      interstitial: {
        lessonCompletion: 'after-activity',
        appReturn: 'background-return',
        upgradePrompt: 'feature-limit-reached',
      },
      rewarded: {
        premiumContent: 'unlock-lessons',
        aiCredits: 'extra-generations',
        features: 'temporary-premium-access',
      },
    },

    // Revenue Optimization
    monetization: {
      freemiumLimits: {
        aiGenerations: 5,      // Per day for free users
        studentsPerClass: 10,  // Maximum students
        lessonsPerWeek: 3,     // Content creation limit
        storageGB: 1,          // File storage limit
      },
      conversionTriggers: {
        usageLimitReached: 'Upgrade to continue using AI features',
        highEngagement: 'Unlock advanced analytics and insights',
        teacherInvite: 'Upgrade to invite more teachers',
        parentRequest: 'Get premium parent communication tools',
      },
      subscriptionBenefits: {
        basic: ['Unlimited AI generations', 'Up to 25 students', 'Priority support'],
        premium: ['Unlimited everything', 'Advanced analytics', 'Custom branding'],
        enterprise: ['Multi-school management', 'API access', 'Dedicated support'],
      },
    },

    // Affiliate Marketing
    affiliates: {
      educationalProducts: {
        tablets: 'Child-safe tablets and educational devices',
        books: 'Curriculum-aligned books and materials', 
        toys: 'STEM toys and educational games',
        software: 'Complementary educational software',
      },
      partnerPrograms: {
        schoolSuppliers: 'School furniture and equipment',
        parentingCourses: 'Child development and parenting courses',
        tutorServices: 'Local tutoring and enrichment programs',
        insurance: 'Education and child insurance products',
      },
    },

    // Native Advertising Integration
    contentMarketing: {
      sponsoredLessons: 'Brand-aligned educational content',
      productRecommendations: 'Contextual product suggestions',
      educationalWebinars: 'Expert-led parenting and teaching sessions',
      resourceLibrary: 'Sponsored educational downloads and guides',
    },
  },

  // Performance & Analytics
  performance: {
    loadTimes: {
      landing: 3000,    // 3s maximum
      dashboard: 2000,  // 2s maximum
      components: 500,  // 500ms maximum
    },
    caching: {
      images: '7d',     // 7 days
      content: '24h',   // 24 hours
      userData: '1h',   // 1 hour
    },
    optimization: {
      lazyLoading: true,
      imageCompression: true,
      bundleSplitting: true,
      offline: ['core-features', 'student-data', 'recent-lessons'],
    },
  },
};

// Helper functions for consistent styling
export const getGradientStyle = (gradientName: keyof typeof DesignSystem.gradients) => ({
  colors: DesignSystem.gradients[gradientName],
});

export const getRoleColors = (role: keyof typeof DesignSystem.roles) => 
  DesignSystem.roles[role] || DesignSystem.roles.parent;

export const getTypographyStyle = (variant: keyof typeof DesignSystem.typography) => 
  DesignSystem.typography[variant];

export const getShadowStyle = (variant: keyof typeof DesignSystem.shadows) => 
  DesignSystem.shadows[variant];

// Revenue & Advertising Helpers
export const getAdPlacement = (location: string, userTier: 'free' | 'basic' | 'premium' | 'enterprise') => {
  if (userTier !== 'free') return null; // No ads for paid users
  
  const placements: Record<string, {
    type: string;
    size: string;
    targeting: string;
    frequency: string;
  }> = {
    'parent-dashboard': {
      type: 'banner',
      size: 'medium',
      targeting: 'parenting-products',
      frequency: 'once-per-session',
    },
    'lesson-completion': {
      type: 'interstitial',
      size: 'fullscreen',
      targeting: 'educational-tools',
      frequency: 'every-3rd-completion',
    },
    'upgrade-prompt': {
      type: 'rewarded',
      size: 'modal',
      targeting: 'premium-features',
      frequency: 'on-limit-reached',
    },
  };
  
  return placements[location] || null;
};

export const getConversionStrategy = (userBehavior: {
  daysActive: number;
  featuresUsed: string[];
  engagementScore: number;
  limitHits: number;
}) => {
  const { daysActive, featuresUsed, engagementScore, limitHits } = userBehavior;
  
  if (limitHits >= 3 && daysActive >= 7) {
    return {
      strategy: 'usage-limit',
      message: 'You\'re getting great value! Upgrade for unlimited access.',
      discount: 20,
      urgency: 'limited-time',
    };
  }
  
  if (engagementScore > 0.8 && daysActive >= 14) {
    return {
      strategy: 'high-engagement',
      message: 'Unlock advanced features to boost your results even more!',
      discount: 15,
      urgency: 'none',
    };
  }
  
  if (daysActive >= 30 && engagementScore < 0.3) {
    return {
      strategy: 'retention',
      message: 'Come back and see what\'s new! Special offer just for you.',
      discount: 30,
      urgency: 'comeback-special',
    };
  }
  
  return null;
};

// Revenue Tracking Helpers
export const trackRevenue = (event: {
  type: 'subscription' | 'upgrade' | 'ad-click' | 'affiliate';
  value: number;
  source: string;
  userId: string;
  metadata?: any;
}) => {
  // Integration point for analytics (PostHog, Mixpanel, etc.)
  
  // Example PostHog integration
  // posthog.capture('revenue_event', {
  //   revenue_type: event.type,
  //   revenue_value: event.value,
  //   revenue_source: event.source,
  //   user_id: event.userId,
  //   ...event.metadata
  // });
};

export const formatCurrency = (amount: number, currency: 'ZAR' | 'USD' = 'ZAR') => {
  const symbols = { ZAR: 'R', USD: '$' };
  return `${symbols[currency]}${amount.toLocaleString()}`;
};

// Social Sharing Helpers
export const getSocialShareContent = (contentType: 'achievement' | 'lesson' | 'progress', data: any) => {
  const templates = {
    achievement: {
      title: `🎉 ${data.childName} achieved a new milestone!`,
      description: `See how ${data.childName} is growing with EduDash Pro`,
      hashtags: ['#EduDashPro', '#ChildDevelopment', '#ProudParent'],
      cta: 'Join thousands of families using AI-powered education',
    },
    lesson: {
      title: `📚 Amazing ${data.subject} lesson completed!`,
      description: `Interactive learning that makes education fun`,
      hashtags: ['#STEMLearning', '#EduDashPro', '#Education'],
      cta: 'Discover AI-generated lessons for your child',
    },
    progress: {
      title: `📊 Monthly progress report is amazing!`,
      description: `Track real development with AI insights`,
      hashtags: ['#ChildProgress', '#EduDashPro', '#ParentLife'],
      cta: 'Get detailed insights about your child\'s learning',
    },
  };
  
  return templates[contentType] || templates.achievement;
};
