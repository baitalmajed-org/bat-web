import { describe, expect, it } from "vitest";
import {
  FALLBACK_HERO,
  resolveHeroSection,
  sortHomepageSections,
} from "@/lib/homepage-sections";
import type { HomepageSection } from "@/types/db";

function makeSection(key: HomepageSection["key"], overrides: Partial<HomepageSection> = {}): HomepageSection {
  return {
    id: `sec-${key}`,
    key,
    eyebrow: `${key} eyebrow`,
    heading: `${key} heading`,
    body: `${key} body`,
    image_public_id: null,
    image_alt: null,
    primary_cta_label: "Action",
    primary_cta_href: "/action",
    secondary_cta_label: null,
    secondary_cta_href: null,
    items: [],
    is_visible: true,
    sort_order: 1,
    ...overrides,
  };
}

describe("Homepage hero visibility and ordering (FIX 2)", () => {
  it("1. A visible hero renders (is resolved as the active hero)", () => {
    const heroRecord = makeSection("hero", { heading: "Custom Hero", is_visible: true });
    const sections = { hero: heroRecord };
    const resolved = resolveHeroSection(sections);

    expect(resolved).not.toBeNull();
    expect(resolved?.heading).toBe("Custom Hero");
    expect(resolved?.is_visible).toBe(true);
  });

  it("2. A hidden hero does not render", () => {
    const heroRecord = makeSection("hero", { is_visible: false });
    const sections = { hero: heroRecord };
    const resolved = resolveHeroSection(sections);

    expect(resolved).toBeNull();
  });

  it("3. A hidden hero is not resurrected by FALLBACK_HERO", () => {
    // When hero is explicitly marked is_visible: false
    const hiddenHero = makeSection("hero", { is_visible: false });
    expect(resolveHeroSection({ hero: hiddenHero })).toBeNull();

    // When public query excludes hidden hero through RLS (hero key absent, but other sections present)
    const sectionsWithHiddenHeroOmittedByRls: Record<string, HomepageSection> = {
      services: makeSection("services", { is_visible: true }),
      about: makeSection("about", { is_visible: true }),
    };
    const resolved = resolveHeroSection(sectionsWithHiddenHeroOmittedByRls);
    expect(resolved).toBeNull();
  });

  it("4. An absent hero record uses fallback behavior only when appropriate (e.g. empty/unseeded DB)", () => {
    // When DB is completely unseeded/empty
    const emptySections: Record<string, HomepageSection> = {};
    const resolvedFromEmpty = resolveHeroSection(emptySections);
    expect(resolvedFromEmpty).toEqual(FALLBACK_HERO);

    // But when DB has sections and hero is missing, fallback is NOT used
    const populatedWithoutHero: Record<string, HomepageSection> = {
      about: makeSection("about", { is_visible: true }),
    };
    expect(resolveHeroSection(populatedWithoutHero)).toBeNull();
  });

  it("5. The hero appears in the correct position when its display order changes", () => {
    const hero = { key: "hero", order: 3 };
    const featured = { key: "featured_products", order: 1 };
    const services = { key: "services", order: 2 };
    const about = { key: "about", order: 4 };

    const sorted = sortHomepageSections([hero, featured, services, about]);
    expect(sorted.map((s) => s.key)).toEqual(["featured_products", "services", "hero", "about"]);
  });

  it("6. All visible homepage sections follow the configured order", () => {
    const sections = [
      { key: "contact_cta", order: 6 },
      { key: "services", order: 2 },
      { key: "hero", order: 1 },
      { key: "about", order: 4 },
      { key: "featured_products", order: 3 },
      { key: "trust", order: 5 },
    ];

    const sorted = sortHomepageSections(sections);
    expect(sorted.map((s) => s.key)).toEqual([
      "hero",
      "services",
      "featured_products",
      "about",
      "trust",
      "contact_cta",
    ]);
  });

  it("7. Hidden sections are omitted from the rendered section list", () => {
    const allSections: Record<string, HomepageSection> = {
      hero: makeSection("hero", { sort_order: 1, is_visible: false }),
      featured_products: makeSection("featured_products", { sort_order: 2, is_visible: true }),
      services: makeSection("services", { sort_order: 3, is_visible: false }),
      about: makeSection("about", { sort_order: 4, is_visible: true }),
    };

    // Emulate homepage section inclusion logic:
    const hero = resolveHeroSection(allSections);
    const blocks: { key: string; order: number }[] = [];

    if (hero && hero.is_visible !== false) {
      blocks.push({ key: "hero", order: hero.sort_order });
    }
    if (allSections.featured_products && allSections.featured_products.is_visible !== false) {
      blocks.push({ key: "featured_products", order: allSections.featured_products.sort_order });
    }
    if (allSections.services && allSections.services.is_visible !== false) {
      blocks.push({ key: "services", order: allSections.services.sort_order });
    }
    if (allSections.about && allSections.about.is_visible !== false) {
      blocks.push({ key: "about", order: allSections.about.sort_order });
    }

    const sorted = sortHomepageSections(blocks);
    expect(sorted.map((b) => b.key)).toEqual(["featured_products", "about"]);
    expect(sorted.some((b) => b.key === "hero")).toBe(false);
    expect(sorted.some((b) => b.key === "services")).toBe(false);
  });

  it("8. Equal display-order values produce deterministic output using a stable tie-breaker", () => {
    const item1 = { key: "services", order: 2 };
    const item2 = { key: "about", order: 2 };
    const item3 = { key: "hero", order: 2 };

    // Regardless of initial permutation, ordering should be identical
    const run1 = sortHomepageSections([item1, item2, item3]);
    const run2 = sortHomepageSections([item3, item1, item2]);
    const run3 = sortHomepageSections([item2, item3, item1]);

    const expectedKeys = ["about", "hero", "services"]; // alphabetical tie-breaker on key
    expect(run1.map((i) => i.key)).toEqual(expectedKeys);
    expect(run2.map((i) => i.key)).toEqual(expectedKeys);
    expect(run3.map((i) => i.key)).toEqual(expectedKeys);
  });
});
