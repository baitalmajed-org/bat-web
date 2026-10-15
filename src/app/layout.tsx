import type { Metadata, Viewport } from "next";
import { COMPANY, siteUrl } from "@/lib/config/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: `${COMPANY.name} | Steel Fabrication in Ajman, UAE`, template: `%s | ${COMPANY.name}` },
  description: "Industrial steel fabrication and metal works in Ajman, UAE.",
  applicationName: COMPANY.name,
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#791A30" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
