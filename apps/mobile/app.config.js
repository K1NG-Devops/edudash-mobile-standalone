import * as dotenv from 'dotenv';
import fs from 'fs';

// Load env with override so .env values take precedence over process env in dev
try {
  if (fs.existsSync('.env')) {
    dotenv.config({ path: '.env', override: true });
  }
  if (fs.existsSync('.env.local')) {
    // Optional local overrides; ensure keys are valid VAR=VALUE lines
    dotenv.config({ path: '.env.local', override: true });
  }
} catch {}

const hasGoogleServices = fs.existsSync('./android/app/google-services.json');
const buildProfile = process.env.EAS_BUILD_PROFILE || '';
const isProd = buildProfile === 'production' || process.env.NODE_ENV === 'production';

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
        "applinks:www.edudashpro.org.za",
        "applinks:edudashpro.org.za"
      ],
      infoPlist: {
        NSMicrophoneUsageDescription: "Allow the app to access your microphone for voice messages."
      }
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
        "POST_NOTIFICATIONS",
        // Audio recording permissions for voice messages
        "RECORD_AUDIO",
        "MODIFY_AUDIO_SETTINGS"
      ],
      // Point to Firebase config when available (dev optional, prod enforced by Gradle)
      ...(hasGoogleServices ? { googleServicesFile: "./android/app/google-services.json" } : {}),
      edgeToEdgeEnabled: true,
      // Enable Android App Links so https://www.edudashpro.org.za/open in the app
      intentFilters: [
        {
          action: "VIEW",
          data: [
            { scheme: "https", host: "www.edudashpro.org.za", pathPrefix: "/" },
            { scheme: "https", host: "edudashpro.org.za", pathPrefix: "/" }
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
      "expo-av",
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
