"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Menu, X, Phone, MessageCircle } from "lucide-react";

type Props = {
  links: readonly { href: string; label: string }[];
  telHref: string;
  waHref: string;
  phoneLabel: string;
};

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");
}

export default function HeaderNav({ links, telHref, waHref, phoneLabel }: Props) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => {
    setOpen(false);
    buttonRef.current?.focus();
  }, []);

  // Close after navigation.
  useEffect(() => setOpen(false), [pathname]);

  // Scroll lock, Escape to close and a simple focus trap while the drawer is open.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusables = () =>
      Array.from(drawerRef.current?.querySelectorAll<HTMLElement>("a[href],button:not([disabled])") ?? []);
    focusables()[0]?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") return close();
      if (e.key !== "Tab") return;
      const items = focusables();
      const first = items[0];
      const last = items[items.length - 1];
      if (!first || !last) return;
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  return (
    <>
      <nav aria-label="Primary" className="hidden lg:block">
        <ul className="flex items-center gap-1">
          {links.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                aria-current={isActive(pathname, l.href) ? "page" : undefined}
                className={`px-3 py-2 text-sm font-medium transition-colors hover:text-brand ${isActive(pathname, l.href) ? "border-b-2 border-brand text-brand" : "text-steel-800"}`}
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-11 w-11 items-center justify-center border border-steel-300 lg:hidden"
        aria-label="Open menu"
        aria-expanded={open}
        aria-controls="mobile-drawer"
      >
        <Menu className="h-5 w-5" aria-hidden />
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-steel-900/60" onClick={close} aria-hidden />
          <div
            ref={drawerRef}
            id="mobile-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Site menu"
            className="absolute right-0 top-0 flex h-full w-[min(20rem,88vw)] flex-col bg-white shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-steel-200 px-4 py-3">
              <span className="text-sm font-semibold text-steel-700">Menu</span>
              <button type="button" onClick={close} className="inline-flex h-11 w-11 items-center justify-center" aria-label="Close menu">
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>
            <ul className="flex-1 overflow-y-auto py-2">
              {links.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    onClick={() => setOpen(false)}
                    aria-current={isActive(pathname, l.href) ? "page" : undefined}
                    className={`flex min-h-12 items-center border-l-4 px-5 text-base font-medium ${isActive(pathname, l.href) ? "border-brand bg-brand-50 text-brand" : "border-transparent text-steel-900"}`}
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="grid gap-3 border-t border-steel-200 p-4">
              <a href={waHref} target="_blank" rel="noopener noreferrer" className="btn-primary"><MessageCircle className="h-4 w-4" aria-hidden /> WhatsApp</a>
              <a href={telHref} className="btn-outline"><Phone className="h-4 w-4" aria-hidden /> {phoneLabel}</a>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
