#!/usr/bin/env node

const requiredVars = [
  'EXPO_PUBLIC_SUPABASE_URL',
  'EXPO_PUBLIC_SUPABASE_ANON_KEY',
  'EXPO_PUBLIC_APP_NAME',
  'EXPO_PUBLIC_ENVIRONMENT'
];

const optionalVars = [
  'EXPO_PUBLIC_PAYFAST_MERCHANT_ID',
  'EXPO_PUBLIC_ADMOB_ANDROID_APP_ID',
  'EXPO_PUBLIC_ADMOB_IOS_APP_ID',
  'EXPO_PUBLIC_ENABLE_ADS',
  'EXPO_PUBLIC_DEBUG_MODE'
];

console.log('🔍 EduDash Pro Environment Variables Check\n');

// Check required variables
let allRequired = true;
console.log('📋 Required Variables:');
requiredVars.forEach(varName => {
  const isSet = !!process.env[varName];
  const status = isSet ? '✅' : '❌';
  const value = isSet ? (varName.includes('KEY') ? '[HIDDEN]' : process.env[varName]) : 'Not Set';
  
  console.log(`  ${status} ${varName}: ${value}`);
  if (!isSet) allRequired = false;
});

console.log('\n📝 Optional Variables:');
optionalVars.forEach(varName => {
  const isSet = !!process.env[varName];
  const status = isSet ? '✅' : '⚠️ ';
  const value = isSet ? (varName.includes('KEY') ? '[HIDDEN]' : process.env[varName]) : 'Not Set';
  
  console.log(`  ${status} ${varName}: ${value}`);
});

// Environment-specific checks
console.log('\n🌍 Environment Configuration:');
const environment = process.env.EXPO_PUBLIC_ENVIRONMENT || 'unknown';
const debugMode = process.env.EXPO_PUBLIC_DEBUG_MODE === 'true';

console.log(`  Environment: ${environment}`);
console.log(`  Debug Mode: ${debugMode ? 'Enabled' : 'Disabled'}`);

if (environment === 'production') {
  console.log('\n🚀 Production Checklist:');
  console.log(`  ${debugMode ? '❌' : '✅'} Debug mode disabled`);
  console.log(`  ${process.env.EXPO_PUBLIC_ENABLE_ADS === 'true' ? '✅' : '⚠️ '} Ads enabled`);
  console.log(`  ${process.env.EXPO_PUBLIC_EMAIL_MOCK_MODE === 'false' ? '✅' : '⚠️ '} Email mock mode disabled`);
}

// Summary
console.log('\n📊 Summary:');
if (allRequired) {
  console.log('✅ All required environment variables are configured!');
  
  if (environment === 'production') {
    console.log('🚀 Ready for production deployment');
  } else {
    console.log('🛠️  Ready for development');
  }
} else {
  console.log('❌ Some required environment variables are missing.');
  console.log('📖 Please check ENVIRONMENT_SETUP.md for configuration instructions.');
  process.exit(1);
}

// Feature flags summary
console.log('\n🎛️  Feature Flags:');
const features = {
  'AI Features': process.env.EXPO_PUBLIC_ENABLE_AI_FEATURES === 'true',
  'Ads': process.env.EXPO_PUBLIC_ENABLE_ADS === 'true',
  'Analytics': process.env.EXPO_PUBLIC_ENABLE_ANALYTICS === 'true',
  'Push Notifications': process.env.EXPO_PUBLIC_ENABLE_PUSH_NOTIFICATIONS === 'true',
  'Premium Features': process.env.EXPO_PUBLIC_ENABLE_PREMIUM_FEATURES === 'true'
};

Object.entries(features).forEach(([feature, enabled]) => {
  console.log(`  ${enabled ? '✅' : '❌'} ${feature}`);
});

console.log('\n🎉 Environment check complete!');
