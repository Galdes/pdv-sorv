import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: '.next',
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
