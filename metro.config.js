// Metro configuration for Expo/React Native
// Reduce watcher load and add simple path alias

const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');
const exclusionList = require('metro-config/src/defaults/exclusionList');
const { withNativeWind } = require('nativewind/metro');

/**
 * Metro configuration for Expo/React Native
 * For Vercel/CI web exports, we drastically simplify the resolver to avoid
 * edge cases in chunk serialization. Use EXPO_WEB_BUILD=1 to enable minimal config.
 * Otherwise, use the richer local config.
 * @type {import('expo/metro-config').MetroConfig}
 */
function createConfig() {
  const base = getDefaultConfig(__dirname);

  const isWebBuild = process.env.EXPO_WEB_BUILD === '1' || process.env.VERCEL === '1';
  if (isWebBuild) {
    // Minimal, known-safe config for web export
    return withNativeWind({
      ...base,
      resolver: {
        ...base.resolver,
        // Keep default aliasing; avoid custom aliases during CI export
        alias: {
          '@': path.resolve(__dirname, './'),
        },
        // Keep default platform resolution
        mainFields: ['react-native', 'browser', 'main'],
        platforms: ['web'],
        // Exclude server-only API routes from static web export
        blockList: exclusionList([/(^|\/)app\/_api\//]),
      },
    }, { input: './global.css' });
  }

  // Local/dev: full features
  base.resolver.alias = {
    '@': path.resolve(__dirname, './'),
    '@/i18n': path.resolve(__dirname, './src/i18n/index.ts'),
    '@/design-system': path.resolve(__dirname, './src/design-system/index.ts'),
  };

  base.resolver.blockList = exclusionList([
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

  base.resolver.sourceExts = Array.from(new Set([
    ...base.resolver.sourceExts,
    'ts',
    'tsx',
    'jsx',
  ]));

  base.resolver.mainFields = ['react-native', 'browser', 'main'];
  base.resolver.platforms = ['ios', 'android', 'native', 'web'];

  return withNativeWind(base, { input: './global.css' });
}

module.exports = createConfig();
