import type { NextConfig } from "next";

// Fully static build -> ./out (Netlify drop, Vercel, any static host). Multiplayer runs browser <-> relay.
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  turbopack: { root: __dirname },
};

export default nextConfig;
