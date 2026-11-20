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

export const FALLBACK_HERO: HomepageSection = {
  id: "fallback",
  key: "hero",
  eyebrow: "Metal Works & Steel Fabrication Manufacturer UAE",
  heading: "Steel Fabrication & Metal Works Manufacturer in Ajman, UAE",
  body: "Bait Al Majed Metal Works manufactures welded wheelbarrows, gas cylinder trolleys, lifting cages, concrete buckets, and custom steel products for construction and industrial contractors across the UAE.",
  image_public_id: null,
  image_alt: "Bait Al Majed Metal Works steel fabrication and construction equipment manufacturer in Ajman UAE",
  mobile_image_public_id: null,
  mobile_image_alt: "Bait Al Majed Metal Works steel fabrication and construction equipment manufacturer in Ajman UAE",
  primary_cta_label: "Enquire on WhatsApp",
  primary_cta_href: "whatsapp",
  secondary_cta_label: "Call Now",
  secondary_cta_href: "tel",
  items: [
    { title: "Strong Fabrication", text: "Heavy-duty steel build" },
    { title: "Custom Solutions", text: "Made to drawings & specs" },
    { title: "Built for Industry", text: "Direct UAE site delivery" },
  ],
  is_visible: true,
  sort_order: 1,
};

/**
 * Resolves the hero section:
 * 1. If sections has an explicit hero record:
 *    - If is_visible is false, return null (respect explicit hidden setting).
 *    - If is_visible is true, return the hero.
 * 2. If hero is absent from sections:
 *    - If other homepage sections exist (i.e. DB is populated and RLS filtered out the hidden hero,
 *      or hero was intentionally omitted), return null to avoid resurrecting an intentionally hidden section.
 *    - If sections is completely empty (unseeded DB or offline fallback), return FALLBACK_HERO.
 */
export function resolveHeroSection(
  sections: Record<string, HomepageSection | undefined>,
  fallback: HomepageSection = FALLBACK_HERO,
): HomepageSection | null {
  const hero = sections.hero;
  if (hero) {
    return hero.is_visible ? hero : null;
  }
  // No hero in sections record
  const hasOtherSections = Object.values(sections).some((s) => s != null);
  if (hasOtherSections) {
    return null;
  }
  return fallback;
}

/**
 * Sorts homepage section blocks by sort_order ascending, using section key as a deterministic tie-breaker.
 */
export function sortHomepageSections<T extends { key: string; order: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    if (a.order !== b.order) {
      return a.order - b.order;
    }
    return a.key.localeCompare(b.key);
  });
}
