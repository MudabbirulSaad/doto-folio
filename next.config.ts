import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Temporarily disable ESLint during builds for API optimization files
    ignoreDuringBuilds: false,
  },
  typescript: {
    // Temporarily allow TypeScript errors during builds for API optimization
    ignoreBuildErrors: false,
  },
}

export default nextConfig;
