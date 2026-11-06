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
import "./globals.css";


export const metadata: Metadata = {
  title: "A×D — Our Growth Universe",
  description: "A private, explorable 3D world where Adarsh and Dewanshi level up in real life — together.",
  robots: { index: false, follow: false },
  appleWebApp: { capable: true, title: "A×D", statusBarStyle: "default" },
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
