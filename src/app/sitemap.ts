import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/config/site";
import { getSitemapSlugs } from "@/lib/data/public";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const { products, services, blogs } = await getSitemapSlugs();
  const staticRoutes = ["", "/about", "/products", "/services", "/blog", "/contact"].map((path) => ({
    url: `${base}${path}`,
    changeFrequency: "weekly" as const,
    priority: path === "" ? 1 : 0.8,
  }));
  return [
    ...staticRoutes,
    ...products.map((p) => ({ url: `${base}/products/${p.slug}`, lastModified: p.updated_at, changeFrequency: "weekly" as const, priority: 0.7 })),
    ...services.map((s) => ({ url: `${base}/services/${s.slug}`, lastModified: s.updated_at, changeFrequency: "monthly" as const, priority: 0.7 })),
    ...blogs.map((b) => ({ url: `${base}/blog/${b.slug}`, lastModified: b.updated_at, changeFrequency: "weekly" as const, priority: 0.7 })),
  ];
}
