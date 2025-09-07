// Mobile-specific ESLint flat config (local to apps/mobile)
// Keeps linting fast and independent from the disabled root config
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const reactNative = require('eslint-plugin-react-native');

module.exports = defineConfig([
  {
    ignores: [
      'node_modules/**',
      'android/**',
      'ios/**',
      '.expo/**',
      'dist/**',
      'build/**',
      'app/_api/**',
    ],
  },
  // Expo/React Native sensible defaults
  expoConfig,
  // Local adjustments to reduce noise and avoid rules requiring plugins not in Expo preset
  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      'react-native': reactNative,
    },
    rules: {
      'react-native/no-inline-styles': 'off',
      'react-native/no-raw-text': 'off',
      'react/no-unescaped-entities': 'off',
      'react-hooks/rules-of-hooks': 'off',
      'import/no-unresolved': 'off',
    },
  },
]);

