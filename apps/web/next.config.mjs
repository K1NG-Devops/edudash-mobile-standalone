import path from "node:path";

const EXPO_WEB_ORIGIN = process.env.EXPO_WEB_ORIGIN || 'http://localhost:19006';

const nextConfig = {
  transpilePackages: ["@edudash/ui", "@edudash/api", "@edudash/types"],
  webpack: (config) => {
    config.resolve = config.resolve || {};
    config.resolve.alias = config.resolve.alias || {};

    // Ensure RN imports resolve to web implementation
    config.resolve.alias["react-native$"] = "react-native-web";

    // Prevent accidental resolution of native-only modules in the web app
    config.resolve.alias["expo"] = false;
    config.resolve.alias["expo-router"] = false;
    config.resolve.alias["react-native-reanimated"] = false;

    return config;
  },
  // Dev-only: proxy all routes (except Next internals) to Expo Web dev server
  async rewrites() {
    if (process.env.PROXY_EXPO_WEB === '1') {
      return [
        { source: '/', destination: `${EXPO_WEB_ORIGIN}/` },
        { source: '/:path((?!_next|favicon\\.ico|robots\\.txt).*)', destination: `${EXPO_WEB_ORIGIN}/:path*` },
      ];
    }
    return [];
  },
};

export default nextConfig;

