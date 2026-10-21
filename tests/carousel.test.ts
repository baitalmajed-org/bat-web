import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { MARQUEE_MIN_SEQUENCE_ITEMS, MARQUEE_SECONDS_PER_CARD } from "@/components/home/ProductCarousel";

const carouselSrc = readFileSync(path.resolve(__dirname, "../src/components/home/ProductCarousel.tsx"), "utf8");
const cssSrc = readFileSync(path.resolve(__dirname, "../src/app/globals.css"), "utf8");

describe("Product marquee — continuous CSS-driven movement", () => {
  it("does not use JavaScript timers or per-frame measurement for movement", () => {
    expect(carouselSrc).not.toContain("setInterval");
    expect(carouselSrc).not.toContain("requestAnimationFrame");
    expect(carouselSrc).not.toContain("getBoundingClientRect");
  });

  it("animates the track from translateX(0) to exactly one sequence width (-50% of two identical halves)", () => {
    expect(cssSrc).toMatch(/@keyframes productMarquee/);
    expect(cssSrc).toMatch(/translate3d\(0, 0, 0\)/);
    expect(cssSrc).toMatch(/translate3d\(-50%, 0, 0\)/);
    expect(cssSrc).toMatch(/linear infinite/);
  });

  it("gives every item an identical width and trailing gap so both halves match", () => {
    expect(cssSrc).toMatch(/flex: 0 0 var\(--marquee-card\)/);
    expect(cssSrc).toMatch(/margin-right: var\(--marquee-gap\)/);
  });

  it("scales duration with sequence length to keep a constant speed (~40s for one sequence)", () => {
    expect(MARQUEE_MIN_SEQUENCE_ITEMS * MARQUEE_SECONDS_PER_CARD).toBeGreaterThanOrEqual(35);
    expect(MARQUEE_MIN_SEQUENCE_ITEMS * MARQUEE_SECONDS_PER_CARD).toBeLessThanOrEqual(45);
    expect(carouselSrc).toContain("--marquee-duration");
  });
});

describe("Product marquee — interaction and accessibility", () => {
  it("pauses on hover and while focus is inside the region", () => {
    expect(cssSrc).toMatch(/\.product-marquee:hover \.product-marquee__track/);
    expect(cssSrc).toMatch(/\.product-marquee:focus-within \.product-marquee__track/);
    expect(cssSrc).toContain("animation-play-state: paused");
  });

  it("hides duplicated cards from assistive tech while preserving clickability", () => {
    expect(carouselSrc).toContain("aria-hidden={isClone || undefined}");
    expect(carouselSrc).not.toContain("inert={isClone || undefined}");
  });

  it("disables the animation and allows manual scrolling under prefers-reduced-motion", () => {
    expect(cssSrc).toMatch(/@media \(prefers-reduced-motion: reduce\)[\s\S]*animation: none !important/);
    expect(cssSrc).toMatch(/overflow-x: auto/);
    expect(cssSrc).toMatch(/\.product-marquee__item\[aria-hidden="true"\][\s\S]*display: none/);
  });

  it("provides an accessible labelled region", () => {
    expect(carouselSrc).toContain('role="region"');
    expect(carouselSrc).toContain("aria-label={label}");
  });
});
