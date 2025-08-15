import 'dotenv/config';

export default {
  expo: {
    name: "EduDash Pro Mobile",
    slug: "edudashpro-app",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "edudashpro",
    userInterfaceStyle: "automatic",
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.edudashpro.app"
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      edgeToEdgeEnabled: true,
      package: "com.edudashpro.app"
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
      typedRoutes: false
    },
    extra: {
      router: {},
      eas: {
        projectId: "b1fd3356-08ed-4331-92b5-52a7be4cd4bc"
      }
    },
    runtimeVersion: "1.0.0",
    updates: {
      url: "https://u.expo.dev/b1fd3356-08ed-4331-92b5-52a7be4cd4bc"
    }
  }
};
