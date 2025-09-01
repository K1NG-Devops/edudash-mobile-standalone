// Metro configuration for Expo/React Native
// Reduce watcher load and add simple path alias

const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');
const exclusionList = require('metro-config/src/defaults/exclusionList');
const { withNativeWind } = require('nativewind/metro');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Path alias (handled by Babel's module-resolver). Avoid duplicating here to reduce risk of virtual modules.
// config.resolver.alias = {
//   '@': path.resolve(__dirname, './'),
// };

// Exclusions (use Metro's exclusionList to create a single RegExp)
// IMPORTANT: Do not exclude broad patterns that could match inside node_modules.
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
config.resolver.mainFields = ['react-native', 'browser', 'main'];

// Platform-specific platform overrides
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Platform-specific resolver removed - no custom module resolution needed

// Export config with NativeWind
module.exports = withNativeWind(config, { input: './global.css' });
