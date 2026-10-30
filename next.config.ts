import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  agentRules: false,
  distDir: process.env.NEXT_DIST_DIR || '.next',
  experimental: { cpus: 2 },
};

export default nextConfig;
