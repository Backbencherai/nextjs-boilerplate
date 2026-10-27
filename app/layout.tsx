import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Orvia — AI that runs your company",
  description: "Autonomous AI agents for strategy, engineering, marketing and support. Plans in INR.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
