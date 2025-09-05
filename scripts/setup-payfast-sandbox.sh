#!/bin/bash

# Setup PayFast Sandbox Configuration
# This script configures PayFast for development/testing with YOUR sandbox credentials

echo "🏦 Setting up PayFast Sandbox Configuration..."
echo "📝 Please enter your PayFast sandbox account credentials:"
echo "   (Get these from your PayFast sandbox dashboard at https://sandbox.payfast.co.za)"
echo ""

# Prompt for your actual sandbox credentials
read -p "Enter your Sandbox Merchant ID: " SANDBOX_MERCHANT_ID
read -p "Enter your Sandbox Merchant Key: " SANDBOX_MERCHANT_KEY
read -s -p "Enter your Sandbox Passphrase (hidden): " SANDBOX_PASSPHRASE
echo "" # New line after hidden input

# Validate inputs
if [[ -z "$SANDBOX_MERCHANT_ID" || -z "$SANDBOX_MERCHANT_KEY" || -z "$SANDBOX_PASSPHRASE" ]]; then
    echo "❌ Error: All credentials are required!"
    echo "   Please run the script again with your sandbox credentials."
    exit 1
fi

echo "✅ Credentials entered successfully!"

# Backup existing .env.local if it exists
if [ -f ".env.local" ]; then
    echo "📄 Backing up existing .env.local to .env.local.backup"
    cp .env.local .env.local.backup
fi

# Create or update .env.local with sandbox credentials
echo "🔧 Updating .env.local with PayFast sandbox credentials..."

# Function to update or add environment variable
update_env_var() {
    local var_name="$1"
    local var_value="$2"
    
    if grep -q "^${var_name}=" .env.local 2>/dev/null; then
        # Update existing variable
        sed -i "s/^${var_name}=.*/${var_name}=${var_value}/" .env.local
    else
        # Add new variable
        echo "${var_name}=${var_value}" >> .env.local
    fi
}

# Ensure .env.local exists
touch .env.local

echo "📝 Setting PayFast environment variables..."

# Set PayFast sandbox configuration
update_env_var "EXPO_PUBLIC_PAYFAST_MERCHANT_ID" "$SANDBOX_MERCHANT_ID"
update_env_var "EXPO_PUBLIC_PAYFAST_MERCHANT_KEY" "$SANDBOX_MERCHANT_KEY" 
update_env_var "EXPO_PUBLIC_PAYFAST_PASSPHRASE" "$SANDBOX_PASSPHRASE"
update_env_var "EXPO_PUBLIC_PAYFAST_ENV" "sandbox"

# Set development URLs
update_env_var "EXPO_PUBLIC_WEB_URL" "http://localhost:8081"
update_env_var "PAYFAST_RETURN_URL" "http://localhost:8081/payment/success"
update_env_var "PAYFAST_CANCEL_URL" "http://localhost:8081/payment/cancel"
update_env_var "PAYFAST_NOTIFY_URL" "http://localhost:8081/api/webhooks/payfast"

# Set other development flags
update_env_var "EXPO_PUBLIC_ENVIRONMENT" "development"
update_env_var "EXPO_PUBLIC_DEBUG_MODE" "true"

echo "✅ PayFast Sandbox Configuration Complete!"
echo ""
echo "📋 Configuration Summary:"
echo "  Merchant ID: $SANDBOX_MERCHANT_ID"
echo "  Environment: sandbox"
echo "  Return URL: http://localhost:8081/payment/success"
echo "  Cancel URL: http://localhost:8081/payment/cancel"
echo "  Notify URL: http://localhost:8081/api/webhooks/payfast"
echo ""
echo "🧪 Testing Information:"
echo "  Use PayFast sandbox test cards:"
echo "  - Card Number: 5200000000000015"
echo "  - CVV: 123"
echo "  - Expiry: Any future date"
echo ""
echo "🔄 Next Steps:"
echo "  1. Restart your development server"
echo "  2. Test subscription flow with sandbox credentials" 
echo "  3. Check webhook logs in your terminal"
echo "  4. Use PayFast testing guide: https://developers.payfast.co.za/docs#testing"
echo ""
echo "⚠️  Remember: These are test credentials. Never use in production!"

# Optional: Show current PayFast configuration
echo ""
echo "🔍 Current PayFast Configuration:"
echo "EXPO_PUBLIC_PAYFAST_MERCHANT_ID=$(grep '^EXPO_PUBLIC_PAYFAST_MERCHANT_ID=' .env.local 2>/dev/null | cut -d'=' -f2)"
echo "EXPO_PUBLIC_PAYFAST_ENV=$(grep '^EXPO_PUBLIC_PAYFAST_ENV=' .env.local 2>/dev/null | cut -d'=' -f2)"
