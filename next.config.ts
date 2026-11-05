import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // `npm run export` sets STATIC_EXPORT=1 to produce plain HTML/CSS/JS files
  // (no server needed — e.g. for viewing on a phone with Termux).
  output: process.env.STATIC_EXPORT ? "export" : undefined,
};

export default nextConfig;
