import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "localhost" },
      { protocol: "http", hostname: "192.168.**" },
    ],
  },
  async rewrites() {
    const target = process.env.NEXT_PUBLIC_API_URL
      ? process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, '')
      : 'http://localhost:5000';
    return [
      {
        source: '/api/:path*',
        destination: `${target}/api/:path*`,
      },
    ];
  },
  turbopack: {
    root: process.cwd(),
  },
  allowedDevOrigins: [
    "http://192.168.100.107:3000",
    "http://localhost:3000",
    "192.168.100.107",
  ],
} as any;

export default nextConfig;
