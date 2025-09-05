module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      process.env.NODE_ENV === 'production' && [
        'transform-remove-console',
        { exclude: ['error', 'warn'] },
      ],
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            // Specific overrides first
            '@/i18n': './src/i18n/index',
            '@/design-system': './src/design-system',
            // General root alias
            '@': './',
          },
          extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
        },
      ],
      'react-native-reanimated/plugin', // Must be last
    ].filter(Boolean),
  };
};
