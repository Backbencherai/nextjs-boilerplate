import type { Metadata, Viewport } from "next";
import "@fontsource/luckiest-guy/latin-400.css";
import "@fontsource/nunito/latin-600.css";
import "@fontsource/nunito/latin-700.css";
import "@fontsource/nunito/latin-800.css";
import "@fontsource/nunito/latin-900.css";
import { Shell } from "@/components/Shell";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bhavan's Multiplayer",
  description: "Build a country with your real life. A 30-day multiplayer world of cities, banks, flights, partnerships, disasters and wars.",
  applicationName: "Bhavan's Multiplayer",
  appleWebApp: { capable: true, title: "Bhavan's", statusBarStyle: "default" },
  other: { "apple-mobile-web-app-capable": "yes", "format-detection": "telephone=no" },
  icons: { icon: [{ url: "/icon-192.png", sizes: "192x192" }, { url: "/icon.svg" }], apple: "/apple-touch-icon.png" },
};
export const viewport: Viewport = { themeColor: "#f6f4ee", width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
