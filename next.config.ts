import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Fully static build: `npm run build` writes ./out, which any static host can serve
  // (Netlify drag-and-drop, Vercel, GitHub Pages…). Sync goes browser → Supabase directly.
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
