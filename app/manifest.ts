import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "A×D — Our Growth Universe",
    short_name: "A×D",
    id: "/",
    start_url: "/?source=app",
    scope: "/",
    display_override: ["standalone", "minimal-ui"],
    categories: ["health", "lifestyle", "games", "productivity"],
    shortcuts: [
      { name: "Start studying", short_name: "Study", url: "/?quick=study", icons: [{ src: "/icon-192.png", sizes: "192x192" }] },
      { name: "Start a workout", short_name: "Workout", url: "/?quick=workout", icons: [{ src: "/icon-192.png", sizes: "192x192" }] },
      { name: "Drink a glass of water", short_name: "Water", url: "/?quick=water", icons: [{ src: "/icon-192.png", sizes: "192x192" }] },
      { name: "Enter the world", short_name: "World", url: "/world/", icons: [{ src: "/icon-192.png", sizes: "192x192" }] },
    ],
    prefer_related_applications: false,
    display: "standalone",
    background_color: "#f4f3ef",
    theme_color: "#f4f3ef",
    description: "Adarsh × Dewanshi — level up in real life, together. A private multiplayer world for two.",
    orientation: "portrait",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
    ],
  };
}
