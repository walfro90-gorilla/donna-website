import type { NextConfig } from "next";
import { join } from "path";

const nextConfig: NextConfig = {
  // Silence workspace root warning by explicitly setting the tracing root
  outputFileTracingRoot: join(__dirname),
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
    ],
  },
};

export default nextConfig;
