import 'dotenv/config';

export default {
  expo: {
    name: "EduDash Pro",
    slug: "edudashpro-app",
    version: "1.0.0",
    runtimeVersion: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "edudashpro",
    userInterfaceStyle: "automatic",
    newArchEnabled: false,
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.edudashpro.app",
      // Enable Universal Links for password reset and invitations
      associatedDomains: [
        "applinks:app.edudashpro.org.za"
      ]
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      package: "com.edudashpro.app",
      permissions: [
        "INTERNET",
        "CAMERA"
      ],
      edgeToEdgeEnabled: true,
      // Enable Android App Links so https://app.edudashpro.org.za/open in the app
      intentFilters: [
        {
          action: "VIEW",
          data: [
            {
              scheme: "https",
              host: "app.edudashpro.org.za",
              pathPrefix: "/"
            }
          ],
          category: ["BROWSABLE", "DEFAULT"]
        }
      ]
    },
    web: {
      bundler: "metro",
      output: "static",
      favicon: "./assets/images/favicon.png"
    },
    plugins: [
      "expo-router",
      "expo-dev-client",
      "expo-secure-store",
      [
        "expo-splash-screen",
        {
          image: "./assets/images/splash-icon.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#ffffff"
        }
      ],
      [
        "react-native-google-mobile-ads",
        {
          // Use correct camelCase keys expected by the plugin
          androidAppId: process.env.EXPO_PUBLIC_ADMOB_ANDROID_APP_ID || "ca-app-pub-3940256099942544~3347511713",
          iosAppId: process.env.EXPO_PUBLIC_ADMOB_IOS_APP_ID || "ca-app-pub-3940256099942544~1458002511"
        }
      ]
    ],
    // Some libraries read from this key in app.json/config (kept for compatibility)
    "react-native-google-mobile-ads": {
      android_app_id: process.env.EXPO_PUBLIC_ADMOB_ANDROID_APP_ID || "ca-app-pub-3940256099942544~3347511713",
      ios_app_id: process.env.EXPO_PUBLIC_ADMOB_IOS_APP_ID || "ca-app-pub-3940256099942544~1458002511"
    },
    experiments: {
      typedRoutes: true
    },
    developmentClient: {
      silentLaunch: true
    },
    extra: {
      router: {},
      eas: {
        projectId: "b1fd3356-08ed-4331-92b5-52a7be4cd4bc"
      }
    },
    updates: {
      url: "https://u.expo.dev/b1fd3356-08ed-4331-92b5-52a7be4cd4bc"
    }
  }
};
