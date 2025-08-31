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
      'legacy/_excluded/**',
      '.expo/**'
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
      // RN/Expo typical allowances to reduce noise for production prep
      'react/no-unescaped-entities': 'off',
      'react-hooks/rules-of-hooks': 'off',
      'react-hooks/exhaustive-deps': 'off',
      'react-native/no-raw-text': 'error',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/array-type': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      'import/no-duplicates': 'off',
      'no-unreachable': 'off',
      'import/first': 'off'
    },
  },
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'module',
    },
    rules: {
      'no-unused-vars': 'off',
    },
  },
]);
