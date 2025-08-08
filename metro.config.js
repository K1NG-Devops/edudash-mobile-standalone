const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Configure resolver
config.resolver.alias = {
  '@': path.resolve(__dirname, './'),
};

// Exclude Node.js scripts and problematic files from bundling
config.resolver.blockList = [
  /.*\.bak$/,
  /scripts\/.*\.js$/,
  /.*_test\.js$/,
  /.*\.test\.js$/,
  /check_.*\.js$/,
  /fix_.*\.js$/,
  /test_.*\.js$/,
  /create_.*\.js$/,
  /complete_.*\.js$/,
  /quick_.*\.js$/,
  /verify_.*\.js$/,
  /simple_.*\.js$/,
  /inspect_.*\.js$/,
  /.*\.sql$/,
  /database-migrations\/.*$/,
  /logs\/.*$/,
];

// Ensure proper file extensions are handled
config.resolver.sourceExts = [
  ...config.resolver.sourceExts,
  'jsx',
  'ts',
  'tsx'
];

module.exports = config;
