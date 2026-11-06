import type { Metadata, Viewport } from "next";
import "./globals.css";
import { profile } from "./data";

export const metadata: Metadata = {
  title: `${profile.fullName} — ${profile.role}`,
  description: profile.tagline.replace(/\*\*/g, ""),
  openGraph: {
    title: `${profile.fullName} — ${profile.role}`,
    description: profile.tagline.replace(/\*\*/g, ""),
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#050505",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Caveat:wght@600&family=JetBrains+Mono:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
