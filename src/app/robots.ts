import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/config/site";

export default function robots(): MetadataRoute.Robots {
  const base = siteUrl();
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/admin/",
          "/api/",
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
