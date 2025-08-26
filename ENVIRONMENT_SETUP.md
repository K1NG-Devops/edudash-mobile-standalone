# Environment Variables Configuration Guide

This document outlines all environment variables used in the EduDash Pro application and where they should be configured.

## Overview

The app uses different environment files for different purposes:
- `.env.local` - Local development (client-side)
- `.env.production` - Production deployment (client-side) 
- Server Environment - Supabase Edge Functions, Vercel, etc.

## Client-Side Environment Variables

### Core App Configuration

```env
# App Metadata
EXPO_PUBLIC_APP_NAME=EduDash Pro
EXPO_PUBLIC_APP_VERSION=1.0.0
EXPO_PUBLIC_APP_SCHEME=edudashpro
EXPO_PUBLIC_DEFAULT_CURRENCY=ZAR
EXPO_PUBLIC_DEFAULT_LOCALE=en-ZA
EXPO_PUBLIC_DEFAULT_TIMEZONE=Africa/Johannesburg

# Environment
EXPO_PUBLIC_ENVIRONMENT=development  # or 'production'
EXPO_PUBLIC_DEBUG_MODE=true          # false in production
```

### Supabase Configuration

```env
# Primary Database
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=YOUR_PUBLIC_ANON_KEY
EXPO_PUBLIC_SUPABASE_STORAGE_BUCKET=avatars
```

### Feature Flags

```env
# Core Features
EXPO_PUBLIC_EMAIL_ENABLED=true
EXPO_PUBLIC_EMAIL_MOCK_MODE=false    # true for development
EXPO_PUBLIC_ENABLE_OFFLINE_MODE=true

# AI Features
EXPO_PUBLIC_ENABLE_AI_FEATURES=true
EXPO_PUBLIC_ENABLE_LESSON_GENERATOR=true
EXPO_PUBLIC_ENABLE_HOMEWORK_GRADING=true
EXPO_PUBLIC_ENABLE_PROGRESS_ANALYSIS=true

# Educational Features
EXPO_PUBLIC_ENABLE_STEM_ACTIVITIES=true
EXPO_PUBLIC_ENABLE_PREMIUM_FEATURES=true

# Monetization
EXPO_PUBLIC_ENABLE_ADS=false         # true in production
EXPO_PUBLIC_ENABLE_ANALYTICS=false   # true in production
EXPO_PUBLIC_ENABLE_PUSH_NOTIFICATIONS=false  # true in production
```

### Payment Configuration

```env
# PayFast (South African Market)
EXPO_PUBLIC_PAYFAST_MERCHANT_ID=your_merchant_id
EXPO_PUBLIC_PAYFAST_MERCHANT_KEY=your_merchant_key
EXPO_PUBLIC_PAYFAST_PASSPHRASE=your_passphrase
EXPO_PUBLIC_PAYFAST_ENV=sandbox      # 'production' for live

# PayPal (International - Optional)
EXPO_PUBLIC_PAYPAL_CLIENT_ID=your_paypal_client_id
EXPO_PUBLIC_PAYPAL_ENV=sandbox       # 'production' for live
```

### Advertising Configuration

```env
# AdMob Configuration
EXPO_PUBLIC_ADMOB_ANDROID_APP_ID=ca-app-pub-xxxxxxxxxxxxxxxx~yyyyyyyyyy
EXPO_PUBLIC_ADMOB_IOS_APP_ID=ca-app-pub-xxxxxxxxxxxxxxxx~zzzzzzzzzz
```

### AI Service Configuration

```env
# Anthropic Claude Configuration
EXPO_PUBLIC_ANTHROPIC_MODEL=claude-3-haiku-20240307
EXPO_PUBLIC_ANTHROPIC_MAX_TOKENS=4000
```

## Server-Side Environment Variables

### Supabase Edge Functions

Configure in Supabase Dashboard > Settings > Edge Functions:

```env
# Service Role Key (NEVER expose to client)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# AI Services
ANTHROPIC_API_KEY=your_anthropic_api_key

# Email Service
RESEND_API_KEY=your_resend_api_key

# Payment Webhooks
PAYFAST_MERCHANT_ID=your_merchant_id
PAYFAST_MERCHANT_KEY=your_merchant_key
PAYFAST_PASSPHRASE=your_passphrase

PAYPAL_CLIENT_SECRET=your_paypal_client_secret
```

### Vercel/Production Deployment

Configure in your hosting platform's environment settings:

```env
# App URLs
NEXT_PUBLIC_APP_URL=https://app.edudashpro.org.za

# Webhook URLs
PAYFAST_RETURN_URL=https://app.edudashpro.org.za/payment/success
PAYFAST_CANCEL_URL=https://app.edudashpro.org.za/payment/cancel
PAYFAST_NOTIFY_URL=https://app.edudashpro.org.za/api/webhooks/payfast

PAYPAL_RETURN_URL=https://app.edudashpro.org.za/payment/success
PAYPAL_CANCEL_URL=https://app.edudashpro.org.za/payment/cancel

# Email Configuration
FROM_EMAIL=noreply@edudashpro.org.za
```

## Development vs Production

### Development (.env.local)

```env
EXPO_PUBLIC_ENVIRONMENT=development
EXPO_PUBLIC_DEBUG_MODE=true
EXPO_PUBLIC_EMAIL_MOCK_MODE=true
EXPO_PUBLIC_ENABLE_ADS=false
EXPO_PUBLIC_ENABLE_ANALYTICS=false
EXPO_PUBLIC_PAYFAST_ENV=sandbox
EXPO_PUBLIC_PAYPAL_ENV=sandbox
```

### Production (.env.production)

```env
EXPO_PUBLIC_ENVIRONMENT=production
EXPO_PUBLIC_DEBUG_MODE=false
EXPO_PUBLIC_EMAIL_MOCK_MODE=false
EXPO_PUBLIC_ENABLE_ADS=true
EXPO_PUBLIC_ENABLE_ANALYTICS=true
EXPO_PUBLIC_ENABLE_PUSH_NOTIFICATIONS=true
EXPO_PUBLIC_PAYFAST_ENV=production
EXPO_PUBLIC_PAYPAL_ENV=production
```

## Security Best Practices

### Client-Side Variables
- Only use `EXPO_PUBLIC_` prefix for variables that are safe to expose
- Never include API keys, secrets, or passwords in client-side variables
- All `EXPO_PUBLIC_` variables are visible in the compiled app

### Server-Side Variables
- Store sensitive keys only in server environments
- Use Supabase secrets management for Edge Functions
- Use your hosting platform's environment variable management

### API Keys Management

| Service | Client-Safe | Server-Only | Location |
|---------|-------------|-------------|----------|
| Supabase Anon Key | ✅ | ❌ | `.env.local` |
| Supabase Service Role | ❌ | ✅ | Supabase Secrets |
| Anthropic API Key | ❌ | ✅ | Supabase Secrets |
| PayFast Merchant ID | ✅ | ❌ | `.env.local` |
| PayFast Passphrase | ❌ | ✅ | Server Environment |
| AdMob App IDs | ✅ | ❌ | `.env.local` |
| Resend API Key | ❌ | ✅ | Supabase Secrets |

## Setup Instructions

1. **Copy the example file:**
   ```bash
   cp .env.example .env.local
   ```

2. **Fill in your values:**
   - Get Supabase keys from your project dashboard
   - Set up PayFast merchant account
   - Configure AdMob app IDs
   - Set feature flags as needed

3. **For production:**
   ```bash
   cp .env.production .env.production.local
   # Update with production values
   ```

4. **Verify configuration:**
   ```bash
   npm run verify-env  # Checks for required variables
   ```

## Troubleshooting

### Common Issues

1. **Variables not loading:**
   - Ensure `EXPO_PUBLIC_` prefix for client variables
   - Restart development server after changes

2. **Build errors:**
   - Check all required variables are set
   - Verify no typos in variable names

3. **Production issues:**
   - Ensure production environment variables are configured
   - Check server-side variables are set in deployment platform

### Verification Script

Run this to check your environment setup:

```bash
node -e "
console.log('Environment Variables Check:');
console.log('Supabase URL:', process.env.EXPO_PUBLIC_SUPABASE_URL ? '✅' : '❌');
console.log('Supabase Key:', process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ? '✅' : '❌');
console.log('Environment:', process.env.EXPO_PUBLIC_ENVIRONMENT || 'Not Set');
"
```
