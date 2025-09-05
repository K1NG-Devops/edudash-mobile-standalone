import path from "node:path";

const nextConfig = {
  experimental: {
    transpilePackages: ["@edudash/ui", "@edudash/api", "@edudash/types"]
  },
  webpack: (config) => {
    config.resolve.alias["react-native$"] = "react-native-web";
    return config;
  }
};

export default nextConfig;

