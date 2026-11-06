import type { Metadata, Viewport } from "next";
import "./globals.css";
import { profile } from "./data";

export const metadata: Metadata = {
  title: `${profile.fullName} — ${profile.role}`,
  description: profile.tagline,
  openGraph: {
    title: `${profile.fullName} — ${profile.role}`,
    description: profile.tagline,
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0b1a2e",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Caveat:wght@600&family=JetBrains+Mono:wght@400;600&family=Lato:wght@300;400;700;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
