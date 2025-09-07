// Force Expo to use the legacy Metro serializer to avoid path.relative(undefined) bug
process.env.EXPO_USE_METRO_SERIALIZER_LEGACY = process.env.EXPO_USE_METRO_SERIALIZER_LEGACY || '1';
// Run as a standalone app (disable Expo workspace-root behavior)
process.env.EXPO_NO_METRO_WORKSPACE_ROOT = process.env.EXPO_NO_METRO_WORKSPACE_ROOT || '1';

const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

/** @type {import('metro-config').ConfigT} */
const config = getDefaultConfig(__dirname);

// Keep the project root explicit
config.projectRoot = __dirname;

// Standalone resolution: stay strictly inside the app
config.resolver = config.resolver || {};
config.resolver.unstable_enableSymlinks = false;
config.resolver.disableHierarchicalLookup = true;
config.resolver.nodeModulesPaths = [
  // Only local node_modules (no workspace root)
  path.resolve(__dirname, 'node_modules'),
];

// Do not watch any folders outside the app
config.watchFolders = [];

// Temporarily disable NativeWind Metro plugin to avoid serializer path errors
// You can re-enable once bundling is stable by switching back to withNativeWind(...)
module.exports = config;

