// Metro configuration for Expo/React Native
// Reduce watcher load and add simple path alias

const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');
// Note: Avoid using metro-config's exclusionList for cross-env compatibility.
// We'll build a single RegExp manually for blockList.

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Path alias
config.resolver.alias = {
  '@': path.resolve(__dirname, './'),
};

// Helper to escape regex special chars
function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Exclude only specific project directories by absolute path.
// Avoid broad patterns that could unintentionally match files in node_modules.
const blockListDirs = [
  '.git',
  '.expo',
  '.cache',
  '.cursor',
  'android/build',
  'ios/build',
  'web/dist',
  'web/build',
  'archive',
  'docs',
  // 'scripts', // uncomment if you need to exclude your root scripts dir
];

const blockListRegexParts = blockListDirs.map((rel) => `${escapeRegExp(path.resolve(__dirname, rel))}/.*`);
config.resolver.blockList = new RegExp(blockListRegexParts.join('|'));

// Ensure extensions include ts/tsx/jsx (dedup)
config.resolver.sourceExts = Array.from(new Set([
  ...config.resolver.sourceExts,
  'ts',
  'tsx',
  'jsx',
]));

module.exports = config;
