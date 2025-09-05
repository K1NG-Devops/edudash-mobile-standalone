const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/** @type {import('metro-config').ConfigT} */
const config = getDefaultConfig(__dirname);

// Enable linked workspace packages (packages/*)
config.resolver = config.resolver || {};
config.resolver.unstable_enableSymlinks = true;
config.watchFolders = [path.resolve(__dirname, '../../packages')];

module.exports = config;

