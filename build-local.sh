#!/bin/bash

# EduDash Pro - Local Development Build Script
# This script builds the app locally and installs it on connected Android device

echo "🚀 EduDash Pro - Local Development Build"
echo "========================================"

# Set Android environment variables
export ANDROID_HOME=/home/king/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools:$ANDROID_HOME/tools:$ANDROID_HOME/tools/bin

# Check if device is connected
echo "📱 Checking connected devices..."
adb devices
device_count=$(adb devices | grep -c "device$")

if [ $device_count -eq 0 ]; then
    echo "❌ No Android devices connected!"
    echo "Please connect your device and enable USB debugging."
    exit 1
fi

echo "✅ Found $device_count connected device(s)"

# Clear previous builds and cache
echo "🧹 Clearing cache and previous builds..."
npx expo install --fix
rm -rf node_modules/.cache 2>/dev/null || true
rm -rf .expo 2>/dev/null || true

# Prebuild the project
echo "🔧 Prebuilding project for Android..."
npx expo prebuild --platform android --clear

# Check if Android build directory exists
if [ ! -d "android" ]; then
    echo "❌ Android build directory not created. Prebuild may have failed."
    exit 1
fi

echo "✅ Prebuild completed successfully"

# Build and install the development APK
echo "📦 Building and installing development APK..."
echo "This may take a few minutes..."

# Set JAVA_HOME if not set (common issue)
if [ -z "$JAVA_HOME" ]; then
    echo "🔍 Setting JAVA_HOME..."
    export JAVA_HOME=$(readlink -f /usr/bin/javac | sed "s:bin/javac::")
fi

# Build and run on device
ANDROID_HOME=$ANDROID_HOME npx expo run:android --device

echo "🎉 Build and installation complete!"
echo ""
echo "📝 Next steps:"
echo "1. The app should now be installed on your device"
echo "2. Start the development server: npm start"
echo "3. Open the app on your device to see live changes"
echo ""
echo "💡 Tips:"
echo "- Keep the development server running for hot reload"
echo "- Shake your device to open the development menu"
echo "- Changes to JavaScript will reload automatically"
echo "- Changes to native code require rebuilding"
