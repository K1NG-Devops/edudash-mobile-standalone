#!/bin/bash

# Development start script for EduDash Pro Mobile
echo "🚀 Starting EduDash Pro Development Server..."

# Clear any existing cache
echo "🧹 Clearing cache..."
npx expo start --clear --reset-cache --web --port 8081

echo "✅ EduDash Pro Development Server started!"
echo "📱 Access the app at: http://localhost:8081"
