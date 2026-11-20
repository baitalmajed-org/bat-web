import type { Metadata, Viewport } from "next";
import { COMPANY, siteUrl } from "@/lib/config/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: `${COMPANY.name} | Steel Fabrication & Industrial Equipment UAE`,
    template: `%s | ${COMPANY.name}`,
  },
  description:
    "Bait Al Majed Metal Works is a steel fabrication and metal works company in Ajman, UAE. Explore welded wheelbarrows, gas cylinder trolleys, lifting cages, concrete buckets and custom steel products.",
  applicationName: "BAM Metal UAE",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.png", type: "image/png", sizes: "192x192" },
      { url: "/favicon-96.png", type: "image/png", sizes: "96x96" },
    ],
    apple: [
      { url: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#791A30" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
