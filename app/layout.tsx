import type { Metadata, Viewport } from "next";
import { Anton, Inter_Tight } from "next/font/google";
import "./globals.css";
import { profile } from "@/lib/content";

const display = Anton({ variable: "--font-display", subsets: ["latin"], weight: "400" });
const sans = Inter_Tight({ variable: "--font-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: `${profile.firstName} ${profile.lastName} — Portfolio`,
  description: profile.intro,
};

export const viewport: Viewport = { themeColor: "#fbe3e3" };

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="is-loading">
      <body className={`${display.variable} ${sans.variable}`}>{children}</body>
    </html>
  );
}
