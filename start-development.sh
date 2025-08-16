#!/bin/bash

# EduDash Pro - Development Server Script
# Starts development server for testing on physical device

echo "🚀 EduDash Pro - Development Server"
echo "=================================="

# Clear cache first
echo "🧹 Clearing cache..."
npm run clear-cache

# Check if device is connected
echo "📱 Checking connected devices..."
adb devices
device_count=$(adb devices | grep -c "device$")

if [ $device_count -eq 0 ]; then
    echo "⚠️  No Android devices connected via ADB"
    echo "You can still use this with Expo Go app by scanning the QR code"
else
    echo "✅ Found $device_count connected device(s)"
fi

# Start the development server
echo "🌐 Starting development server..."
echo "This will start Metro bundler and show a QR code"
echo ""
echo "📱 To connect your device:"
echo "1. Install Expo Go app from Play Store (if not already installed)"
echo "2. Scan the QR code with Expo Go app"
echo "3. Or connect via adb and the server will auto-detect your device"
echo ""
echo "🔥 For hot reload:"
echo "- JavaScript changes will reload automatically"
echo "- Shake device to open developer menu"
echo "- Press 'r' to reload manually"
echo ""

# Start with tunnel for external device access
EXPO_PUBLIC_SUPABASE_URL=$EXPO_PUBLIC_SUPABASE_URL \
EXPO_PUBLIC_SUPABASE_ANON_KEY=$EXPO_PUBLIC_SUPABASE_ANON_KEY \
npx expo start --tunnel --clear
