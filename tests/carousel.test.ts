import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const carouselSrc = readFileSync(
  path.resolve(__dirname, "../src/components/home/ProductCarousel.tsx"),
  "utf8"
);

describe("Product carousel responsive navigation and accessibility (FIX 4)", () => {
  it("provides accessible labels for icon-only previous and next buttons", () => {
    expect(carouselSrc).toContain('aria-label="Previous products"');
    expect(carouselSrc).toContain('aria-label="Next products"');
  });

  it("includes mobile-accessible navigation controls and pagination indicators", () => {
    // Mobile controls container is visible on mobile and hidden on md+
    expect(carouselSrc).toMatch(/md:hidden/);
    // Contains role="tablist" or pagination indicator group
    expect(carouselSrc).toContain('role="tablist"');
    expect(carouselSrc).toContain('role="tab"');
  });

  it("preserves desktop controls with md:flex", () => {
    expect(carouselSrc).toMatch(/hidden.*md:flex/);
  });

  it("respects prefers-reduced-motion in scroll calculations", () => {
    expect(carouselSrc).toContain("prefers-reduced-motion: reduce");
  });

  it("disables previous and next buttons when at the boundary", () => {
    expect(carouselSrc).toContain("disabled={!canPrev}");
    expect(carouselSrc).toContain("disabled={!canNext}");
  });

  it("includes visible focus indicators on interactive buttons", () => {
    expect(carouselSrc).toContain("focus-visible:ring-2");
    expect(carouselSrc).toContain("focus-visible:ring-brand");
  });
});
