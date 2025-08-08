# EduDash Pro — AI Agent Instruction Bundle (Mobile-First)

## Project Overview
**Project**: EduDash Pro Mobile  
**Tech Stack**: React Native (Expo), Supabase, Anthropic Claude, TypeScript  
**Architecture**: Multi-tenant SaaS Mobile App  
**Focus**: Education platform tailored for South African education (Ages 1-18+)  
**Current Phase**: Preschools (Ages 1-6), scaling to Primary (7-13) and Secondary (14-18)  
**Design Philosophy**: Native-like experience, mobile-first, offline-capable, future-ready architecture  

## System Prompt

You are an expert AI software engineer helping build EduDash Pro, a mobile-first education SaaS app for South African education. The app is built with **React Native (Expo)**, **Supabase (PostgreSQL)**, and **Anthropic Claude AI**.

Your responses must be:
- **Production-grade** and scalable
- **Mobile-first** and native-feeling
- **Offline-capable** where possible
- **Performance-optimized** for low-end devices
- **Multi-tenant** aware
- **Future-ready** for scaling across education levels
- **Flexible** for institutional and individual users
- **South African context** sensitive

EduDash Pro currently serves preschools (ages 1-6) with plans to expand to primary and secondary education. Each school operates as a separate tenant, with additional support for individual families not affiliated with participating institutions. The app supports AI-powered lesson generation, homework grading, and comprehensive educational communication.

## Project Structure

```
/app                    # Expo Router (file-based routing)
/components             # Reusable UI components
  /ui                   # Basic UI elements (Button, Input, etc.)
  /forms                # Form components
  /screens              # Screen-level components
/lib                    # Core services
  /supabase.ts          # Supabase client with secure storage
  /services/            # Data services (SchoolAdminDataService, etc.)
  /utils/               # Utility functions
  /hooks/               # Custom React hooks
/types                  # TypeScript definitions
  /database.ts          # Supabase generated types
/constants              # App constants and configurations
/assets                 # Images, fonts, icons
/.env.local             # Environment variables
/app.json               # Expo configuration
```

## Authentication & Multi-Tenancy

### Supabase Auth Setup
```typescript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as SecureStore from 'expo-secure-store'

// Use SecureStore for sensitive data, AsyncStorage for others
const ExpoSecureStoreAdapter = {
  getItem: (key: string) => {
    if (key.includes('supabase.auth.token')) {
      return SecureStore.getItemAsync(key)
    }
    return AsyncStorage.getItem(key)
  },
  // ... rest of adapter
}
```

### Multi-Tenancy Pattern
- **Institutional Mode**: Each school = separate tenant (current focus)
- **Individual Mode**: Families/tutors operate independently (future expansion)
- **Hybrid Mode**: Mix of institutional and individual users
- Users belong to specific institutions via `preschool_id` or operate independently
- RLS policies enforce tenant isolation and user access control
- School invitation codes for institutional onboarding
- Direct registration for individual users

### Scalable Architecture Design
- **Database**: Extensible schema supporting all education levels
- **Content**: Age-appropriate content delivery (1-18 years)
- **Features**: Role-based feature activation
- **Billing**: Flexible pricing models (per-student, per-family, institutional)

### Role-Based Access Control
- **Superadmin**: System administration across all tenants
- **School Admin**: Institution management, staff invitations
- **Teacher/Educator**: Class/student management, content delivery
- **Parent/Guardian**: Child progress, communication, homework support
- **Student**: Age-appropriate self-access (8+ years)
- **Individual Tutor**: Independent educator without institution
- **Home School Parent**: Full educational management for own children

## Mobile-First Architecture

### Navigation
- **Expo Router** for file-based routing
- **Native stack navigation** for performance
- **Tab-based** main navigation
- **Deep linking** support for notifications

### State Management
- **React Query/TanStack Query** for server state
- **Zustand** for client state
- **Offline-first** data synchronization

### Performance Optimizations
```typescript
// Example: Optimized list rendering
import { FlashList } from '@shopify/flash-list'

// Use FlashList instead of FlatList for better performance
<FlashList
  data={students}
  renderItem={renderStudent}
  estimatedItemSize={80}
  keyExtractor={(item) => item.id}
/>
```

## Key Features by Role

### School Admin Dashboard
- **Preschool overview**: Student count, class summary, revenue
- **Teacher management**: Invite, assign classes
- **Class creation**: Age groups, capacity, teacher assignment
- **Student registrations**: Approve, manage waiting lists
- **Financial dashboard**: Fees, payments, revenue analytics

### Teacher Dashboard
- **Class overview**: Student list, attendance
- **Lesson planning**: AI-generated age-appropriate activities
- **Daily activities**: STEM concepts, art, music
- **Parent communication**: Messages, progress updates
- **Homework assignments**: Create, grade with AI assistance

### Parent Dashboard
- **Child's progress**: Development milestones, activities
- **Communication**: Messages with teachers
- **Homework submissions**: Photo uploads, voice notes
- **Fee management**: View, pay school fees
- **Calendar**: School events, pickup times

## AI Integration (Anthropic Claude)

### Core AI Features
```typescript
// AI Services
export class AIService {
  // Generate age-appropriate lesson plans
  async generateLessonPlan(ageGroup: string, topic: string): Promise<LessonPlan>
  
  // Grade homework with educational feedback
  async gradeHomework(submission: HomeworkSubmission): Promise<GradingResult>
  
  // Generate STEM activities
  async generateSTEMActivity(ageGroup: string, concept: string): Promise<Activity>
  
  // Create progress reports
  async generateProgressReport(studentId: string): Promise<ProgressReport>
}
```

### AI-Powered Features
- **Lesson Generation**: Age-appropriate activities (1-18+ years, currently 1-6)
- **Homework Grading**: Educational feedback across all levels
- **STEM Activities**: Safe experiments and projects by age group
- **Progress Analysis**: Development milestones and academic progress
- **Parent Communication**: AI-assisted message drafting
- **Curriculum Alignment**: CAPS curriculum integration (future)
- **Assessment Tools**: Age-appropriate testing and evaluation

## South African Context & Scaling Architecture

### Current Focus: Early Childhood (Ages 1-6)
- **Age groups**: 
  - Babies (6-18 months)
  - Toddlers (18 months - 3 years) 
  - Preschool (3-6 years)
- **Development areas**: Physical, cognitive, emotional, social
- **Activities**: Play-based learning, STEM concepts, art, music
- **Safety**: Age-appropriate materials, allergy tracking

### Future Scaling: Full Education Spectrum
- **Primary Phase (7-13 years)**:
  - Foundation Phase: Grades R-3 (Ages 5-9)
  - Intermediate Phase: Grades 4-6 (Ages 9-12)
  - Senior Phase: Grades 7-9 (Ages 12-15)
- **Secondary Phase (14-18 years)**:
  - Further Education and Training: Grades 10-12 (Ages 15-18)
- **Individual Users**:
  - Homeschooling families
  - Private tutors
  - Independent learners
  - Supplementary education

### Multi-Language Support
- **Primary**: English
- **Secondary**: Afrikaans, isiZulu
- **Implementation**: i18n with react-native-localize

### Local Considerations
- **Offline capability**: Limited data connectivity
- **Low-end device support**: Optimize for older Android devices
- **Currency**: South African Rand (ZAR)
- **Academic calendar**: Term-based system

## Scalable Data Architecture

### Future-Ready Database Schema
```typescript
// Extensible entities for all education levels
interface Institution {
  id: string
  name: string
  type: 'preschool' | 'primary' | 'secondary' | 'combined'
  tenant_slug: string
  subscription_plan: 'free' | 'basic' | 'premium' | 'enterprise'
  education_levels: ('early_childhood' | 'foundation' | 'intermediate' | 'senior' | 'fet')[] 
  max_students: number
  max_teachers: number
  country_code: string // ZA, etc.
  curriculum_standard: string // CAPS, IEB, etc.
}

interface Student {
  id: string
  first_name: string
  last_name: string
  date_of_birth: string
  current_grade: string // 'Grade R', 'Grade 1', etc.
  age_group_id: string
  class_id?: string // null for individual users
  institution_id?: string // null for individual users
  guardian_id: string
  learning_profile?: Json // Learning style, preferences
  allergies?: string
  special_needs?: string
  is_individual_user: boolean // Not part of institution
}

interface Guardian {
  id: string
  user_id: string // Links to auth user
  subscription_type: 'institutional' | 'individual' | 'homeschool'
  subscription_plan?: string // For individual users
  children_ids: string[]
  is_educator: boolean // Can create lessons
}

interface LessonPlan {
  id: string
  title: string
  education_level: 'early_childhood' | 'foundation' | 'intermediate' | 'senior' | 'fet'
  grade_range: string[] // ['Grade R', 'Grade 1'] or ['Ages 3-4']
  subject?: string // null for early childhood
  duration_minutes: number
  curriculum_alignment?: string // CAPS topic codes
  materials_needed: string
  stem_concepts: string[]
  activities: Activity[]
  difficulty_level: 1 | 2 | 3 | 4 | 5
  created_by_type: 'system' | 'teacher' | 'ai' | 'parent'
  is_public: boolean
  institution_id?: string // null means public/individual
}

interface AgeGroup {
  id: string
  name: string
  min_age_months: number
  max_age_months: number
  education_level: 'early_childhood' | 'foundation' | 'intermediate' | 'senior' | 'fet'
  grade_equivalent?: string // 'Grade R', 'Grade 1', etc.
  development_focus: string[]
  institution_id?: string // null for system-wide groups
}
```

### Individual User Support
```typescript
// Support for non-institutional users
interface IndividualFamily {
  id: string
  family_name: string
  subscription_plan: 'free' | 'family' | 'homeschool_premium'
  primary_guardian_id: string
  children_count: number
  homeschool_registered: boolean
  country: string
  curriculum_preference?: string
}

interface TutorProfile {
  id: string
  user_id: string
  specializations: string[]
  education_levels: string[]
  students_limit: number
  is_verified: boolean
  qualifications?: Json
}
```

## Security & Privacy

### Data Protection
- **Secure storage**: Expo SecureStore for sensitive data
- **RLS policies**: Tenant isolation at database level
- **GDPR compliance**: Data deletion, export capabilities
- **Child protection**: Minimal data collection for minors

### API Security
```typescript
// Service role operations (admin only)
export const supabaseAdmin = supabaseServiceRoleKey 
  ? createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })
  : null
```

## Development Workflow

### Environment Setup
```bash
# Install dependencies
npm install

# Start development server
npx expo start

# Generate types from Supabase
npx supabase gen types typescript --project-id [project-id] > types/database.ts
```

### Code Quality
- **TypeScript**: Strict mode enabled
- **ESLint + Prettier**: Code formatting
- **Husky**: Pre-commit hooks
- **Testing**: Jest + React Native Testing Library

### Deployment
- **EAS Build**: Expo Application Services
- **OTA Updates**: Expo Updates for quick fixes
- **App Store**: iOS App Store + Google Play Store

## Performance Guidelines

### Mobile Optimization
```typescript
// Example: Lazy loading with React.lazy
const LazyScreen = React.lazy(() => import('./screens/LazyScreen'))

// Image optimization
import { Image } from 'expo-image'
<Image 
  source={{ uri: imageUrl }}
  cachePolicy="memory-disk"
  transition={200}
/>

// Bundle splitting
import { registerRootComponent } from 'expo'
import { lazy, Suspense } from 'react'
```

### Database Optimization
- **Efficient queries**: Use specific selects, avoid N+1 queries
- **Pagination**: Implement for large lists
- **Caching**: React Query for intelligent caching
- **Offline sync**: Store critical data locally

## Error Handling & Monitoring

```typescript
// Global error boundary
export class ErrorBoundary extends React.Component {
  // Handle React errors gracefully
}

// Sentry integration (optional)
import * as Sentry from '@sentry/react-native'
Sentry.init({ dsn: process.env.EXPO_PUBLIC_SENTRY_DSN })
```

## Example Prompts for AI Agent

### Feature Development
> "Create a responsive preschool class overview screen using React Native and Expo. Show student avatars in a grid, attendance status, and today's activities. Include pull-to-refresh and loading states. Make it accessible and performant."

### AI Integration
> "Build an AI-powered lesson plan generator for 3-4 year olds. Use Anthropic Claude to create age-appropriate STEM activities with safety considerations. Include material lists and step-by-step instructions."

### Data Layer
> "Design a homework submission flow where parents can upload photos and voice recordings. Use Supabase storage with proper RLS policies. Include offline capability and sync when online."

## Success Metrics

### Technical KPIs
- **App performance**: < 3s startup time
- **Crash rate**: < 0.1%
- **Offline capability**: Core features work offline
- **Bundle size**: Optimized for low-end devices

### Business KPIs
- **User engagement**: Daily active users by role
- **Feature adoption**: AI feature usage rates
- **Retention**: Monthly cohort retention
- **Revenue**: Subscription upgrades, payment success rates

---

## Monetization & Revenue Strategy

### SaaS Business Model
- **Freemium Tier**: Basic features with limited AI usage
- **Basic Tier**: Enhanced features for small institutions
- **Premium Tier**: Full feature access for growing schools
- **Enterprise Tier**: Custom solutions for large institutions
- **Individual/Family Plans**: For non-institutional users

### Revenue Streams
```typescript
// Revenue model implementation
interface RevenueStream {
  subscription_revenue: number    // Primary SaaS income
  advertising_revenue: number     // AdMob/AdSense income
  transaction_fees: number        // Payment processing
  premium_content: number         // AI-generated content sales
  marketplace_commission: number  // Third-party integrations
}

// Passive income opportunities
const passiveIncomeStreams = {
  affiliateMarketing: 'Educational product recommendations',
  contentLicensing: 'AI-generated lesson plans to other platforms',
  dataInsights: 'Anonymized educational analytics (GDPR compliant)',
  whiteLabel: 'Platform licensing to other education companies'
}
```

### Advertising Integration

#### AdMob (Mobile App Monetization)
```typescript
// AdMob integration for React Native
import {
  BannerAd,
  BannerAdSize,
  InterstitialAd,
  RewardedAd,
  AdEventType
} from 'react-native-google-mobile-ads'

// Strategic ad placement
const AdStrategy = {
  bannerAds: {
    placement: ['parent-dashboard-footer', 'free-tier-screens'],
    targeting: 'Educational products, parenting resources',
    frequency: 'Non-intrusive, child-safe content only'
  },
  interstitialAds: {
    placement: ['between-lesson-completion', 'app-background-return'],
    rules: 'Never during active learning sessions'
  },
  rewardedAds: {
    placement: ['unlock-premium-content', 'extra-ai-credits'],
    value: 'Additional AI lesson generations, premium features'
  }
}
```

#### AdSense (Web Platform Integration)
```typescript
// AdSense for web dashboard components
const AdSenseConfig = {
  clientId: process.env.EXPO_PUBLIC_ADSENSE_CLIENT_ID,
  adSlots: {
    parentDashboard: 'ca-pub-xxxx~xxxx',
    lessonLibrary: 'ca-pub-xxxx~xxxx',
    progressReports: 'ca-pub-xxxx~xxxx'
  },
  targeting: {
    keywords: ['education', 'preschool', 'child development', 'STEM learning'],
    demographics: 'parents, teachers, early childhood educators',
    location: 'South Africa, English-speaking countries'
  }
}
```

## Real-Time Communication & Notifications

### Push Notification Strategy
```typescript
// Multi-channel notification system
import * as Notifications from 'expo-notifications'
import { OneSignal } from 'react-native-onesignal'

interface NotificationChannels {
  educational: {
    homework_reminders: 'Daily homework check-ins'
    milestone_achievements: 'Child development progress'
    lesson_recommendations: 'AI-suggested activities'
  },
  administrative: {
    fee_reminders: 'Payment due notifications'
    school_announcements: 'Important school updates'
    teacher_messages: 'Direct communication alerts'
  },
  marketing: {
    feature_announcements: 'New platform features'
    upgrade_prompts: 'Premium tier benefits'
    engagement_campaigns: 'Re-engagement for inactive users'
  }
}

// Revenue-driving notification campaigns
const MarketingAutomation = {
  freemiumToBasic: {
    trigger: 'AI usage limit reached',
    message: 'Unlock unlimited lessons with Basic plan',
    timing: '3-day trial period'
  },
  churnPrevention: {
    trigger: '7 days inactive',
    message: 'Your child\'s progress is waiting!',
    incentive: '20% discount on next month'
  },
  upsellToPremium: {
    trigger: 'High engagement metrics',
    message: 'Unlock advanced analytics and AI tutoring',
    timing: 'After 2 weeks of consistent usage'
  }
}
```

### Real-Time Features
```typescript
// Supabase realtime for live communication
export const useRealTimeChat = (classId: string) => {
  const [messages, setMessages] = useState<Message[]>([])
  
  useEffect(() => {
    const channel = supabase
      .channel(`class_${classId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages'
      }, (payload) => {
        setMessages(prev => [...prev, payload.new as Message])
        
        // Trigger push notification for offline users
        sendPushNotification({
          title: 'New message from teacher',
          body: payload.new.content,
          data: { classId, messageId: payload.new.id }
        })
      })
      .subscribe()
      
    return () => channel.unsubscribe()
  }, [classId])
}
```

## SEO & Content Marketing Strategy

### Content-Driven SEO
```typescript
// SEO optimization for educational content
interface SEOStrategy {
  targetKeywords: [
    'preschool education South Africa',
    'AI lesson plans early childhood',
    'STEM activities toddlers',
    'parent teacher communication app',
    'child development milestones',
    'homework help preschool'
  ],
  contentPillars: {
    educational: 'How-to guides, development tips',
    product: 'Feature tutorials, success stories',
    local: 'South African education news, CAPS alignment'
  },
  linkBuilding: {
    partnerships: 'Educational institutions, parenting blogs',
    guestContent: 'Early childhood development articles',
    resources: 'Free downloadable lesson plans, activities'
  }
}

// Programmatic content generation for SEO
const generateSEOContent = async (topic: string, ageGroup: string) => {
  const aiContent = await anthropicClient.generate({
    prompt: `Create SEO-optimized educational content about ${topic} for ${ageGroup}, 
             targeting South African parents and teachers. Include practical tips, 
             CAPS curriculum alignment, and safety considerations.`,
    maxTokens: 2000,
    keywords: ['preschool', 'education', 'South Africa', 'child development']
  })
  
  return {
    title: aiContent.title,
    metaDescription: aiContent.summary.slice(0, 160),
    content: aiContent.body,
    schema: generateEducationalSchema(topic, ageGroup)
  }
}
```

### Marketing Automation
```typescript
// User journey and conversion funnels
interface MarketingFunnel {
  awareness: {
    channels: ['SEO content', 'social media', 'parenting forums'],
    content: 'Free educational resources, development tips',
    cta: 'Download free lesson plan or Sign up for newsletter'
  },
  consideration: {
    channels: ['email sequences', 'retargeting ads', 'webinars'],
    content: 'Product demos, success stories, feature comparisons',
    cta: 'Start free trial or Book demo with education consultant'
  },
  conversion: {
    channels: ['in-app prompts', 'email campaigns', 'personal outreach'],
    content: 'Limited-time offers, upgrade benefits, ROI calculations',
    cta: 'Upgrade to Premium or Contact sales for Enterprise'
  },
  retention: {
    channels: ['push notifications', 'in-app messaging', 'community'],
    content: 'Feature updates, best practices, user achievements',
    cta: 'Explore new features or Refer a friend for discount'
  }
}

// Conversion optimization
const OptimizationMetrics = {
  freeToTrial: 'Free user → Trial signup conversion rate',
  trialToPaid: 'Trial → Paid subscription conversion rate',
  monthlyChurn: 'Monthly subscription cancellation rate',
  ltv: 'Customer Lifetime Value by user segment',
  cac: 'Customer Acquisition Cost by channel',
  nps: 'Net Promoter Score and satisfaction metrics'
}
```

## Platform Growth & Scaling

### Viral Growth Mechanisms
```typescript
// Built-in growth features
const GrowthFeatures = {
  referralProgram: {
    parentReward: '1 month free Premium for each successful referral',
    schoolReward: '10% discount on annual subscription',
    trackingSystem: 'Unique referral codes, attribution tracking'
  },
  contentSharing: {
    achievements: 'Share child milestones on social media',
    lessons: 'Parents can share completed activities',
    progress: 'Monthly development reports (privacy-controlled)'
  },
  communityBuilding: {
    parentGroups: 'Local parent communities within app',
    teacherNetwork: 'Professional development and resource sharing',
    challenges: 'Monthly family learning challenges with prizes'
  }
}
```

### Data-Driven Product Development
```typescript
// Analytics for product optimization
const ProductAnalytics = {
  userBehavior: {
    screenTime: 'Average time spent per feature',
    dropoffPoints: 'Where users exit the app',
    featureAdoption: 'Which AI features drive engagement'
  },
  revenueIntelligence: {
    pricingSensitivity: 'A/B tests on subscription tiers',
    churnPrediction: 'ML models to identify at-risk subscribers',
    upsellOpportunities: 'Usage patterns indicating upgrade readiness'
  },
  marketExpansion: {
    demographicAnalysis: 'User segments by location, income, education',
    competitorBenchmarking: 'Feature gaps and market opportunities',
    internationalReadiness: 'Localization needs for expansion'
  }
}
```

---

**Remember**: We're building a comprehensive SaaS platform that serves educational needs while generating sustainable revenue. Always balance monetization with user value, prioritize child safety in advertising, and build features that naturally encourage organic growth and user retention. Code should be production-ready, well-typed, and follow React Native best practices.
