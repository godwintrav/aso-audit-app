import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ASO Audit Agent",
  description: "AI-powered Apple App Store optimization audits.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
