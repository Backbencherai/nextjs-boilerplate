import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Instrument_Serif, JetBrains_Mono } from "next/font/google";
import { Shell } from "@/components/Shell";
import "./globals.css";

const display = Bricolage_Grotesque({ variable: "--font-display", subsets: ["latin"], weight: ["400", "600", "800"] });
const serif = Instrument_Serif({ variable: "--font-serif", subsets: ["latin"], weight: "400", style: ["normal", "italic"] });
const mono = JetBrains_Mono({ variable: "--font-mono", subsets: ["latin"], weight: ["400", "600"] });

export const metadata: Metadata = {
  title: "A×D — Our Growth Universe",
  description: "A private, explorable 3D world where Adarsh and Devanshi level up in real life — together.",
  robots: { index: false, follow: false },
  appleWebApp: { capable: true, title: "A×D", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  themeColor: "#120b07",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${display.variable} ${serif.variable} ${mono.variable}`}>
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
