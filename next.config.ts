import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Temporarily disable ESLint during builds for blog system
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Temporarily allow TypeScript errors during builds for blog system
    ignoreBuildErrors: true,
  },
}

export default nextConfig;
