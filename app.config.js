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
    newArchEnabled: true,
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.edudashpro.app"
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      package: "com.edudashpro.app",
      versionCode: 1,
      permissions: [
        "INTERNET",
        "CAMERA"
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
        projectId: "b1fd3356-08ed-4331-92b5-52a7be4cd4bc"
      }
    },
    updates: {
      url: "https://u.expo.dev/b1fd3356-08ed-4331-92b5-52a7be4cd4bc"
    }
  }
};
