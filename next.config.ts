import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable React Strict Mode to fix EditorJS double initialization issue
  // This is a known issue with EditorJS and React Strict Mode
  reactStrictMode: false,
  allowedDevOrigins: ['127.0.0.1'],
}

export default nextConfig;
