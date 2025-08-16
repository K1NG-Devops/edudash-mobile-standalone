#!/usr/bin/env node

const { execSync } = require('child_process');
const os = require('os');

console.log('🔍 EduDash Pro - Expo Go Connection Debugging\n');

// Get network information
function getNetworkInfo() {
  const interfaces = os.networkInterfaces();
  const ips = [];
  
  Object.keys(interfaces).forEach(name => {
    interfaces[name].forEach(interface => {
      if (interface.family === 'IPv4' && !interface.internal) {
        ips.push({ name, ip: interface.address });
      }
    });
  });
  
  return ips;
}

// Check if ports are available
function checkPort(port) {
  try {
    execSync(`netstat -tuln | grep :${port}`, { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

// Display network info
console.log('📡 Network Information:');
const networks = getNetworkInfo();
networks.forEach(({ name, ip }) => {
  console.log(`   ${name}: ${ip}`);
});

console.log('\n🔌 Port Status:');
[8081, 8082, 19000, 19001, 19002].forEach(port => {
  const inUse = checkPort(port);
  console.log(`   Port ${port}: ${inUse ? '🔴 In Use' : '🟢 Available'}`);
});

console.log('\n📋 Connection Options:');

networks.forEach(({ name, ip }) => {
  console.log(`\n📱 ${name.toUpperCase()} (${ip}):`);
  console.log(`   QR Code URL: exp://${ip}:8082`);
  console.log(`   Web URL: http://${ip}:8082`);
  console.log(`   Manual Entry: exp://${ip}:8082`);
});

console.log('\n🚀 Quick Start Commands:');
console.log('   npm start --clear          # Clear cache and start');
console.log('   npm start --lan           # Force LAN mode');  
console.log('   npm start --localhost     # Force localhost only');
console.log('   npm start --tunnel        # Use tunnel (requires ngrok)');
console.log('   npm run web              # Test web version first');

console.log('\n🔧 Troubleshooting Steps:');
console.log('   1. Ensure phone and computer are on same WiFi');
console.log('   2. Try web version first: npm run web');
console.log('   3. Disable any VPN or firewall temporarily');
console.log('   4. Try manual URL entry in Expo Go');
console.log('   5. Restart Expo Go app completely');
console.log('   6. Clear Expo cache: expo start --clear');

console.log('\n📞 If still failing, try:');
console.log('   • expo doctor              # Check Expo setup');
console.log('   • expo install             # Fix dependencies');
console.log('   • rm -rf node_modules && npm install  # Clean install');
