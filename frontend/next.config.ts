import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  allowedDevOrigins: ["172.20.10.4", "localhost:3000"]
} as any;

export default nextConfig;
