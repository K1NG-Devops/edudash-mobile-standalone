#!/bin/bash

# EduDash Pro - APK Build Script
# This script builds APKs and moves them to the external builds directory

set -e

# Configuration
BUILD_DIR="../edudash-builds"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to show usage
show_usage() {
    echo "Usage: $0 <profile> [options]"
    echo ""
    echo "Profiles:"
    echo "  development    Build development APK"
    echo "  preview        Build preview APK"  
    echo "  preview-aab    Build preview AAB"
    echo "  production     Build production AAB"
    echo "  production-apk Build production APK"
    echo ""
    echo "Options:"
    echo "  --no-clean     Don't clean old builds"
    echo "  --local        Build locally (default is EAS cloud)"
    echo "  --help         Show this help"
}

# Parse arguments
PROFILE=""
CLEAN_BUILDS=true
LOCAL_BUILD=false

while [[ $# -gt 0 ]]; do
    case $1 in
        development|preview|preview-aab|production|production-apk)
            PROFILE="$1"
            shift
            ;;
        --no-clean)
            CLEAN_BUILDS=false
            shift
            ;;
        --local)
            LOCAL_BUILD=true
            shift
            ;;
        --help|-h)
            show_usage
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

if [[ -z "$PROFILE" ]]; then
    print_error "Profile is required"
    show_usage
    exit 1
fi

# Create build directories if they don't exist
mkdir -p "$BUILD_DIR/$PROFILE"

# Clean old builds if requested
if [[ "$CLEAN_BUILDS" == true ]]; then
    print_status "Cleaning old $PROFILE builds..."
    rm -f "$BUILD_DIR/$PROFILE"/*.apk
    rm -f "$BUILD_DIR/$PROFILE"/*.aab
fi

# Build command
BUILD_CMD="eas build --platform android --profile $PROFILE"
if [[ "$LOCAL_BUILD" == true ]]; then
    BUILD_CMD="$BUILD_CMD --local"
fi

print_status "Starting $PROFILE build..."
print_status "Command: $BUILD_CMD"

# Run the build
if $BUILD_CMD; then
    print_success "Build completed successfully!"
    
    # Move any APK/AAB files from root to builds directory
    if ls *.apk 1> /dev/null 2>&1; then
        for file in *.apk; do
            new_name="${PROFILE}_${TIMESTAMP}_${file}"
            mv "$file" "$BUILD_DIR/$PROFILE/$new_name"
            print_success "Moved $file to $BUILD_DIR/$PROFILE/$new_name"
        done
    fi
    
    if ls *.aab 1> /dev/null 2>&1; then
        for file in *.aab; do
            new_name="${PROFILE}_${TIMESTAMP}_${file}"
            mv "$file" "$BUILD_DIR/$PROFILE/$new_name"
            print_success "Moved $file to $BUILD_DIR/$PROFILE/$new_name"
        done
    fi
    
    # Show what's in the builds directory
    print_status "Current builds in $BUILD_DIR/$PROFILE:"
    ls -la "$BUILD_DIR/$PROFILE/" || print_warning "No builds found in directory"
    
else
    print_error "Build failed!"
    exit 1
fi

print_success "Build process completed!"
echo ""
print_status "To install the development build:"
echo "  adb install $BUILD_DIR/$PROFILE/[latest-apk-file]"
echo ""
print_status "Build artifacts are stored in: $BUILD_DIR/$PROFILE/"
