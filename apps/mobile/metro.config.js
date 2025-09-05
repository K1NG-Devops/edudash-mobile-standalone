const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

/** @type {import('metro-config').ConfigT} */
const config = getDefaultConfig(__dirname);

// Keep the project root explicit
config.projectRoot = __dirname;

// Enable linked workspace packages (packages/*)
config.resolver = config.resolver || {};
config.resolver.unstable_enableSymlinks = true;
config.watchFolders = [path.resolve(__dirname, '../../packages')];

// Use NativeWind so global.css @tailwind directives are handled gracefully
module.exports = withNativeWind(config, { input: './global.css' });

