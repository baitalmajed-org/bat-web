import { describe, expect, it, vi, beforeEach } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import HeaderNav from "@/components/layout/HeaderNav";
import Header from "@/components/layout/Header";
import { NAV_LINKS, telHref, whatsappHref } from "@/lib/config/site";
import type { SiteSettings } from "@/types/db";

// Mock server-only
vi.mock("server-only", () => ({}));

// Mock next/navigation
const mockPathname = vi.fn().mockReturnValue("/");
vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname(),
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
}));

// Mock next/image
vi.mock("next/image", () => ({
  default: ({ priority, ...props }: any) => React.createElement("img", { ...props, fill: undefined }),
}));

// Mock CloudImage
vi.mock("@/components/ui/CloudImage", () => ({
  default: ({ alt, className }: any) =>
    React.createElement("div", { "data-testid": "cloud-image", "aria-label": alt, className }),
}));

import { DEFAULT_SETTINGS } from "@/lib/data/public";

const sampleSettings: SiteSettings = {
  ...DEFAULT_SETTINGS,
  company_name: "Bait Al Majed Metal Works",
  tagline: "Quality fabrication",
  main_phone: "+971 54 716 7455",
  whatsapp_number: "+971 54 716 7455",
  secondary_phone: "00971 55 754 5936",
  email: "info@bammetaluae.com",
};

describe("Mobile Navigation & HeaderNav", () => {
  beforeEach(() => {
    mockPathname.mockReturnValue("/");
  });

  describe("1. Navigation link configuration", () => {
    it("contains all 5 mandatory navigation links in correct order", () => {
      expect(NAV_LINKS).toEqual([
        { href: "/", label: "Home" },
        { href: "/about", label: "About" },
        { href: "/products", label: "Products" },
        { href: "/services", label: "Services" },
        { href: "/contact", label: "Contact" },
      ]);
    });
  });

  describe("2. HeaderNav component markup and accessibility", () => {
    it("renders desktop navigation with hidden lg:block and all links", () => {
      const html = renderToStaticMarkup(
        React.createElement(HeaderNav, {
          links: NAV_LINKS,
          telHref: telHref(sampleSettings.main_phone),
          waHref: whatsappHref(sampleSettings.whatsapp_number),
          phoneLabel: sampleSettings.main_phone,
          companyName: sampleSettings.company_name,
        })
      );

      expect(html).toContain('aria-label="Primary"');
      expect(html).toContain("hidden lg:block");
      expect(html).toContain('href="/"');
      expect(html).toContain("Home");
      expect(html).toContain('href="/about"');
      expect(html).toContain("About");
      expect(html).toContain('href="/products"');
      expect(html).toContain("Products");
      expect(html).toContain('href="/services"');
      expect(html).toContain("Services");
      expect(html).toContain('href="/contact"');
      expect(html).toContain("Contact");
    });

    it("renders mobile menu hamburger button with aria-controls and accessible label", () => {
      const html = renderToStaticMarkup(
        React.createElement(HeaderNav, {
          links: NAV_LINKS,
          telHref: telHref(sampleSettings.main_phone),
          waHref: whatsappHref(sampleSettings.whatsapp_number),
          phoneLabel: sampleSettings.main_phone,
          companyName: sampleSettings.company_name,
        })
      );

      expect(html).toContain('aria-label="Open menu"');
      expect(html).toContain('aria-expanded="false"');
      expect(html).toContain('aria-controls="mobile-drawer"');
      expect(html).toContain("lg:hidden");
    });

    it("sets aria-current='page' on active route in desktop navigation", () => {
      mockPathname.mockReturnValue("/products");
      const html = renderToStaticMarkup(
        React.createElement(HeaderNav, {
          links: NAV_LINKS,
          telHref: telHref(sampleSettings.main_phone),
          waHref: whatsappHref(sampleSettings.whatsapp_number),
          phoneLabel: sampleSettings.main_phone,
          companyName: sampleSettings.company_name,
        })
      );

      expect(html).toContain('aria-current="page"');
      expect(html).toContain('border-b-2 border-brand text-brand');
      expect(html).toContain('href="/products"');
    });

    it("does not render portal in server markup to prevent SSR hydration errors", () => {
      const html = renderToStaticMarkup(
        React.createElement(HeaderNav, {
          links: NAV_LINKS,
          telHref: telHref(sampleSettings.main_phone),
          waHref: whatsappHref(sampleSettings.whatsapp_number),
          phoneLabel: sampleSettings.main_phone,
          companyName: sampleSettings.company_name,
        })
      );

      expect(html).not.toContain('id="mobile-drawer"');
    });
  });

  describe("3. Header component integration and branding", () => {
    it("renders sticky header with BAM logo and HeaderNav", () => {
      const html = renderToStaticMarkup(
        React.createElement(Header, { settings: sampleSettings })
      );

      expect(html).toContain("<header");
      expect(html).toContain("sticky top-0 z-40");
      expect(html).toContain('href="/"');
      expect(html).toContain('aria-label="Bait Al Majed Metal Works home"');
      expect(html).toContain('aria-label="Open menu"');
    });

    it("renders desktop-only Call and WhatsApp buttons", () => {
      const html = renderToStaticMarkup(
        React.createElement(Header, { settings: sampleSettings })
      );

      // Desktop Call button
      expect(html).toContain("hidden xl:inline-flex");
      expect(html).toContain('href="tel:+971547167455"');

      // Desktop WhatsApp button
      expect(html).toContain("hidden sm:inline-flex");
      expect(html).toContain('href="https://wa.me/971547167455"');
    });
  });
});
