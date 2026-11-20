import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/config/site";
import { getSitemapSlugs } from "@/lib/data/public";

export const revalidate = 3600;

const FALLBACK_PRODUCTS = [
  "welded-wheelbarrow",
  "welded-block-wheelbarrow",
  "gas-cylinder-trolley",
  "pallet-trolley",
  "material-lifting-cage",
  "block-lifting-cage",
  "man-lift-cages",
  "concrete-bucket",
  "concrete-bucket-with-platform",
  "industrial-waste-skip-bins",
  "steel-safety-barriers",
];

const FALLBACK_SERVICES = [
  "material-handling-equipment",
  "construction-equipment",
  "steel-fabrication",
  "industrial-safety-equipment",
  "customized-steel-products",
  "structural-architectural-metal-works",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const { products, services, blogs } = await getSitemapSlugs();

  const now = new Date().toISOString();

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${base}`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${base}/products`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${base}/services`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${base}/about`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${base}/contact`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${base}/blog`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
    },
  ];

  // Resolve product entries with fallback guarantee
  const productEntries: MetadataRoute.Sitemap =
    products.length > 0
      ? products.map((p) => ({
          url: `${base}/products/${p.slug}`,
          lastModified: p.updated_at || now,
          changeFrequency: "weekly" as const,
          priority: 0.8,
        }))
      : FALLBACK_PRODUCTS.map((slug) => ({
          url: `${base}/products/${slug}`,
          lastModified: now,
          changeFrequency: "weekly" as const,
          priority: 0.8,
        }));

  // Resolve service entries with fallback guarantee
  const serviceEntries: MetadataRoute.Sitemap =
    services.length > 0
      ? services.map((s) => ({
          url: `${base}/services/${s.slug}`,
          lastModified: s.updated_at || now,
          changeFrequency: "monthly" as const,
          priority: 0.8,
        }))
      : FALLBACK_SERVICES.map((slug) => ({
          url: `${base}/services/${slug}`,
          lastModified: now,
          changeFrequency: "monthly" as const,
          priority: 0.8,
        }));

  const blogEntries: MetadataRoute.Sitemap = blogs.map((b) => ({
    url: `${base}/blog/${b.slug}`,
    lastModified: b.updated_at || now,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  return [...staticRoutes, ...productEntries, ...serviceEntries, ...blogEntries];
}
