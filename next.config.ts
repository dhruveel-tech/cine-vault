import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "image.tmdb.org" },
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "placehold.co" }
    ]
  },
  serverExternalPackages: ["mongoose"],
  experimental: {
    esmExternals: "loose"
  } as NextConfig["experimental"],
  webpack: (config) => {
    config.experiments = {
      ...config.experiments,
      topLevelAwait: true
    };
    return config;
  }
};

export default nextConfig;
