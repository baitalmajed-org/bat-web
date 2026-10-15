"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/** Native scroll-snap carousel with desktop & mobile navigation controls and synchronized position indicators. */
export default function ProductCarousel({ children, label }: { children: React.ReactNode; label: string }) {
  const ref = useRef<HTMLUListElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);

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
      const cardWidth = card ? card.getBoundingClientRect().width + 16 : 280;
      const index = Math.min(count - 1, Math.max(0, Math.round(scrollLeft / cardWidth)));
      setActiveIndex(index);
    }
  }, [count]);

  useEffect(() => {
    update();
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [update]);

  const scrollByCard = (dir: 1 | -1) => {
    const el = ref.current;
    if (!el) return;
    const card = el.querySelector("li");
    const step = (card?.getBoundingClientRect().width ?? 280) + 16;
    const reduce = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollBy({ left: dir * step, behavior: reduce ? "auto" : "smooth" });
  };

  const scrollToIndex = (index: number) => {
    const el = ref.current;
    if (!el) return;
    const cards = el.querySelectorAll("li");
    const target = cards[index];
    if (target) {
      const reduce = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      target.scrollIntoView({
        behavior: reduce ? "auto" : "smooth",
        block: "nearest",
        inline: "start",
      });
    }
  };

  return (
    <div>
      {/* Desktop navigation controls */}
      <div className="mb-4 hidden justify-end gap-2 md:flex">
        <button
          type="button"
          onClick={() => scrollByCard(-1)}
          disabled={!canPrev}
          aria-label="Previous products"
          className="inline-flex h-11 w-11 items-center justify-center border border-steel-300 bg-white text-steel-700 hover:border-brand hover:text-brand focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft className="h-5 w-5" aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => scrollByCard(1)}
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
            onClick={() => scrollByCard(-1)}
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
                onClick={() => scrollToIndex(i)}
                className={`h-2 rounded-full transition-all focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none ${
                  i === activeIndex ? "w-6 bg-brand" : "w-2 bg-steel-300 hover:bg-steel-400"
                }`}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={() => scrollByCard(1)}
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
