"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { createPortal } from "react-dom";
import { Menu, X, Phone } from "lucide-react";
import CloudImage from "@/components/ui/CloudImage";
import WhatsAppIcon from "@/components/ui/WhatsAppIcon";

type Props = {
  links: readonly { href: string; label: string }[];
  telHref: string;
  waHref: string;
  phoneLabel: string;
  companyName?: string;
  logoPublicId?: string | null;
};

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");
}

export default function HeaderNav({
  links,
  telHref,
  waHref,
  phoneLabel,
  companyName = "Bait Al Majed Metal Works",
  logoPublicId,
}: Props) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    buttonRef.current?.focus();
  }, []);

  // Close when pathname changes (e.g. navigation happens)
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Close when resized to desktop (lg = 1024px)
  useEffect(() => {
    if (!open) return;
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [open]);

  // Scroll lock, Escape listener, and accessible focus trap
  useEffect(() => {
    if (!open) return;

    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousTouchAction = document.body.style.touchAction;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    document.body.style.touchAction = "none";

    // Focus the close button once opened
    const timer = setTimeout(() => {
      closeButtonRef.current?.focus();
    }, 30);

    const getFocusables = () =>
      Array.from(
        drawerRef.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), a[href]:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        ) ?? []
      );

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
        return;
      }
      if (e.key !== "Tab") return;

      const items = getFocusables();
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (!first || !last) return;

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(timer);
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.body.style.touchAction = previousTouchAction;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  return (
    <>
      {/* Desktop Navigation */}
      <nav aria-label="Primary" className="hidden lg:block">
        <ul className="flex items-center gap-1">
          {links.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                aria-current={isActive(pathname, l.href) ? "page" : undefined}
                className={`px-3 py-2 text-sm font-medium transition-colors hover:text-brand ${
                  isActive(pathname, l.href)
                    ? "border-b-2 border-brand text-brand"
                    : "text-steel-800"
                }`}
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Mobile Hamburger Trigger */}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-11 w-11 items-center justify-center rounded border border-steel-300 bg-white text-steel-800 transition-colors hover:border-brand hover:text-brand focus-visible:outline-2 focus-visible:outline-brand lg:hidden"
        aria-label="Open menu"
        aria-expanded={open}
        aria-controls="mobile-drawer"
      >
        <Menu className="h-5 w-5" aria-hidden="true" />
      </button>

      {/* Mobile Navigation Drawer via React Portal */}
      {mounted && open
        ? createPortal(
            <div className="fixed inset-0 z-[100] lg:hidden" role="presentation">
              {/* Backdrop Overlay */}
              <div
                className="fixed inset-0 bg-steel-950/60 backdrop-blur-sm animate-backdrop-in"
                onClick={close}
                onTouchMove={(e) => e.preventDefault()}
                aria-hidden="true"
              />

              {/* Drawer Container */}
              <div
                ref={drawerRef}
                id="mobile-drawer"
                role="dialog"
                aria-modal="true"
                aria-label="Site menu"
                className="fixed right-0 top-0 bottom-0 flex h-screen h-[100dvh] max-h-[100dvh] w-[min(22rem,88vw)] flex-col bg-white shadow-2xl animate-drawer-in"
                style={{
                  paddingTop: "env(safe-area-inset-top, 0px)",
                  paddingRight: "env(safe-area-inset-right, 0px)",
                  paddingLeft: "env(safe-area-inset-left, 0px)",
                }}
              >
                {/* Drawer Header */}
                <div className="flex h-16 shrink-0 items-center justify-between border-b border-steel-200 px-4">
                  <Link
                    href="/"
                    onClick={close}
                    className="relative block h-11 w-24 shrink-0"
                    aria-label={`${companyName} home`}
                  >
                    {logoPublicId ? (
                      <CloudImage
                        publicId={logoPublicId}
                        alt={companyName}
                        preset="logo"
                        sizes="110px"
                        className="object-contain object-left"
                      />
                    ) : (
                      <Image
                        src="/brand/logo-on-white.png"
                        alt={companyName}
                        fill
                        sizes="110px"
                        className="object-contain object-left"
                      />
                    )}
                  </Link>
                  <button
                    ref={closeButtonRef}
                    type="button"
                    onClick={close}
                    className="inline-flex h-11 w-11 items-center justify-center rounded border border-steel-200 text-steel-700 transition-colors hover:bg-steel-100 hover:text-brand focus-visible:outline-2 focus-visible:outline-brand"
                    aria-label="Close menu"
                  >
                    <X className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>

                {/* Vertical Navigation Links */}
                <div
                  className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-3 py-3"
                  style={{ WebkitOverflowScrolling: "touch" }}
                >
                  <nav aria-label="Mobile navigation links">
                    <ul className="flex flex-col gap-1">
                      {links.map((l) => {
                        const active = isActive(pathname, l.href);
                        return (
                          <li key={l.href}>
                            <Link
                              href={l.href}
                              onClick={close}
                              aria-current={active ? "page" : undefined}
                              className={`flex min-h-12 items-center justify-between rounded px-4 py-3 text-base font-medium transition-colors ${
                                active
                                  ? "border-l-4 border-brand bg-brand-50/80 font-semibold text-brand"
                                  : "border-l-4 border-transparent text-steel-800 hover:bg-steel-50 hover:text-brand"
                              }`}
                            >
                              <span>{l.label}</span>
                              {active ? (
                                <span className="h-2 w-2 rounded-full bg-brand" aria-hidden="true" />
                              ) : null}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </nav>
                </div>

                {/* Bottom Contact Actions */}
                <div
                  className="shrink-0 border-t border-steel-200 bg-white p-4"
                  style={{
                    paddingBottom: "max(1rem, env(safe-area-inset-bottom, 0px))",
                  }}
                >
                  <div className="flex flex-col gap-2.5">
                    <a
                      href={waHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-primary w-full justify-center shadow-sm"
                    >
                      <WhatsAppIcon className="h-4 w-4 shrink-0" />
                      <span>WhatsApp</span>
                    </a>
                    <a
                      href={telHref}
                      className="btn-outline w-full justify-center"
                      aria-label={phoneLabel ? `Call ${phoneLabel}` : "Call Now"}
                    >
                      <Phone className="h-4 w-4 shrink-0" aria-hidden="true" />
                      <span>Call Now</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>,
            document.body
          )
        : null}
    </>
  );
}
