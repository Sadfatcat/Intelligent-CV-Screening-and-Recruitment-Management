import type { NextConfig } from "next";

const backendApiOrigin = (process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000").replace(/\/$/, "");

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${backendApiOrigin}/api/:path*`,
      },
      {
        source: "/uploads/:path*",
        destination: `${backendApiOrigin}/uploads/:path*`,
      },
    ];
  },
};

export default nextConfig;
