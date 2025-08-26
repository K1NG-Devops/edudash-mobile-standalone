// Metro configuration for Expo/React Native
// Reduce watcher load and add simple path alias

const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');
const exclusionList = require('metro-config/src/defaults/exclusionList');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Path alias
config.resolver.alias = {
  '@': path.resolve(__dirname, './'),
};

// Exclusions (use Metro's exclusionList to create a single RegExp)
config.resolver.blockList = exclusionList([
  /(^|\/)\.git\//,
  /(^|\/)\.expo\//,
  /(^|\/)\.cache\//,
  /(^|\/)\.cursor\//,
  /(^|\/)android\/build\//,
  /(^|\/)ios\/build\//,
  /(^|\/)web\/dist\//,
  /(^|\/)web\/build\//,
  /(^|\/)archive\//,
  /(^|\/)docs\//,
  /(^|\/)examples\//,
  /(^|\/)node_modules\/.*\/examples\//,
  /(^|\/)\.vscode\//,
  /(^|\/)\.idea\//,
  /(^|\/)backup\//,
  /(^|\/)backups\//,
  /(^|\/)temp\//,
  /(^|\/)tmp\//,
  /.*\.bak$/,
  /.*\.backup$/,
  /.*\.old$/,
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
  /supabase\/logs\/.*$/,
]);

// Ensure extensions include ts/tsx/jsx (dedup)
config.resolver.sourceExts = Array.from(new Set([
  ...config.resolver.sourceExts,
  'ts',
  'tsx',
  'jsx',
]));

// Platform-specific resolver to handle native-only modules on web
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

// Platform-specific platform overrides
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

module.exports = config;
