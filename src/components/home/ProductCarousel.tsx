"use client";

import React from "react";

/** Minimum number of cards in one repeated sequence, so a single sequence is always wider than the viewport. */
export const MARQUEE_MIN_SEQUENCE_ITEMS = 8;
/** Seconds each card takes to travel one card-width; keeps speed constant regardless of product count (8 cards ≈ 40s). */
export const MARQUEE_SECONDS_PER_CARD = 5;

/**
 * Continuous right-to-left product marquee.
 *
 * Movement is entirely CSS-driven (see `.product-marquee*` in globals.css): the track contains the
 * product sequence twice and a `@keyframes` transform moves it from `translateX(0)` to `translateX(-50%)`,
 * i.e. exactly one sequence width (every item carries its own trailing gap, so both halves are identical).
 * No timers or per-frame measurement are used, and the DOM stays stable across rerenders so the
 * animation never restarts. Hover / keyboard focus pause it; `prefers-reduced-motion` turns it into a
 * static, manually scrollable list containing only the original products.
 */
export default function ProductCarousel({ children, label }: { children: React.ReactNode; label: string }) {
  const items = React.Children.toArray(children);
  const count = items.length;

  if (count === 0) return null;

  // A single product doesn't make a meaningful marquee — render it statically.
  if (count === 1) {
    return (
      <div role="region" aria-label={label}>
        <ul className="product-marquee__static" aria-label={label}>
          <li className="product-marquee__item">{items[0]}</li>
        </ul>
      </div>
    );
  }

  const repeats = Math.max(1, Math.ceil(MARQUEE_MIN_SEQUENCE_ITEMS / count));
  const sequenceLength = count * repeats;
  const duration = sequenceLength * MARQUEE_SECONDS_PER_CARD;

  // Two identical sequences back-to-back; only the very first copy of each product is exposed to
  // assistive tech — duplicate clones are aria-hidden so screen readers do not repeat them.
  const trackItems: { key: string; node: React.ReactNode; isClone: boolean }[] = [];
  for (let half = 0; half < 2; half++) {
    for (let r = 0; r < repeats; r++) {
      items.forEach((node, i) => {
        const baseKey = React.isValidElement(node) && node.key != null ? String(node.key) : String(i);
        trackItems.push({ key: `${half}-${r}-${baseKey}`, node, isClone: half > 0 || r > 0 });
      });
    }
  }

  // If keyboard focus scrolled the clipped viewport to reveal a card, ease it back once focus leaves
  // so the resumed marquee stays aligned. Reduced-motion users scroll manually, so leave them alone.
  const handleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    const viewport = e.currentTarget;
    if (viewport.contains(e.relatedTarget as Node | null)) return;
    if (viewport.scrollLeft === 0) return;
    const reduce = typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    if (typeof viewport.scrollTo === "function") viewport.scrollTo({ left: 0, behavior: "smooth" });
    else viewport.scrollLeft = 0;
  };

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label={label}
      className="product-marquee -mx-4 sm:-mx-6 lg:mx-0"
      onBlur={handleBlur}
    >
      <ul
        className="product-marquee__track"
        aria-label={label}
        style={{ "--marquee-duration": `${duration}s` } as React.CSSProperties}
      >
        {trackItems.map(({ key, node, isClone }) => (
          <li key={key} className="product-marquee__item" aria-hidden={isClone || undefined}>
            {node}
          </li>
        ))}
      </ul>
    </div>
  );
}
