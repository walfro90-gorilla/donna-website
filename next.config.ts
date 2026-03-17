import type { NextConfig } from "next";
import { join } from "path";

const nextConfig: NextConfig = {
  // Silence workspace root warning by explicitly setting the tracing root
  outputFileTracingRoot: join(__dirname),

  eslint: {
    ignoreDuringBuilds: false,
  },

  typescript: {
    ignoreBuildErrors: false,
  },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'i.pravatar.cc',
      },
      {
        protocol: 'https',
        hostname: 'placehold.co',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'flagcdn.com',
      },
    ],
    qualities: [25, 50, 75, 85, 100],
  },
};

export default nextConfig;
