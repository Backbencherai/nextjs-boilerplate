import type { Metadata, Viewport } from "next";
import "./globals.css";
import { LanguageProvider } from "@/components/LanguageProvider";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SafetyBanner } from "@/components/SafetyBanner";

export const metadata: Metadata = {
  title: { default: "Swasth Setu — Your health. Better understood.", template: "%s | Swasth Setu" },
  description:
    "Swasth Setu is a health education and care-navigation platform: explore the human body, understand reports, learn first aid and find your next step.",
  applicationName: "Swasth Setu",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#0f766e" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <LanguageProvider>
          <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-white focus:p-3">
            Skip to content
          </a>
          <SafetyBanner />
          <Header />
          <main id="main">{children}</main>
          <Footer />
        </LanguageProvider>
      </body>
    </html>
  );
}
