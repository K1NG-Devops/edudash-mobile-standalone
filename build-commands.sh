#!/bin/bash

# EduDash Pro - Build Commands for Play Store Deployment

echo "🚀 EduDash Pro - Build Commands"
echo "================================"

# Check EAS login status
echo "📱 Checking EAS login status..."
eas whoami

echo ""
echo "🔧 Available Build Commands:"
echo ""

echo "1. 📦 Build AAB for Play Store (Production):"
echo "   eas build --platform android --profile production"
echo ""

echo "2. 🧪 Build APK for Testing:"
echo "   eas build --platform android --profile production-apk"
echo ""

echo "3. 🧹 Build with Cache Clear:"
echo "   eas build --platform android --profile production --clear-cache"
echo ""

echo "4. 📋 Check Build Status:"
echo "   eas build:list"
echo ""

echo "5. 📊 Monitor Specific Build:"
echo "   eas build:view [BUILD_ID]"
echo ""

echo "6. 🔄 Current Build Status:"
eas build:list --limit=3

echo ""
echo "📝 Next Steps for Play Store Deployment:"
echo "1. Fix any build issues (check logs above)"
echo "2. Create app icons and screenshots"
echo "3. Write privacy policy and terms of service"
echo "4. Set up Google Play Developer account ($25)"
echo "5. Upload AAB to Play Console"
echo ""

echo "📖 For detailed checklist, see: PLAY_STORE_DEPLOYMENT_TODO.md"
