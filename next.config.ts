import type { NextConfig } from "next";

const isProduction = process.env.NODE_ENV === "production";
const isVercelBuild = process.env.VERCEL === "1";
const configuredApiOrigin = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL;

if (isProduction && isVercelBuild && !configuredApiOrigin) {
  console.warn(
    "⚠️  WARNING: API_BASE_URL (or NEXT_PUBLIC_API_BASE_URL) is not set. " +
    "API calls will be forwarded to http://127.0.0.1:8000 which may not work in production. " +
    "Set the environment variable in Vercel project settings."
  );
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
