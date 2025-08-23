#!/bin/bash

# Local build script for EduDash Pro Mobile
echo "🔨 Starting Local Build for EduDash Pro..."

# Exit on any error
set -e

# Check if Android SDK is available
if [ -z "$ANDROID_HOME" ]; then
    export ANDROID_HOME="/home/king/Android/Sdk"
fi

if [ ! -d "$ANDROID_HOME" ]; then
    echo "❌ Android SDK not found at $ANDROID_HOME"
    echo "Please install Android Studio or set ANDROID_HOME correctly"
    exit 1
fi

echo "✅ Android SDK found at: $ANDROID_HOME"

# Check dependencies
echo "📦 Checking dependencies..."
if ! npm list expo >/dev/null 2>&1; then
    echo "📦 Installing dependencies..."
    npm install
fi

# TypeScript check
echo "🔍 Running TypeScript check..."
npm run type-check

# Run pre-build for Android (clears previous build)
echo "🔧 Running Expo prebuild for Android..."
npx expo prebuild --platform android --clean

# Build APK using EAS local build
echo "🚀 Building Android APK (Development)..."
npx eas build --platform android --profile development --local

echo ""
echo "✅ Local build completed!"
echo "📱 Look for the APK in the current directory or check EAS build output above"
echo "🔧 To install on a connected device: adb install <apk-file-name>.apk"
