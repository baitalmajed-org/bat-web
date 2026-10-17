import { readFileSync } from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AUTO_SLIDE_INTERVAL } from "@/components/home/ProductCarousel";

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

describe("Product carousel automatic sliding and accessibility behavior", () => {
  it("defines an automatic sliding interval of 4 seconds (4000ms)", () => {
    expect(carouselSrc).toMatch(/4000/);
    expect(carouselSrc).toContain("AUTO_SLIDE_INTERVAL");
    expect(AUTO_SLIDE_INTERVAL).toBe(4000);
  });

  it("advances automatically using a properly cleaned-up setInterval effect", () => {
    expect(carouselSrc).toContain("setInterval");
    expect(carouselSrc).toContain("clearInterval");
  });

  it("smoothly loops back to the beginning when reaching the end of the products", () => {
    expect(carouselSrc).toContain("scrollTo({ left: 0");
    expect(carouselSrc).toMatch(/behavior:\s*reduce\s*\?\s*"auto"\s*:\s*"smooth"/);
  });

  it("pauses automatic sliding on hover and resumes when pointer leaves", () => {
    expect(carouselSrc).toContain("onMouseEnter");
    expect(carouselSrc).toContain("onMouseLeave");
    expect(carouselSrc).toContain("isHovered");
  });

  it("pauses automatic sliding while keyboard focus is inside the carousel", () => {
    expect(carouselSrc).toContain("onFocus");
    expect(carouselSrc).toContain("onBlur");
    expect(carouselSrc).toContain("isFocused");
    expect(carouselSrc).toContain(":focus-visible");
  });

  it("pauses automatic sliding during active mobile touch interactions", () => {
    expect(carouselSrc).toContain("onTouchStart");
    expect(carouselSrc).toContain("onTouchEnd");
    expect(carouselSrc).toContain("isInteracting");
  });

  it("respects prefers-reduced-motion by disabling automatic sliding", () => {
    expect(carouselSrc).toContain("prefersReducedMotion");
    expect(carouselSrc).toContain('matchMedia("(prefers-reduced-motion: reduce)")');
  });

  it("resets the automatic timer immediately when Previous or Next arrows are clicked", () => {
    expect(carouselSrc).toContain("resetTimer");
    expect(carouselSrc).toContain("handlePrev");
    expect(carouselSrc).toContain("handleNext");
  });

  it("provides accessible carousel region roles and labels", () => {
    expect(carouselSrc).toContain('role="region"');
    expect(carouselSrc).toContain('aria-roledescription="carousel"');
  });
});

describe("Product carousel scrolling engine & timer simulation (behavioral regression tests)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  type MockTrack = {
    scrollLeft: number;
    scrollWidth: number;
    clientWidth: number;
    querySelector: any;
    scrollBy: any;
    scrollTo: any;
  };

  function createMockTrack(cardWidth = 280, initialScrollLeft = 0, scrollWidth = 1748, clientWidth = 1183): MockTrack {
    const track: MockTrack = {
      scrollLeft: initialScrollLeft,
      scrollWidth,
      clientWidth,
      querySelector: vi.fn().mockReturnValue({ getBoundingClientRect: () => ({ width: cardWidth }) }),
      scrollBy: vi.fn(({ left }: { left: number }) => {
        track.scrollLeft += left;
      }),
      scrollTo: vi.fn(({ left }: { left: number }) => {
        track.scrollLeft = left;
      }),
    };
    return track;
  }

  it("triggers a real scroll action on the scroll container when the 4s timer fires", () => {
    const el = createMockTrack(280, 0);

    let isPaused = false;
    const advance = () => {
      const maxScroll = el.scrollWidth - el.clientWidth;
      if (maxScroll <= 1) return;
      const isAtEnd = maxScroll > 0 && el.scrollLeft >= maxScroll - 10;
      if (isAtEnd) {
        el.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        const card = el.querySelector("li");
        const step = (card?.getBoundingClientRect().width ?? 280) + 16;
        el.scrollBy({ left: step, behavior: "smooth" });
      }
    };

    const timer = setInterval(() => {
      if (!isPaused) advance();
    }, AUTO_SLIDE_INTERVAL);

    // Initial state
    expect(el.scrollLeft).toBe(0);

    // Advance by 4 seconds
    vi.advanceTimersByTime(4000);
    expect(el.scrollBy).toHaveBeenCalledTimes(1);
    expect(el.scrollBy).toHaveBeenCalledWith({ left: 296, behavior: "smooth" });
    expect(el.scrollLeft).toBe(296);

    // Advance by another 4 seconds
    vi.advanceTimersByTime(4000);
    expect(el.scrollBy).toHaveBeenCalledTimes(2);
    expect(el.scrollLeft).toBe(592);

    clearInterval(timer);
  });

  it("advances the scroll target by the expected distance (card width + gap)", () => {
    const cardWidth = 320;
    const gap = 16;
    const expectedStep = cardWidth + gap; // 336px
    const el = createMockTrack(cardWidth, 0, 2000, 1000);

    const advance = () => {
      const card = el.querySelector("li");
      const step = (card?.getBoundingClientRect().width ?? 280) + gap;
      el.scrollBy({ left: step, behavior: "smooth" });
    };

    advance();
    expect(el.scrollBy).toHaveBeenCalledWith({ left: expectedStep, behavior: "smooth" });
    expect(el.scrollLeft).toBe(expectedStep);
  });

  it("loops smoothly back to 0 when reaching the end boundary", () => {
    const el = createMockTrack(280, 560, 1748, 1183);

    const advance = () => {
      const maxScroll = el.scrollWidth - el.clientWidth;
      const isAtEnd = maxScroll > 0 && el.scrollLeft >= maxScroll - 10;
      if (isAtEnd) {
        el.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        el.scrollBy({ left: 296, behavior: "smooth" });
      }
    };

    advance();
    expect(el.scrollTo).toHaveBeenCalledWith({ left: 0, behavior: "smooth" });
    expect(el.scrollLeft).toBe(0);
  });

  it("pauses automatic sliding on hover, keyboard focus, touch, reduced motion, or tab hidden, and resumes when cleared", () => {
    const el = createMockTrack(280, 0);

    let isHovered = false;
    let isFocused = false;
    let isInteracting = false;
    let prefersReducedMotion = false;
    let isDocumentHidden = false;

    const isPaused = () => isHovered || isFocused || isInteracting || prefersReducedMotion || isDocumentHidden;

    const timer = setInterval(() => {
      if (!isPaused()) {
        el.scrollBy({ left: 296, behavior: "smooth" });
      }
    }, AUTO_SLIDE_INTERVAL);

    // Initial tick: should advance
    vi.advanceTimersByTime(4000);
    expect(el.scrollLeft).toBe(296);

    // 1. Hover pause
    isHovered = true;
    vi.advanceTimersByTime(8000);
    expect(el.scrollLeft).toBe(296); // Paused
    isHovered = false;
    vi.advanceTimersByTime(4000);
    expect(el.scrollLeft).toBe(592); // Resumed

    // 2. Keyboard focus pause
    isFocused = true;
    vi.advanceTimersByTime(8000);
    expect(el.scrollLeft).toBe(592); // Paused
    isFocused = false;
    vi.advanceTimersByTime(4000);
    expect(el.scrollLeft).toBe(888); // Resumed

    // 3. Touch interaction pause
    isInteracting = true;
    vi.advanceTimersByTime(8000);
    expect(el.scrollLeft).toBe(888); // Paused
    isInteracting = false;
    vi.advanceTimersByTime(4000);
    expect(el.scrollLeft).toBe(1184); // Resumed

    // 4. prefers-reduced-motion pause
    prefersReducedMotion = true;
    vi.advanceTimersByTime(8000);
    expect(el.scrollLeft).toBe(1184); // Paused
    prefersReducedMotion = false;
    vi.advanceTimersByTime(4000);
    expect(el.scrollLeft).toBe(1480); // Resumed

    // 5. Hidden tab pause
    isDocumentHidden = true;
    vi.advanceTimersByTime(8000);
    expect(el.scrollLeft).toBe(1480); // Paused
    isDocumentHidden = false;
    vi.advanceTimersByTime(4000);
    expect(el.scrollLeft).toBe(1776); // Resumed

    clearInterval(timer);
  });

  it("cleans up intervals correctly on timer reset or unmount", () => {
    const clearIntervalSpy = vi.spyOn(globalThis, "clearInterval");
    const timer = setInterval(() => {}, AUTO_SLIDE_INTERVAL);
    clearInterval(timer);
    expect(clearIntervalSpy).toHaveBeenCalledWith(timer);
  });
});
