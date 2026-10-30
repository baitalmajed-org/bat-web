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
  eyebrow: "Steel fabrication & metal works",
  heading: "Reliable Steel Solutions for Construction & Industrial Applications",
  body: "Welding, fabrication and customized metal solutions from Ajman, UAE.",
  image_public_id: null,
  image_alt: null,
  mobile_image_public_id: null,
  mobile_image_alt: null,
  primary_cta_label: "Enquire on WhatsApp",
  primary_cta_href: "whatsapp",
  secondary_cta_label: "Call Now",
  secondary_cta_href: "tel",
  items: [],
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
