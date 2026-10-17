"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export const AUTO_SLIDE_INTERVAL = 4000;

/** Native scroll-snap carousel with desktop & mobile navigation controls, synchronized position indicators, and auto-sliding. */
export default function ProductCarousel({ children, label }: { children: React.ReactNode; label: string }) {
  const ref = useRef<HTMLUListElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);

  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isInteracting, setIsInteracting] = useState(false);
  const [isDocumentHidden, setIsDocumentHidden] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [resetKey, setResetKey] = useState(0);

  const count = React.Children.count(children);

  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const scrollLeft = el.scrollLeft;
    const maxScroll = el.scrollWidth - el.clientWidth;
    setCanPrev(scrollLeft > 4);
    setCanNext(scrollLeft + el.clientWidth < el.scrollWidth - 4);

    if (maxScroll > 0 && count > 1) {
      const card = el.querySelector("li");
      const gap = (typeof window !== "undefined" && parseFloat(window.getComputedStyle(el).gap)) || 16;
      const cardWidth = card ? card.getBoundingClientRect().width + gap : 280;
      const index = Math.min(count - 1, Math.max(0, Math.round(scrollLeft / cardWidth)));
      setActiveIndex(index);
    }
  }, [count]);

  useEffect(() => {
    update();
    const el = ref.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [update]);

  // Listen to prefers-reduced-motion media query
  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!mediaQuery) return;
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    } else if (mediaQuery.addListener) {
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, []);

  // Pause when browser tab is hidden, resume when visible
  useEffect(() => {
    if (typeof document === "undefined") return;
    setIsDocumentHidden(document.visibilityState === "hidden");
    const handleVisibilityChange = () => {
      const isHidden = document.visibilityState === "hidden";
      setIsDocumentHidden(isHidden);
      if (!isHidden) {
        setResetKey((prev) => prev + 1);
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  const resetTimer = useCallback(() => {
    setResetKey((prev) => prev + 1);
  }, []);

  const scrollByCard = useCallback((dir: 1 | -1) => {
    const el = ref.current;
    if (!el) return;
    const card = el.querySelector("li");
    const gap = (typeof window !== "undefined" && parseFloat(window.getComputedStyle(el).gap)) || 16;
    const step = (card?.getBoundingClientRect().width ?? 280) + gap;
    const reduce = typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (typeof el.scrollBy === "function") {
      el.scrollBy({ left: dir * step, behavior: reduce ? "auto" : "smooth" });
    } else {
      el.scrollLeft += dir * step;
    }
  }, []);

  const scrollToIndex = useCallback((index: number) => {
    const el = ref.current;
    if (!el) return;
    const cards = el.querySelectorAll("li");
    const target = cards[index];
    if (target) {
      const reduce = typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (typeof target.scrollIntoView === "function") {
        target.scrollIntoView({
          behavior: reduce ? "auto" : "smooth",
          block: "nearest",
          inline: "start",
        });
      } else {
        const gap = (typeof window !== "undefined" && parseFloat(window.getComputedStyle(el).gap)) || 16;
        const cardWidth = (target.getBoundingClientRect().width ?? 280) + gap;
        el.scrollLeft = index * cardWidth;
      }
    }
  }, []);

  // Advance to next product position or loop back to beginning if at the end
  const advance = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    if (maxScroll <= 1) return;

    // Check if reached or near the end (10px buffer for subpixel/scaling tolerances)
    const isAtEnd = maxScroll > 0 && el.scrollLeft >= maxScroll - 10;
    const reduce = typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (isAtEnd) {
      if (typeof el.scrollTo === "function") {
        el.scrollTo({ left: 0, behavior: reduce ? "auto" : "smooth" });
      } else {
        el.scrollLeft = 0;
      }
    } else {
      const card = el.querySelector("li");
      const gap = (typeof window !== "undefined" && parseFloat(window.getComputedStyle(el).gap)) || 16;
      const step = (card?.getBoundingClientRect().width ?? 280) + gap;
      if (typeof el.scrollBy === "function") {
        el.scrollBy({ left: step, behavior: reduce ? "auto" : "smooth" });
      } else {
        el.scrollLeft += step;
      }
    }
  }, []);

  // Pause automatic sliding during hover, keyboard focus, touch, reduced motion, hidden tab, or single item
  const isPaused = isHovered || isFocused || isInteracting || isDocumentHidden || prefersReducedMotion || count <= 1;

  useEffect(() => {
    if (isPaused) return;

    const timer = setInterval(() => {
      advance();
    }, AUTO_SLIDE_INTERVAL);

    return () => clearInterval(timer);
  }, [isPaused, resetKey, advance]);

  const handlePrev = (e: React.MouseEvent<HTMLButtonElement>) => {
    scrollByCard(-1);
    resetTimer();
    if (e.detail !== 0) {
      setIsFocused(false);
      e.currentTarget.blur();
    }
  };

  const handleNext = (e: React.MouseEvent<HTMLButtonElement>) => {
    scrollByCard(1);
    resetTimer();
    if (e.detail !== 0) {
      setIsFocused(false);
      e.currentTarget.blur();
    }
  };

  const handleDotClick = (index: number, e: React.MouseEvent<HTMLButtonElement>) => {
    scrollToIndex(index);
    resetTimer();
    if (e.detail !== 0) {
      setIsFocused(false);
      e.currentTarget.blur();
    }
  };

  // Only pause for genuine keyboard focus (:focus-visible), not pointer clicks
  const handleFocus = (e: React.FocusEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement | null;
    if (target?.matches && target.matches(":focus-visible")) {
      setIsFocused(true);
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
      setIsFocused(false);
    }
  };

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label={label}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onTouchStart={() => setIsInteracting(true)}
      onTouchEnd={() => {
        setIsInteracting(false);
        resetTimer();
      }}
      onTouchCancel={() => {
        setIsInteracting(false);
        resetTimer();
      }}
    >
      {/* Desktop navigation controls */}
      <div className="mb-4 hidden justify-end gap-2 md:flex">
        <button
          type="button"
          onClick={handlePrev}
          disabled={!canPrev}
          aria-label="Previous products"
          className="inline-flex h-11 w-11 items-center justify-center border border-steel-300 bg-white text-steel-700 hover:border-brand hover:text-brand focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft className="h-5 w-5" aria-hidden />
        </button>
        <button
          type="button"
          onClick={handleNext}
          disabled={!canNext}
          aria-label="Next products"
          className="inline-flex h-11 w-11 items-center justify-center bg-brand text-white hover:bg-brand-deep focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronRight className="h-5 w-5" aria-hidden />
        </button>
      </div>

      {/* Carousel items with native touch scrolling & card peeking */}
      <ul
        ref={ref}
        onScroll={update}
        aria-label={label}
        className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-4 pb-2 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0 motion-reduce:scroll-auto [&>li]:w-[72%] [&>li]:shrink-0 [&>li]:snap-start sm:[&>li]:w-[44%] md:[&>li]:w-[31%] lg:[&>li]:w-[23.5%]"
      >
        {children}
      </ul>

      {/* Mobile navigation bar: indicators and previous/next controls */}
      {count > 1 ? (
        <div className="mt-4 flex items-center justify-between md:hidden" aria-label="Product navigation">
          <button
            type="button"
            onClick={handlePrev}
            disabled={!canPrev}
            aria-label="Previous products"
            className="inline-flex h-10 w-10 items-center justify-center border border-steel-300 bg-white text-steel-700 hover:border-brand hover:text-brand focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ChevronLeft className="h-5 w-5" aria-hidden />
          </button>

          {/* Synchronized pagination indicators */}
          <div className="flex items-center gap-1.5" role="tablist" aria-label="Product slides">
            {Array.from({ length: count }).map((_, i) => (
              <button
                key={i}
                type="button"
                role="tab"
                aria-selected={i === activeIndex}
                aria-label={`Go to product ${i + 1} of ${count}`}
                onClick={(e) => handleDotClick(i, e)}
                className={`h-2 rounded-full transition-all focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none ${
                  i === activeIndex ? "w-6 bg-brand" : "w-2 bg-steel-300 hover:bg-steel-400"
                }`}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={handleNext}
            disabled={!canNext}
            aria-label="Next products"
            className="inline-flex h-10 w-10 items-center justify-center bg-brand text-white hover:bg-brand-deep focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ChevronRight className="h-5 w-5" aria-hidden />
          </button>
        </div>
      ) : null}
    </div>
  );
}
