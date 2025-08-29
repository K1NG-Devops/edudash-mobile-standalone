# 🏫 EduDash Pro - Multi-Tenant Educational Platform

A state-of-the-art, mobile-first educational dashboard built with **Next.js**, **Expo Router**, and **Supabase** that serves principals, teachers, and parents across multiple preschools.

## 📚 Overview

EduDash Pro is a comprehensive SaaS platform that enables:

- **🔱 Super Admins** to manage the entire platform and onboard new schools
- **🏫 Principals** to create and configure their preschools 
- **👨‍🏫 Teachers** to create and assign AI-generated lessons and homework
- **👨‍👩‍👧‍👦 Parents** to join school dashboards and track student progress
- **🤖 AI-Powered** lesson generation, grading, and analysis using Anthropic Claude

## 🚀 Key Features

### Multi-Tenant Architecture
- **Secure tenant isolation** using Supabase RLS
- **School-specific dashboards** with unique access codes
- **Role-based permissions** for different user types

### AI Integration
- **Lesson Generation** with Anthropic Claude
- **Automatic Homework Grading** 
- **Interactive STEM Activities**
- **Usage tracking and quotas**

### Mobile-First Experience
- **Native mobile performance** with Expo Router
- **Responsive design** using TailwindCSS patterns
- **Offline support** for critical features
- **Push notifications** with OneSignal

### Super Admin Platform Management
- **School onboarding workflow** with approval process
- **User management and suspension** tools
- **Platform analytics and monitoring**
- **Revenue tracking and subscription management**
- **Content moderation** and abuse reporting

## 🏗️ Architecture

### Tech Stack
- **Frontend**: React Native with Expo Router
- **Backend**: Supabase (PostgreSQL + Auth + RLS)
- **AI**: Anthropic Claude API
- **Styling**: TailwindCSS-inspired React Native styles
- **State Management**: React Context + Hooks
- **Payments**: Stripe integration
- **Analytics**: PostHog/Mixpanel ready
- **Notifications**: OneSignal/Firebase ready

### Project Structure

```
edudash-mobile-standalone/
├── app/                          # Expo Router screens
│   ├── (auth)/                   # Authentication screens
│   │   ├── sign-in.tsx
│   │   ├── sign-up.tsx
│   │   └── school-onboarding.tsx
│   ├── (tabs)/                   # Main app tabs
│   │   └── dashboard.tsx
│   ├── screens/                  # Additional screens
│   │   ├── super-admin-dashboard.tsx
│   │   └── teacher-dashboard.tsx
│   └── _layout.tsx               # Root layout
├── components/                   # Reusable components
│   ├── admin/                    # Admin-specific components
│   │   ├── OnboardingRequestManager.tsx
│   │   └── TeacherPrincipalOnboarding.tsx
│   ├── dashboard/                # Dashboard components
│   │   ├── SuperAdminDashboard.tsx
│   │   └── SchoolAdminDashboard.tsx
│   ├── navigation/               # Navigation components
│   │   ├── MobileHeader.tsx
│   │   └── MobileSidebar.tsx
│   └── ui/                       # UI primitives
│       ├── IconSymbol.tsx
│       └── LoadingSpinner.tsx
├── lib/                          # Business logic
│   ├── ai/                       # AI services
│   │   ├── claudeService.ts
│   │   └── lessonGenerator.ts
│   ├── services/                 # Data services
│   │   ├── superAdminDataService.ts
│   │   ├── onboardingService.ts
│   │   └── teacherDataService.ts
│   └── supabase.ts              # Database client
├── contexts/                     # React contexts
│   └── AuthContext.tsx
├── types/                        # TypeScript definitions
│   └── database.ts
└── supabase/                     # Database migrations
    ├── migrations/
    └── schema/
```

## 🔥 Getting Started

### Prerequisites
- Node.js 18+
- Expo CLI
- Supabase account
- Anthropic API key

### 1. Clone and Install
```bash
git clone <repo-url>
cd edudash-mobile-standalone
npm install
```

### 2. Environment Setup
Create `.env.local`:
```bash
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_ANTHROPIC_API_KEY=your_anthropic_key
```

### 3. Database Setup

IMPORTANT: Never run `supabase db reset` on production. This wipes live data and violates project rules. See `.cursorrules` for strict guidance.

Local development (safe)
```bash
# Local only:
npx supabase db reset --local
npx supabase migration up
```

Production/Staging
```bash
# Apply migrations only — do not reset
npx supabase migration up
```

### 4. Start Development
```bash
# Start Expo development server
npm start

# Or platform-specific
npm run ios
npm run android
npm run web
```

## 🔑 Super Admin Features

### School Onboarding Management
- **Request Review System**: Approve or reject new school registrations
- **Automated School Creation**: One-click school setup with admin account creation
- **Guided Setup Wizard**: Step-by-step school configuration process

### Platform Monitoring
- **Real-time Analytics**: Track schools, users, students, and AI usage
- **System Health Monitoring**: Database status, API response times, uptime
- **User Management**: Suspend/activate users across all schools

### Revenue & Subscriptions  
- **Subscription Management**: Upgrade/downgrade school plans
- **Revenue Tracking**: Monthly revenue and growth rate monitoring
- **Usage Quotas**: Monitor and control AI API usage per school

## 🏫 School Management

### Principal Dashboard
- **School Configuration**: Setup school details, branding, and preferences
- **Teacher Management**: Invite and manage teaching staff
- **Student Enrollment**: Bulk student import and class assignment
- **Analytics & Reports**: School performance and usage insights

### Teacher Tools
- **AI Lesson Planning**: Generate age-appropriate lesson plans
- **Homework Management**: Create and assign AI-powered homework
- **Student Progress Tracking**: Monitor individual student development
- **Parent Communication**: Direct messaging and notifications

### Parent Experience
- **Student Progress View**: Real-time homework and lesson tracking
- **Communication Hub**: Direct contact with teachers
- **School Updates**: Important announcements and events
- **Mobile-Native Experience**: Full offline support

## 🤖 AI Integration

### Lesson Generation
```typescript
import { LessonGenerator } from '@/lib/ai/lessonGenerator';

const lesson = await LessonGenerator.createLesson({
  topic: "Numbers and Counting",
  ageGroup: "3-4 years",
  duration: 30,
  difficulty: 1
});
```

### Homework Grading
```typescript
import { HomeworkGrader } from '@/lib/ai/homeworkGrader';

const results = await HomeworkGrader.gradeSubmission({
  studentId: "uuid",
  homeworkId: "uuid", 
  responses: submissionData
});
```

## 🔒 Security & Multi-Tenancy

### Row Level Security (RLS)
All database tables use Supabase RLS policies to ensure:
- **Tenant Isolation**: Schools can only access their own data
- **Role-Based Access**: Users see only what their role permits
- **Super Admin Bypass**: Platform admins can access all data when needed

### Authentication Flow
1. **User Registration**: Email/password via Supabase Auth
2. **Role Assignment**: Automatic role detection and assignment  
3. **School Association**: Users linked to specific schools
4. **Session Management**: Secure token-based authentication

## 📱 Mobile & PWA

### Expo Configuration
- **Universal App**: Works on iOS, Android, and Web
- **Native Performance**: Platform-specific optimizations
- **Push Notifications**: Real-time updates for all user types
- **Offline Support**: Critical features work without internet

### Responsive Design
- **Mobile-First**: Optimized for touch interfaces
- **Adaptive Layouts**: Responsive to screen sizes
- **Accessibility**: Full a11y support with screen readers
- **Dark Mode**: System-aware theme switching

## 🚀 Deployment

### Web Deployment
```bash
# Build for web
npm run build:web

# Deploy to Vercel/Netlify
npm run deploy:web
```

### Mobile App Store
```bash
# Build for iOS App Store
npm run build:ios

# Build for Google Play Store  
npm run build:android

# Build for both platforms
npm run build:all
```

## 🧪 Testing

### Test Scripts
```bash
# Type checking
npm run type-check

# Linting  
npm run lint

# Full test suite
npm run test:rules
```

### Quality Assurance
- **TypeScript**: Full type safety across the codebase
- **ESLint**: Code quality and consistency checking
- **Project Rules Validation**: Automated architecture compliance

## 📊 Analytics & Monitoring

### Built-in Analytics
- **User Engagement**: Track feature usage across roles
- **AI Usage Monitoring**: Monitor Claude API costs and quotas
- **Performance Metrics**: App load times and error rates
- **Revenue Tracking**: Subscription metrics and churn

### External Integrations
- **PostHog**: User behavior analytics (ready to configure)
- **Mixpanel**: Event tracking (ready to configure) 
- **Sentry**: Error monitoring (ready to configure)

## 🎨 Customization

### School Branding
- **Custom Colors**: School-specific color schemes
- **Logo Upload**: Branded school dashboards
- **Welcome Messages**: Personalized onboarding messages
- **Custom Features**: Toggle features per school

### White-Label Options
- **Platform Branding**: Customize the EduDash Pro branding
- **Domain Mapping**: Use custom domains per school
- **Mobile App Branding**: School-specific mobile apps

## 🤝 Contributing

### Development Workflow
1. **Feature Branches**: Create feature branches from `main`
2. **Type Safety**: Ensure all TypeScript errors are resolved
3. **Code Quality**: Run linting and formatting before commits
4. **Testing**: Test on multiple devices and screen sizes

### Code Standards
- **Clean Architecture**: Separation of concerns with service layers
- **Component Reusability**: Build reusable, composable components
- **Mobile Performance**: Optimize for mobile-first experiences
- **Accessibility**: Follow WCAG guidelines for inclusivity

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Documentation
- **API Reference**: Complete service documentation
- **Component Library**: Storybook component documentation
- **Architecture Guide**: Detailed system architecture docs

### Getting Help
- **GitHub Issues**: Bug reports and feature requests
- **Discussions**: Community Q&A and best practices
- **Discord**: Real-time developer chat

---

## 🎯 Recent Updates

### ✅ Project Cleanup (Latest)
- **Archived Legacy Files**: Moved old docs and debug scripts to `archive/`
- **Enhanced Super Admin Dashboard**: New onboarding management system
- **Improved School Creation**: Guided wizard with validation
- **Better Code Organization**: Clean file structure and imports

### 🛠 New: Supabase Edge Function — admin-notify
A secure serverless endpoint for creating system/admin notifications bypassing RLS via the service role key.

Setup
- Store your service role key securely in Supabase as an env var for the function: SUPABASE_SERVICE_ROLE_KEY
- The function reads SUPABASE_URL automatically

Deploy
- supabase functions deploy admin-notify

Call example
- POST https://<PROJECT_REF>.functions.supabase.co/admin-notify
- Headers: Authorization: Bearer {{SUPABASE_SERVICE_ROLE_KEY}}, Content-Type: application/json
- Body: { "user_id": "<uuid>", "title": "System notice", "body": "Message", "data": {"severity":"info"} }

### 🚀 Next Milestones
- **Payment Integration**: Stripe subscription management
- **Advanced Analytics**: Real-time usage dashboards  
- **Mobile App Store**: Published iOS and Android apps
- **API Documentation**: Interactive API explorer

Built with ❤️ for the education community
