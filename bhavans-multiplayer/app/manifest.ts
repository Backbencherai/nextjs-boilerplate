import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Bhavan's Multiplayer",
    short_name: "Bhavan's",
    description: "Build a country with your real life. Multiplayer for everyone, everywhere.",
    start_url: "/?source=app",
    scope: "/",
    display: "standalone",
    display_override: ["standalone", "minimal-ui"],
    orientation: "any",
    background_color: "#f6f4ee",
    theme_color: "#f6f4ee",
    categories: ["games", "health", "education"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "My city", url: "/city/", icons: [{ src: "/icon-192.png", sizes: "192x192" }] },
      { name: "World map", url: "/world/", icons: [{ src: "/icon-192.png", sizes: "192x192" }] },
      { name: "War room", url: "/war/", icons: [{ src: "/icon-192.png", sizes: "192x192" }] },
    ],
  };
}
