import type { NextConfig } from "next";

// Server-authoritative game: pages + API routes (deploy on Vercel; data in Upstash Redis).
const nextConfig: NextConfig = {
  trailingSlash: true,
  images: { unoptimized: true },
  turbopack: { root: __dirname },
};

export default nextConfig;
