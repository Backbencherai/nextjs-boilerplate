import type { Metadata, Viewport } from "next";
import "@fontsource/luckiest-guy/latin-400.css";
import "@fontsource/nunito/latin-400.css";
import "@fontsource/nunito/latin-600.css";
import "@fontsource/nunito/latin-700.css";
import "@fontsource/nunito/latin-800.css";
import "@fontsource/nunito/latin-900.css";
import "@fontsource/nunito/latin-800-italic.css";
import "@fontsource/jetbrains-mono/latin-400.css";
import "@fontsource/jetbrains-mono/latin-600.css";
import { Shell } from "@/components/Shell";

const STARTUP = [{"url": "/splash/splash-1320x2868.png", "media": "(device-width: 440px) and (device-height: 956px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"}, {"url": "/splash/splash-1206x2622.png", "media": "(device-width: 402px) and (device-height: 874px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"}, {"url": "/splash/splash-1290x2796.png", "media": "(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"}, {"url": "/splash/splash-1179x2556.png", "media": "(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"}, {"url": "/splash/splash-1284x2778.png", "media": "(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"}, {"url": "/splash/splash-1170x2532.png", "media": "(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"}, {"url": "/splash/splash-1125x2436.png", "media": "(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"}, {"url": "/splash/splash-1242x2688.png", "media": "(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"}, {"url": "/splash/splash-828x1792.png", "media": "(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"}, {"url": "/splash/splash-750x1334.png", "media": "(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"}, {"url": "/splash/splash-2048x2732.png", "media": "(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"}, {"url": "/splash/splash-1668x2388.png", "media": "(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"}, {"url": "/splash/splash-1640x2360.png", "media": "(device-width: 820px) and (device-height: 1180px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"}, {"url": "/splash/splash-1536x2048.png", "media": "(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"}];
import "./globals.css";


export const metadata: Metadata = {
  title: "A×D — Our Growth Universe",
  description: "A private, explorable 3D world where Adarsh and Dewanshi level up in real life — together.",
  robots: { index: false, follow: false },
  appleWebApp: { capable: true, title: "A×D", statusBarStyle: "default", startupImage: STARTUP },
  // iOS < 16.4 only honours Apple's own tag for full-screen home-screen apps
  other: { "apple-mobile-web-app-capable": "yes", "format-detection": "telephone=no" },
  applicationName: "A×D",
  icons: { icon: [{ url: "/icon-192.png", sizes: "192x192" }, { url: "/icon.svg" }], apple: "/apple-touch-icon.png" },
};

export const viewport: Viewport = {
  themeColor: "#f4f3ef",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
