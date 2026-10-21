"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

export type CategoryItem = {
  id: string;
  name: string;
  slug: string;
};

type Props = {
  categories: CategoryItem[];
  activeCategory?: string;
  searchQuery?: string;
};

export default function CategoryFilterBar({ categories, activeCategory, searchQuery }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const [hasOverflow, setHasOverflow] = useState(false);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const overflow = scrollWidth > clientWidth + 2;
    setHasOverflow(overflow);
    setCanScrollLeft(scrollLeft > 6);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 6);
  }, []);

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", checkScroll, { passive: true });
    window.addEventListener("resize", checkScroll);
    return () => {
      el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [checkScroll]);

  // Center active category pill into view on initial load or navigation
  useEffect(() => {
    if (!activeCategory || !scrollRef.current) return;
    const activeEl = scrollRef.current.querySelector<HTMLElement>('[data-active="true"]');
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  }, [activeCategory]);

  const scroll = (direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const offset = direction === "left" ? -240 : 240;
    el.scrollBy({ left: offset, behavior: "smooth" });
  };

  const chip = (active: boolean) =>
    `inline-flex items-center min-h-9 sm:min-h-10 px-3.5 sm:px-4 text-xs sm:text-sm font-semibold whitespace-nowrap rounded-full transition-all duration-200 shrink-0 select-none ${
      active
        ? "bg-brand text-white shadow-sm ring-2 ring-brand/20"
        : "border border-steel-200 bg-white text-steel-700 hover:border-brand hover:text-brand hover:bg-brand-50/40 shadow-xs"
    }`;

  const q = searchQuery ? `&q=${encodeURIComponent(searchQuery)}` : "";

  return (
    <div className="mt-5 sm:mt-6">
      {/* Top Header Row with Categories label and Scroll Buttons */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold uppercase tracking-wider text-steel-500">
          Categories
        </span>

        {/* Scroll Buttons at the Top - perfectly aligned, never overlapping pills */}
        <div
          className={`flex items-center gap-1.5 transition-opacity duration-200 ${
            hasOverflow ? "opacity-100" : "opacity-0 sm:opacity-100"
          }`}
        >
          <button
            type="button"
            onClick={() => scroll("left")}
            aria-label="Scroll categories left"
            disabled={!canScrollLeft}
            className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full border border-steel-200 bg-white text-steel-700 hover:text-brand hover:border-brand hover:bg-steel-50 shadow-xs transition-all disabled:opacity-30 disabled:cursor-not-allowed active:scale-95"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => scroll("right")}
            aria-label="Scroll categories right"
            disabled={!canScrollRight}
            className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full border border-steel-200 bg-white text-steel-700 hover:text-brand hover:border-brand hover:bg-steel-50 shadow-xs transition-all disabled:opacity-30 disabled:cursor-not-allowed active:scale-95"
          >
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Scrollable Category Track with zero obstruction */}
      <nav
        ref={scrollRef}
        aria-label="Product categories"
        className="-mx-4 px-4 sm:mx-0 sm:px-0 flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth py-1"
      >
        <Link
          href={searchQuery ? `/products?q=${encodeURIComponent(searchQuery)}` : "/products"}
          className={chip(!activeCategory)}
          aria-current={!activeCategory ? "page" : undefined}
          data-active={!activeCategory}
        >
          All
        </Link>
        {categories.map((c) => {
          const isActive = activeCategory === c.slug;
          return (
            <Link
              key={c.id}
              href={`/products?category=${c.slug}${q}`}
              className={chip(isActive)}
              aria-current={isActive ? "page" : undefined}
              data-active={isActive}
            >
              {c.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
