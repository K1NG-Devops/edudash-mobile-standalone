#!/usr/bin/env node

/**
 * Clear Cache Script for EduDash Pro Mobile
 * 
 * This script clears all cached data that might be causing stale data issues
 */

console.log('🧹 EduDash Pro - Cache Clearing Script');
console.log('=====================================');

const path = require('path');
const fs = require('fs');

// Clear Metro bundler cache
console.log('📦 Clearing Metro bundler cache...');
try {
  const { execSync } = require('child_process');
  execSync('npx expo start --clear', { stdio: 'inherit' });
} catch (error) {
  console.log('⚠️  Metro cache clear failed (this is normal if not running)');
}

// Clear node_modules/.cache if it exists
const cacheDir = path.join(__dirname, 'node_modules', '.cache');
if (fs.existsSync(cacheDir)) {
  console.log('🗂️  Clearing node_modules cache...');
  try {
    fs.rmSync(cacheDir, { recursive: true, force: true });
    console.log('✅ Node modules cache cleared');
  } catch (error) {
    console.log('⚠️  Failed to clear node_modules cache:', error.message);
  }
} else {
  console.log('ℹ️  No node_modules cache found');
}

// Clear .expo cache
const expoCacheDir = path.join(__dirname, '.expo');
if (fs.existsSync(expoCacheDir)) {
  console.log('🎯 Clearing .expo cache...');
  try {
    fs.rmSync(expoCacheDir, { recursive: true, force: true });
    console.log('✅ .expo cache cleared');
  } catch (error) {
    console.log('⚠️  Failed to clear .expo cache:', error.message);
  }
} else {
  console.log('ℹ️  No .expo cache found');
}

console.log('');
console.log('🎉 Cache clearing complete!');
console.log('');
console.log('📝 Next steps:');
console.log('1. Stop any running development servers');
console.log('2. Run: npm start');
console.log('3. If issues persist, run: npm install');
console.log('');
console.log('💡 To clear app storage data:');
console.log('   - On iOS Simulator: Device > Erase All Content and Settings');
console.log('   - On Android Emulator: Settings > Apps > Expo Go > Storage > Clear Data');
console.log('   - On physical device: Uninstall and reinstall Expo Go');
