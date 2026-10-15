import type { Metadata } from "next";
import { COMPANY, siteUrl } from "@/lib/config/site";

export function buildMetadata(opts: {
  title: string;
  description: string;
  path: string;
  image?: string | null;
  noindex?: boolean;
}): Metadata {
  const url = `${siteUrl()}${opts.path}`;
  return {
    title: opts.title,
    description: opts.description,
    alternates: { canonical: url },
    robots: opts.noindex ? { index: false, follow: false } : undefined,
    openGraph: {
      title: opts.title,
      description: opts.description,
      url,
      siteName: COMPANY.name,
      type: "website",
      locale: "en_AE",
      images: opts.image ? [{ url: opts.image }] : undefined,
    },
    twitter: { card: opts.image ? "summary_large_image" : "summary", title: opts.title, description: opts.description },
  };
}

export const ADMIN_METADATA: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false, nocache: true },
};
