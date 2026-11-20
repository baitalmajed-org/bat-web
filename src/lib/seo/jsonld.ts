import { COMPANY, PRODUCTION_DOMAIN, siteUrl } from "@/lib/config/site";
import type { SiteSettings } from "@/types/db";

export function organizationJsonLd(
  s: Pick<
    SiteSettings,
    | "company_name"
    | "main_phone"
    | "secondary_phone"
    | "email"
    | "address_text"
    | "facebook_url"
    | "instagram_url"
    | "linkedin_url"
    | "youtube_url"
  >
) {
  const sameAs = [s.facebook_url, s.instagram_url, s.linkedin_url, s.youtube_url].filter(Boolean);
  const base = siteUrl();

  return {
    "@context": "https://schema.org",
    "@type": ["LocalBusiness", "Manufacturer"],
    "@id": `${base}/#organization`,
    name: s.company_name || COMPANY.name,
    legalName: COMPANY.legalName,
    alternateName: ["BAM Metal UAE", "Bam Metal UAE", "BAM Metal", "BAM Metal Works", "Bait Al Majed"],
    description:
      "Bait Al Majed Metal Works is a steel fabrication and construction equipment manufacturer located in Ajman, UAE. Specializing in welded wheelbarrows, gas cylinder trolleys, lifting cages, concrete buckets, and custom metal fabrication.",
    url: base,
    logo: `${base}/brand/logo.png`,
    image: `${base}/brand/logo.png`,
    telephone: s.main_phone || COMPANY.mainPhone,
    email: s.email || COMPANY.email,
    priceRange: "$$",
    currenciesAccepted: "AED",
    paymentAccepted: "Cash, Bank Transfer, Cheque",
    address: {
      "@type": "PostalAddress",
      streetAddress: COMPANY.address.streetAddress,
      addressLocality: COMPANY.address.addressLocality,
      addressRegion: COMPANY.address.addressRegion,
      postalCode: COMPANY.address.postalCode,
      addressCountry: COMPANY.address.addressCountry,
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: COMPANY.geo.latitude,
      longitude: COMPANY.geo.longitude,
    },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        opens: "08:00",
        closes: "18:00",
      },
    ],
    areaServed: [
      { "@type": "City", name: "Ajman" },
      { "@type": "City", name: "Dubai" },
      { "@type": "City", name: "Sharjah" },
      { "@type": "City", name: "Abu Dhabi" },
      { "@type": "City", name: "Al Ain" },
      { "@type": "City", name: "Ras Al Khaimah" },
      { "@type": "City", name: "Umm Al Quwain" },
      { "@type": "City", name: "Fujairah" },
      { "@type": "Country", name: "United Arab Emirates" },
    ],
    contactPoint: {
      "@type": "ContactPoint",
      telephone: s.main_phone || COMPANY.mainPhone,
      contactType: "sales",
      areaServed: "AE",
      availableLanguage: ["English", "Arabic"],
    },
    ...(sameAs.length ? { sameAs } : {}),
  };
}

export function websiteJsonLd() {
  const base = siteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${base}/#website`,
    name: "BAM Metal UAE",
    alternateName: [
      "Bam Metal UAE",
      "Bait Al Majed Metal Works",
      "BAM Metal",
      "BAM Metal Works",
      "bammetaluae",
    ],
    url: `${base}/`,
    publisher: {
      "@id": `${base}/#organization`,
    },
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  const base = siteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: `${base}${it.path.startsWith("/") ? it.path : `/${it.path}`}`,
    })),
  };
}

export function productJsonLd(p: {
  name: string;
  description: string | null;
  slug: string;
  image?: string | null;
  category?: string | null;
}) {
  const base = siteUrl();
  const productUrl = `${base}/products/${p.slug}`;
  const imageUrl = p.image || `${PRODUCTION_DOMAIN}/brand/logo.png`;

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${productUrl}#product`,
    name: p.name,
    description:
      p.description ||
      `${p.name} fabricated by Bait Al Majed Metal Works in Ajman, UAE for construction and industrial applications.`,
    url: productUrl,
    image: imageUrl,
    ...(p.category ? { category: p.category } : {}),
    brand: {
      "@type": "Brand",
      name: COMPANY.name,
    },
    manufacturer: {
      "@type": "Organization",
      "@id": `${base}/#organization`,
      name: COMPANY.name,
      url: base,
    },
  };
}

export function serviceJsonLd(s: {
  title: string;
  description: string | null;
  slug: string;
  image?: string | null;
}) {
  const base = siteUrl();
  const serviceUrl = `${base}/services/${s.slug}`;
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${serviceUrl}#service`,
    name: s.title,
    description:
      s.description ||
      `${s.title} provided by Bait Al Majed Metal Works in Ajman, UAE. Quality welding and precision steel fabrication.`,
    url: serviceUrl,
    provider: {
      "@type": "LocalBusiness",
      "@id": `${base}/#organization`,
      name: COMPANY.name,
      url: base,
      telephone: COMPANY.mainPhone,
      address: {
        "@type": "PostalAddress",
        streetAddress: COMPANY.address.streetAddress,
        addressLocality: COMPANY.address.addressLocality,
        addressRegion: COMPANY.address.addressRegion,
        addressCountry: COMPANY.address.addressCountry,
      },
    },
    areaServed: [
      { "@type": "City", name: "Ajman" },
      { "@type": "City", name: "Dubai" },
      { "@type": "City", name: "Sharjah" },
      { "@type": "City", name: "Abu Dhabi" },
      { "@type": "Country", name: "United Arab Emirates" },
    ],
    serviceType: "Metal Works and Steel Fabrication",
    ...(s.image ? { image: s.image } : {}),
  };
}

export function articleJsonLd(b: {
  title: string;
  excerpt: string | null;
  slug: string;
  content: string;
  image?: string | null;
  published_at?: string | null;
  created_at?: string;
  updated_at?: string | null;
}) {
  const base = siteUrl();
  const postUrl = `${base}/blog/${b.slug}`;
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": `${postUrl}#article`,
    headline: b.title,
    description: b.excerpt || b.content.slice(0, 160).replace(/\s+/g, " ").trim(),
    url: postUrl,
    mainEntityOfPage: postUrl,
    datePublished: b.published_at || b.created_at || new Date().toISOString(),
    dateModified: b.updated_at || b.published_at || b.created_at || new Date().toISOString(),
    author: {
      "@type": "Organization",
      "@id": `${base}/#organization`,
      name: COMPANY.name,
      url: base,
    },
    publisher: {
      "@type": "Organization",
      "@id": `${base}/#organization`,
      name: COMPANY.name,
      logo: {
        "@type": "ImageObject",
        url: `${base}/brand/logo.png`,
      },
    },
    ...(b.image ? { image: b.image } : {}),
  };
}

/** Serialises JSON-LD safely for inline <script> use. */
export function jsonLdString(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
