import 'dotenv/config';

export default {
  expo: {
    name: "EduDash Pro Mobile",
    slug: "edudash-pro-mobile",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "edudashpro",
    userInterfaceStyle: "automatic",
    owner: "k1ng-devops",
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.edudashpro.mobile"
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      edgeToEdgeEnabled: true,
      package: "com.edudashpro.mobile"
    },
    web: {
      bundler: "metro",
      output: "static",
      favicon: "./assets/images/favicon.png"
    },
    plugins: [
      "expo-router",
      [
        "expo-splash-screen",
        {
          image: "./assets/images/splash-icon.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#ffffff"
        }
      ]
    ],
    experiments: {
      typedRoutes: true
    },
    extra: {
      router: {},
      eas: {
        projectId: "09b1f081-3817-49b2-882f-ca873dc2e9ec"
      },
      // Expose environment variables through extra
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    },
    runtimeVersion: {
      policy: "appVersion"
    },
    updates: {
      url: "https://u.expo.dev/33a263ac-0d01-480c-bc1b-384873cd2b47"
    }
  }
};
