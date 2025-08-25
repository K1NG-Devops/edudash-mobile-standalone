#!/bin/bash

# Clean Console Logs Script for EduDash Pro
# This script removes console.log statements for production deployment

echo "🧹 Cleaning console.log statements from EduDash Pro..."

# Function to remove console logs but keep console.error and console.warn
clean_console_logs() {
    local file="$1"
    echo "Cleaning: $file"
    
    # Remove console.log but keep console.error, console.warn, and console.info in error handling
    sed -i.bak -E '
        # Remove console.log statements (but not console.error/console.warn)
        /console\.log\s*\(/d
        # Remove console.debug statements  
        /console\.debug\s*\(/d
        # Remove specific debug console statements with emojis
        /console\.log\(['\''\"]\s*[🔍📡✅❌🔄🆕👋⚠️💡🎉📋🚀🔧]/d
    ' "$file"
    
    # Remove the backup file
    rm -f "${file}.bak"
}

# Find and clean TypeScript and JavaScript files
find . -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | \
    grep -v node_modules | \
    grep -v .git | \
    grep -v test-superadmin-login.js | \
    while read -r file; do
        # Skip files that should keep console statements (logger, error handling)
        if [[ "$file" == *"logger"* ]] || [[ "$file" == *"error"* ]]; then
            echo "Skipping: $file (contains logging infrastructure)"
            continue
        fi
        
        # Check if file contains console.log statements
        if grep -q "console\.log" "$file" 2>/dev/null; then
            clean_console_logs "$file"
        fi
    done

echo "✅ Console log cleanup complete!"
echo ""
echo "Files that still contain console.error/warn (these are kept for production error handling):"
find . -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | \
    grep -v node_modules | \
    grep -v .git | \
    xargs grep -l "console\.\(error\|warn\)" 2>/dev/null | head -5

echo ""
echo "🎯 Ready for production deployment!"
