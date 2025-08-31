import 'dotenv/config';

export default {
  expo: {
    name: "EduDash Pro",
    slug: "edudashpro-app",
    version: "1.0.1",
    runtimeVersion: "1.0.1",
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
        "applinks:www.edudashpro.org.za"
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
        "CAMERA",
        // Android 13+ runtime permission for notifications
        "POST_NOTIFICATIONS"
      ],
      // If you add your Firebase config, point to it here (required for background push on Android)
      googleServicesFile: "./android/app/google-services.json",
      edgeToEdgeEnabled: true,
      // Enable Android App Links so https://www.edudashpro.org.za/open in the app
      intentFilters: [
        {
          action: "VIEW",
          data: [
            {
              scheme: "https",
              host: "www.edudashpro.org.za",
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
      "expo-notifications",
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
      },
      revenuecat: {
        iosSdkKey: process.env.EXPO_PUBLIC_REVENUECAT_IOS_SDK_KEY || null,
        androidSdkKey: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_SDK_KEY || null
      }
    },
    updates: {
      url: "https://u.expo.dev/b1fd3356-08ed-4331-92b5-52a7be4cd4bc"
    }
  }
};
