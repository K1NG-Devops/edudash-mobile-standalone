// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  // Global ignores so other configs (like expoConfig) also skip these paths
  {
    ignores: ['dist/**', 'node_modules/**', 'android/**', 'ios/**', 'archive/**', 'scripts/**', 'supabase/functions/**'],
  },
  expoConfig,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'module',
    },
    rules: {
      'react/no-unescaped-entities': 'off',
      'react-hooks/rules-of-hooks': 'off',
    },
  },
]);
