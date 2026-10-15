import type { HomepageSection } from "@/types/db";

export const HOMEPAGE_SECTION_LABELS: Record<HomepageSection["key"], string> = {
  hero: "Hero banner",
  featured_products: "Featured products carousel",
  services: "Services overview",
  about: "About preview",
  trust: "Company strengths",
  contact_cta: "Contact call-to-action",
};

export function sectionLabel(key: HomepageSection["key"]): string {
  return HOMEPAGE_SECTION_LABELS[key] ?? key;
}
