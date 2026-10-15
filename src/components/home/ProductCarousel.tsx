"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/** Native scroll-snap carousel: touch swipe works out of the box, buttons add desktop control. */
export default function ProductCarousel({ children, label }: { children: React.ReactNode; label: string }) {
  const ref = useRef<HTMLUListElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(true);

  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setCanPrev(el.scrollLeft > 4);
    setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

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
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollBy({ left: dir * step, behavior: reduce ? "auto" : "smooth" });
  };

  return (
    <div>
      <div className="mb-4 hidden justify-end gap-2 md:flex">
        <button type="button" onClick={() => scrollByCard(-1)} disabled={!canPrev} aria-label="Previous products" className="inline-flex h-11 w-11 items-center justify-center border border-steel-300 bg-white hover:border-brand hover:text-brand disabled:opacity-40">
          <ChevronLeft className="h-5 w-5" aria-hidden />
        </button>
        <button type="button" onClick={() => scrollByCard(1)} disabled={!canNext} aria-label="Next products" className="inline-flex h-11 w-11 items-center justify-center bg-brand text-white hover:bg-brand-deep disabled:opacity-40">
          <ChevronRight className="h-5 w-5" aria-hidden />
        </button>
      </div>
      <ul
        ref={ref}
        onScroll={update}
        aria-label={label}
        className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-4 pb-2 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0 motion-reduce:scroll-auto [&>li]:w-[72%] [&>li]:shrink-0 [&>li]:snap-start sm:[&>li]:w-[44%] md:[&>li]:w-[31%] lg:[&>li]:w-[23.5%]"
      >
        {children}
      </ul>
    </div>
  );
}
