import type { Metadata } from "next";
import { COMPANY, PRODUCTION_DOMAIN, siteUrl } from "@/lib/config/site";

export const DEFAULT_OG_IMAGE = `${PRODUCTION_DOMAIN}/brand/logo.png`;

export function buildMetadata(opts: {
  title: string;
  description: string;
  path: string;
  image?: string | null;
  noindex?: boolean;
}): Metadata {
  const cleanPath = opts.path === "/" ? "" : opts.path.startsWith("/") ? opts.path : `/${opts.path}`;
  const url = `${siteUrl()}${cleanPath || "/"}`;
  const imageUrl = opts.image || DEFAULT_OG_IMAGE;

  // If title already contains company name or is homepage, set absolute to avoid Next.js title template duplication
  const titleObj =
    opts.path === "/" || opts.title.includes(COMPANY.name) || opts.title.includes(COMPANY.shortName)
      ? { absolute: opts.title }
      : opts.title;

  return {
    title: titleObj,
    description: opts.description,
    metadataBase: new URL(siteUrl()),
    alternates: {
      canonical: url,
    },
    robots: opts.noindex
      ? { index: false, follow: false, nocache: true }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-video-preview": -1,
            "max-image-preview": "large",
            "max-snippet": -1,
          },
        },
    openGraph: {
      title: opts.title,
      description: opts.description,
      url,
      siteName: COMPANY.brandName || "BAM Metal UAE",
      type: "website",
      locale: "en_AE",
      images: [
        {
          url: imageUrl,
          width: opts.image ? 1200 : 747,
          height: opts.image ? 630 : 403,
          alt: opts.title,
        },
      ],
    },
    twitter: {
      card: opts.image ? "summary_large_image" : "summary",
      title: opts.title,
      description: opts.description,
      images: [imageUrl],
    },
  };
}

export const ADMIN_METADATA: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false, nocache: true },
};
