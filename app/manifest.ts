import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "A×D — Our Growth Universe",
    short_name: "A×D",
    start_url: "/",
    display: "standalone",
    background_color: "#120b07",
    theme_color: "#120b07",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
