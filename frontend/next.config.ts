import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  allowedDevOrigins: [
    "http://192.168.100.107:3000",
    "http://localhost:3000",
    "192.168.100.107",
  ],
} as any;

export default nextConfig;
