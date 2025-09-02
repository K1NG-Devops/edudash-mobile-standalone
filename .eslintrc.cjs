module.exports = {
  root: true,
  extends: [
    "universe/native",
    "expo"
  ],
  plugins: ["react-native", "tailwindcss"],
  env: {
    es6: true,
    node: true,
    jest: true,
  },
  settings: {
    react: {
      version: "detect",
    },
    tailwindcss: {
      callees: ["cn", "clsx"],
      config: "tailwind.config.js",
    },
  },
  rules: {
    // Prefer NativeWind className over StyleSheet for new UI
    "no-restricted-imports": [
      "warn",
      {
        paths: [
          {
            name: "react-native",
            importNames: ["StyleSheet"],
            message: "Prefer className with NativeWind over StyleSheet for new UI."
          }
        ]
      }
    ],
    // Keep RN-specific linting helpful
    "react-native/no-inline-styles": "off", // acceptable when using className + small overrides
    "tailwindcss/classnames-order": "warn",
    "tailwindcss/no-custom-classname": "off"
  },
  overrides: [
    {
      files: [
        "**/legacy/**",
        "**/*.stories.*",
        "**/__tests__/**"
      ],
      rules: {
        "no-restricted-imports": "off"
      }
    }
  ]
};

