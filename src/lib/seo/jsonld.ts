import { siteUrl } from "@/lib/config/site";
import type { SiteSettings } from "@/types/db";

export function organizationJsonLd(s: Pick<SiteSettings, "company_name" | "main_phone" | "email" | "address_text" | "facebook_url" | "instagram_url" | "linkedin_url" | "youtube_url">) {
  const sameAs = [s.facebook_url, s.instagram_url, s.linkedin_url, s.youtube_url].filter(Boolean);
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: s.company_name,
    url: siteUrl(),
    telephone: s.main_phone,
    email: s.email,
    address: { "@type": "PostalAddress", addressLocality: "Ajman", addressCountry: "AE" },
    ...(sameAs.length ? { sameAs } : {}),
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: `${siteUrl()}${it.path}`,
    })),
  };
}

export function productJsonLd(p: { name: string; description: string | null; slug: string; image?: string | null; category?: string | null }) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    description: p.description ?? undefined,
    url: `${siteUrl()}/products/${p.slug}`,
    image: p.image ?? undefined,
    category: p.category ?? undefined,
  };
}

/** Serialises JSON-LD safely for inline <script> use. */
export function jsonLdString(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
