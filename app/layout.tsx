import type { Metadata, Viewport } from "next";
import { Anybody, Inter_Tight } from "next/font/google";
import "./globals.css";
import { profile } from "@/lib/content";

/* Anybody: variable width + weight, used condensed & heavy for display type */
const display = Anybody({ variable: "--font-display", subsets: ["latin"], axes: ["wdth"] });
const sans = Inter_Tight({ variable: "--font-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: `${profile.firstName} ${profile.lastName} — Portfolio`,
  description: profile.headline,
};

export const viewport: Viewport = {
  themeColor: "#fbe3e3",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="is-loading">
      <body className={`${display.variable} ${sans.variable}`}>{children}</body>
    </html>
  );
}
