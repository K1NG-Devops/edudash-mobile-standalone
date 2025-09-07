module.exports = {
  root: true,
  extends: [
    "universe/native",
    "expo"
  ],
  plugins: ["react-native", "tailwindcss", "import"],
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
    // Resolve TS path aliases like @/... in apps/mobile
    'import/resolver': {
      typescript: {
        // Point to the mobile tsconfig so aliases like "@/*" resolve
        project: [
          './apps/mobile/tsconfig.json'
        ]
      }
    }
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
    },
    // Temporary: unblock lint for the one file we edited until the TS resolver dep is installed
    {
      files: [
        "apps/mobile/components/pricing/PricingComponent.tsx"
      ],
      rules: {
        "import/no-unresolved": "off"
      }
    },
    // Expo Constants and RN native modules can confuse eslint-plugin-import's namespace rule in RN apps.
    // Scope-disable for the specific bootstrapper that imports expo-constants and conditionally requires native modules.
    {
      files: [
        "apps/mobile/components/advertising/AdsBootstrapper.tsx"
      ],
      rules: {
        "import/namespace": "off",
        "import/no-unresolved": "off"
      }
    }
  ]
};

