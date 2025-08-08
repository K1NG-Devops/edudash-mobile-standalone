#!/bin/bash

echo "🚀 EduDash Pro Mobile - Deployment Preparation Script"
echo "=================================================="

# Change to project directory
cd ~/Desktop/edudash-mobile-standalone

echo "📱 Checking project configuration..."

# Check if required files exist
if [ ! -f "app.config.js" ]; then
    echo "❌ app.config.js not found"
    exit 1
fi

if [ ! -f "eas.json" ]; then
    echo "❌ eas.json not found"
    exit 1
fi

echo "✅ Configuration files found"

# Install dependencies if needed
echo "📦 Installing dependencies..."
npm install

# Check EAS CLI
echo "🔧 Checking EAS CLI..."
if ! command -v eas &> /dev/null; then
    echo "Installing EAS CLI..."
    npm install -g @expo/eas-cli
fi

# Login to EAS (if not already logged in)
echo "🔐 Checking EAS authentication..."
eas whoami || {
    echo "Please login to EAS:"
    eas login
}

# Pre-build checks
echo "🔍 Running pre-build checks..."

# Check environment variables
if [ ! -f ".env" ] && [ ! -f ".env.local" ]; then
    echo "⚠️  No environment file found. Make sure Supabase credentials are configured."
fi

# Validate app.json
echo "✅ Validating app configuration..."
npx expo config --type public > /dev/null

echo "🎯 Deployment options:"
echo "1. Build for Android (APK)"
echo "2. Build for iOS"
echo "3. Build for both platforms"
echo "4. Submit to stores"

read -p "Select option (1-4): " option

case $option in
    1)
        echo "🤖 Building for Android..."
        eas build --platform android --profile production
        ;;
    2)
        echo "🍎 Building for iOS..."
        eas build --platform ios --profile production
        ;;
    3)
        echo "📱 Building for all platforms..."
        eas build --platform all --profile production
        ;;
    4)
        echo "🏪 Submitting to stores..."
        echo "Make sure you have valid builds first!"
        eas submit --platform android
        eas submit --platform ios
        ;;
    *)
        echo "❌ Invalid option"
        exit 1
        ;;
esac

echo ""
echo "✅ Deployment process completed!"
echo ""
echo "📋 Next steps:"
echo "1. Test the build on physical devices"
echo "2. Update store listings with latest screenshots"
echo "3. Prepare release notes"
echo "4. Submit for store review"
echo ""
echo "🔗 Useful links:"
echo "- EAS Build Dashboard: https://expo.dev/accounts/k1ng-devops/projects/edudash-pro-mobile/builds"
echo "- Google Play Console: https://play.google.com/console"
echo "- App Store Connect: https://appstoreconnect.apple.com"
