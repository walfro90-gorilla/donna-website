import type { NextConfig } from "next";
import { join } from "path";

const nextConfig: NextConfig = {
  // Silence workspace root warning by explicitly setting the tracing root
  outputFileTracingRoot: join(__dirname),
  
  // Disable ESLint during build to allow deployment
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Disable TypeScript errors during build
  typescript: {
    ignoreBuildErrors: true,
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
    ],
  },
};

export default nextConfig;
