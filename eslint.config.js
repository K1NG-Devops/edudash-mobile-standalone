// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const reactNative = require('eslint-plugin-react-native');

module.exports = defineConfig([
  // Global ignores so other configs (like expoConfig) also skip these paths
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'android/**',
      'ios/**',
      'archive/**',
      'scripts/**',
      'project-scripts/**',
      'supabase/functions/**',
      'app/api/**',
      'legacy/_excluded/**'
    ],
  },
  expoConfig,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'module',
    },
    plugins: {
      'react-native': reactNative,
    },
    rules: {
      'react/no-unescaped-entities': 'off',
      'react-hooks/rules-of-hooks': 'off',
      'react-native/no-raw-text': 'error',
    },
  },
]);
