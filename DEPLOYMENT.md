# EduDash Pro - Deployment Guide

## 🚀 Vercel Deployment

### Prerequisites
1. GitHub repository with your EduDash Pro code
2. Vercel account (free tier is sufficient)
3. Supabase project configured with proper RLS policies

### Step 1: Prepare for Deployment

The codebase has been prepared for production with:
- ✅ Console.log statements removed (keeping error handling)
- ✅ Production environment configuration
- ✅ Vercel configuration optimized
- ✅ Security headers configured

### Step 2: Deploy to Vercel

#### Option A: GitHub Integration (Recommended)
1. **Connect GitHub Repository**:
   - Go to [vercel.com](https://vercel.com)
   - Sign in with GitHub
   - Click "New Project"
   - Import your EduDash Pro repository

2. **Configure Project**:
   - Framework Preset: **Other** (Expo handles the build)
   - Build Command: `npx expo export -p web`
   - Output Directory: `dist`
   - Install Command: `npm install`

#### Option B: Vercel CLI
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy from project directory
cd /path/to/edudash-pro
vercel --prod
```

### Step 3: Environment Variables

Add these environment variables in Vercel Dashboard → Settings → Environment Variables:

#### Required Variables
```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EXPO_PUBLIC_APP_NAME=EduDash Pro
EXPO_PUBLIC_ENVIRONMENT=production
EXPO_PUBLIC_DEBUG_MODE=false
EXPO_PUBLIC_WEB_URL=https://your-app.vercel.app
```

#### Feature Flags
```
EXPO_PUBLIC_ENABLE_AI_FEATURES=true
EXPO_PUBLIC_ENABLE_PREMIUM_FEATURES=true
EXPO_PUBLIC_ENABLE_ANALYTICS=true
EXPO_PUBLIC_ENABLE_ADS=true
```

#### PayFast (Production Payment)
```
EXPO_PUBLIC_PAYFAST_ENV=production
EXPO_PUBLIC_PAYFAST_MERCHANT_ID=your-merchant-id
EXPO_PUBLIC_PAYFAST_MERCHANT_KEY=your-merchant-key
EXPO_PUBLIC_PAYFAST_PASSPHRASE=your-passphrase
```

### Step 4: Domain Configuration

#### Custom Domain (Optional)
1. In Vercel Dashboard → Domains
2. Add your custom domain (e.g., `app.edudashpro.co.za`)
3. Configure DNS with your domain provider
4. Update environment variables with new domain

### Step 5: Supabase Configuration

Ensure your Supabase project has:

1. **RLS Policies Applied**: Run the SQL setup scripts in Supabase Dashboard
2. **Superadmin Functions**: Database functions for platform management
3. **Auth Configuration**: 
   - Site URL: `https://your-app.vercel.app`
   - Redirect URLs: Include your Vercel domain

### Step 6: Test Production Deployment

1. **Visit your deployed app**
2. **Test key functions**:
   - Sign in as superadmin
   - Dashboard loading
   - Database access
   - Payment flows (in sandbox mode first)

## 🔧 Build Process

The deployment uses:
- **Expo Web**: Builds React Native components for web
- **Static Export**: Generates static HTML/CSS/JS files
- **Vercel Edge**: Global CDN distribution
- **Environment Variables**: Secure configuration management

## 📊 Performance Optimization

### Included Optimizations
- ✅ Asset caching (1 year for static assets)
- ✅ Security headers (XSS protection, content type options)
- ✅ Gzip compression
- ✅ Tree shaking (unused code removal)
- ✅ Code splitting
- ✅ Image optimization

### Monitoring
- Use Vercel Analytics for performance monitoring
- Monitor Core Web Vitals
- Set up error tracking (Sentry recommended)

## 🔒 Security

### Implemented Security Measures
- ✅ Security headers (XSS, CSRF, Content-Type)
- ✅ Environment variable protection
- ✅ RLS database security
- ✅ No sensitive data in client code

### Additional Security (Recommended)
- Enable Vercel's DDoS protection
- Configure rate limiting
- Set up monitoring alerts
- Regular security audits

## 🚨 Troubleshooting

### Common Issues

#### Build Failures
- Check package.json scripts
- Verify all dependencies are listed
- Check for TypeScript errors

#### Runtime Errors
- Verify environment variables are set correctly
- Check Supabase connection and RLS policies
- Monitor browser console for client-side errors

#### Performance Issues
- Use Vercel Analytics to identify slow pages
- Optimize large images and assets
- Consider code splitting for large components

### Debug Mode
To enable debug mode temporarily:
1. Set `EXPO_PUBLIC_DEBUG_MODE=true` in Vercel environment variables
2. Redeploy
3. Check browser console for detailed logs
4. **Remember to disable in production**

## 📈 Post-Deployment

1. **Set up monitoring**: Vercel Analytics, error tracking
2. **Configure backups**: Supabase automated backups
3. **Plan scaling**: Monitor usage and performance
4. **Update documentation**: Keep deployment docs current

## 🎯 Next Steps

After successful deployment:
- [ ] Test all user flows
- [ ] Configure payment processing
- [ ] Set up monitoring and alerts
- [ ] Plan mobile app deployment
- [ ] Configure CI/CD pipeline for future updates

---

For support, contact the development team or check the project documentation.
