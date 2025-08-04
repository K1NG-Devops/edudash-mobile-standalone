#!/bin/bash

# EduDash Pro - Update Deployment Script
# This script handles OTA updates for our educational platform

set -e

echo "🎓 EduDash Pro - Update Deployment"
echo "=================================="

# Check if we're in the right directory
if [ ! -f "app.json" ]; then
    echo "❌ Error: app.json not found. Please run this script from the project root."
    exit 1
fi

# Get current version
CURRENT_VERSION=$(node -p "require('./app.json').expo.version")
echo "📱 Current version: $CURRENT_VERSION"

# Prompt for update type
echo ""
echo "Select update type:"
echo "1) Patch (bug fixes, small improvements)"
echo "2) Minor (new features, UI updates)"
echo "3) Major (breaking changes, requires new APK)"
echo ""
read -p "Enter choice (1-3): " UPDATE_TYPE

# Prompt for update message
echo ""
read -p "📝 Enter update description: " UPDATE_MESSAGE

# Create update branch if needed
BRANCH_NAME="update-$(date +%Y%m%d-%H%M%S)"
echo "🌿 Creating update branch: $BRANCH_NAME"
git checkout -b "$BRANCH_NAME"

case $UPDATE_TYPE in
    1)
        echo "🔧 Deploying patch update..."
        CHANNEL="production"
        ;;
    2)
        echo "✨ Deploying minor update..."
        CHANNEL="production"
        ;;
    3)
        echo "🚨 Major update detected - This requires new APK build!"
        echo "   Users will need to download new version from app store."
        CHANNEL="major-update"
        ;;
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac

# Build and publish update
echo "📦 Building update for EduDash Pro..."
echo "🎯 Target channel: $CHANNEL"
echo "💬 Message: $UPDATE_MESSAGE"

# Publish the update
eas update --branch $CHANNEL --message "$UPDATE_MESSAGE"

# For production updates, also create a release branch
if [ "$UPDATE_TYPE" != "3" ]; then
    echo "🏷️  Creating release tag..."
    git add .
    git commit -m "feat: $UPDATE_MESSAGE"
    git tag -a "v$CURRENT_VERSION-update-$(date +%Y%m%d)" -m "$UPDATE_MESSAGE"
    git push origin "$BRANCH_NAME"
    git push origin --tags
fi

echo ""
echo "✅ Update deployed successfully!"
echo "📊 Users will receive this update within 24 hours"
echo "🔍 Monitor update adoption at: https://expo.dev/accounts/[your-account]/projects/edudash-pro-mobile/updates"
echo ""
echo "📱 For Super-Admins: You can track update rollout in the admin dashboard"
echo "👥 For Principals/Teachers/Parents: Updates will download automatically when app is backgrounded"
