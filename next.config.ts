import type { NextConfig } from "next";

const isProduction = process.env.NODE_ENV === "production";
const isVercelBuild = process.env.VERCEL === "1";
const configuredApiOrigin = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL;

if (isProduction && isVercelBuild && !configuredApiOrigin) {
  throw new Error("Missing API_BASE_URL (or NEXT_PUBLIC_API_BASE_URL) for production build.");
}

const backendApiOrigin = (configuredApiOrigin || "http://127.0.0.1:8000").replace(/\/$/, "");

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
