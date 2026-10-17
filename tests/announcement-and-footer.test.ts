import { describe, expect, it, vi, beforeEach } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import TopContactBar from "@/components/layout/TopContactBar";
import Footer from "@/components/layout/Footer";
import SettingsForm from "@/components/admin/SettingsForm";
import { DEFAULT_SETTINGS } from "@/lib/data/public";
import type { ServiceCard } from "@/lib/data/public-types";
import type { SiteSettings } from "@/types/db";

const {
  mockAssertAdmin,
  mockRevalidatePublic,
  mockSupabase,
} = vi.hoisted(() => {
  const supabase = {
    from: vi.fn(),
  };

  return {
    mockAssertAdmin: vi.fn().mockResolvedValue(undefined),
    mockRevalidatePublic: vi.fn(),
    mockSupabase: supabase,
  };
});

// Mock server-only
vi.mock("server-only", () => ({}));

// Mock next/navigation
vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
  usePathname: () => "/admin/settings",
  useSearchParams: () => new URLSearchParams(),
}));

// Mock auth
vi.mock("@/lib/supabase/auth", () => ({
  assertAdmin: () => mockAssertAdmin(),
  requireAdmin: () => mockAssertAdmin(),
}));

// Mock createClient
vi.mock("@/lib/supabase/server", () => ({
  createClient: () => Promise.resolve(mockSupabase),
}));

// Mock revalidatePublic
vi.mock("@/lib/data/cache", () => ({
  revalidatePublic: () => mockRevalidatePublic(),
}));

// Mock cloudinary media & action-helper
vi.mock("@/lib/cloudinary/media", () => ({
  releaseAsset: vi.fn().mockResolvedValue(undefined),
  saveImage: vi.fn().mockResolvedValue({ ok: true, publicId: "test-logo" }),
}));

vi.mock("@/lib/cloudinary/action-helper", () => ({
  extractImageInput: vi.fn().mockReturnValue({ directAsset: null, file: null }),
}));

// Mock CloudImage component
vi.mock("@/components/ui/CloudImage", () => ({
  default: ({ alt, className }: { alt: string; className?: string }) =>
    React.createElement("div", { "data-testid": "cloud-image", "aria-label": alt, className }),
}));

const mockServices: ServiceCard[] = [
  {
    id: "srv-1",
    title: "Material Handling Equipment",
    slug: "material-handling-equipment",
    short_description: "Trolleys, carts and handling equipment.",
    icon: "handling",
    image_public_id: null,
    image_alt: null,
    show_on_home: true,
    is_sample: false,
    sort_order: 1,
  },
  {
    id: "srv-2",
    title: "Steel Fabrication",
    slug: "steel-fabrication",
    short_description: "Custom welding and fabrication works.",
    icon: "fabrication",
    image_public_id: null,
    image_alt: null,
    show_on_home: true,
    is_sample: false,
    sort_order: 2,
  },
];

const mockSettings: SiteSettings = {
  ...DEFAULT_SETTINGS,
  company_name: "Bait Al Majed Metal Works",
  email: "info@bammetaluae.com",
  main_phone: "+971 54 716 7455",
  secondary_phone: "00971 55 754 5936",
  whatsapp_number: "+971 54 716 7455",
  facebook_url: "https://facebook.com/bammetal",
  instagram_url: "https://instagram.com/bammetal",
  x_url: "https://x.com/bammetal",
  youtube_url: "https://youtube.com/@bammetal",
  linkedin_url: "https://linkedin.com/company/bammetal",
};

describe("Twinplast-Style Top Contact & Social Bar (TopContactBar)", () => {
  it("1. renders contact details on the left (email, main telephone, secondary telephone)", () => {
    const html = renderToStaticMarkup(
      React.createElement(TopContactBar, { settings: mockSettings })
    );

    // Email link
    expect(html).toContain('href="mailto:info@bammetaluae.com"');
    expect(html).toContain("info@bammetaluae.com");

    // Main phone link
    expect(html).toContain('href="tel:+971547167455"');
    expect(html).toContain("+971 54 716 7455");

    // Secondary phone link
    expect(html).toContain('href="tel:+971557545936"');
    expect(html).toContain("00971 55 754 5936");
  });

  it("2. renders configured social media icons on the right with accessible labels", () => {
    const html = renderToStaticMarkup(
      React.createElement(TopContactBar, { settings: mockSettings })
    );

    expect(html).toContain('aria-label="Visit Bait Al Majed Metal Works on Facebook"');
    expect(html).toContain('href="https://facebook.com/bammetal"');
    expect(html).toContain('aria-label="Visit Bait Al Majed Metal Works on Instagram"');
    expect(html).toContain('href="https://instagram.com/bammetal"');
    expect(html).toContain('aria-label="Visit Bait Al Majed Metal Works on X (Twitter)"');
    expect(html).toContain('href="https://x.com/bammetal"');
    expect(html).toContain('aria-label="Visit Bait Al Majed Metal Works on YouTube"');
    expect(html).toContain('href="https://youtube.com/@bammetal"');
    expect(html).toContain('aria-label="Visit Bait Al Majed Metal Works on LinkedIn"');
    expect(html).toContain('href="https://linkedin.com/company/bammetal"');

    // External links open in new tab with safe rel
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
  });

  it("3. omits unconfigured social icons and filters unsafe schemes like javascript:", () => {
    const customSettings: SiteSettings = {
      ...mockSettings,
      facebook_url: null,
      instagram_url: "https://instagram.com/bammetal",
      x_url: "javascript:alert('xss')",
      youtube_url: null,
      linkedin_url: null,
    };

    const html = renderToStaticMarkup(
      React.createElement(TopContactBar, { settings: customSettings })
    );

    expect(html).not.toContain("Facebook");
    expect(html).not.toContain("javascript:");
    expect(html).not.toContain("X (Twitter)");
    expect(html).toContain('aria-label="Visit Bait Al Majed Metal Works on Instagram"');
  });

  it("4. does not contain centered announcement message, 'Learn more', or close (×) button", () => {
    const html = renderToStaticMarkup(
      React.createElement(TopContactBar, { settings: mockSettings })
    );

    expect(html).not.toContain("Learn more");
    expect(html).not.toContain('aria-label="Dismiss announcement"');
    expect(html).not.toContain("<button");
  });

  it("5. applies responsive classes: secondary phone hides on extra-small mobile, flex wraps without overflow", () => {
    const html = renderToStaticMarkup(
      React.createElement(TopContactBar, { settings: mockSettings })
    );

    // Secondary phone is hidden on narrow mobile screens
    expect(html).toContain("hidden sm:inline-flex");
    // Container uses responsive flex-wrap
    expect(html).toContain("flex-wrap");
    expect(html).toContain("container-page");
  });

  it("5a. renders nothing (no burgundy strip and no reserved space) when top_bar_enabled is false", () => {
    const html = renderToStaticMarkup(
      React.createElement(TopContactBar, {
        settings: { ...mockSettings, top_bar_enabled: false },
      })
    );

    expect(html).toBe("");
    expect(html).not.toContain("<aside");
    expect(html).not.toContain("bg-brand");
    expect(html).not.toContain("info@bammetaluae.com");
  });

  it("5b. renders nothing when top_contact_bar_enabled is false", () => {
    const html = renderToStaticMarkup(
      React.createElement(TopContactBar, {
        settings: { ...mockSettings, top_contact_bar_enabled: false },
      })
    );

    expect(html).toBe("");
    expect(html).not.toContain("<aside");
  });

  it("5c. defaults to visible when top_bar_enabled is undefined or true", () => {
    const withoutExplicit = { ...mockSettings };
    delete (withoutExplicit as any).top_bar_enabled;
    delete (withoutExplicit as any).top_contact_bar_enabled;

    const html = renderToStaticMarkup(
      React.createElement(TopContactBar, { settings: withoutExplicit as SiteSettings })
    );

    expect(html).toContain("<aside");
    expect(html).toContain("info@bammetaluae.com");
  });
});

describe("Footer Redesign & Responsiveness", () => {
  it("6. Products section is completely absent from the footer", () => {
    const html = renderToStaticMarkup(
      React.createElement(Footer, {
        settings: mockSettings,
        services: mockServices,
      })
    );

    expect(html).not.toMatch(/<h2[^>]*>\s*Products\s*<\/h2>/i);
    expect(html).not.toContain("/products?category=");
    expect(html).not.toContain("wheelbarrows");
  });

  it("7. Services links remain functional and dynamically populated from CMS data", () => {
    const html = renderToStaticMarkup(
      React.createElement(Footer, {
        settings: mockSettings,
        services: mockServices,
      })
    );

    expect(html).toContain("Services");
    expect(html).toContain("Material Handling Equipment");
    expect(html).toContain('href="/services/material-handling-equipment"');
    expect(html).toContain("Steel Fabrication");
    expect(html).toContain('href="/services/steel-fabrication"');
  });

  it("8. renders social media icons in footer only for configured platforms with accessible labels", () => {
    const htmlAll = renderToStaticMarkup(
      React.createElement(Footer, {
        settings: mockSettings,
        services: mockServices,
      })
    );

    expect(htmlAll).toContain('aria-label="Visit Bait Al Majed Metal Works on Facebook"');
    expect(htmlAll).toContain('aria-label="Visit Bait Al Majed Metal Works on Instagram"');
    expect(htmlAll).toContain('aria-label="Visit Bait Al Majed Metal Works on X (Twitter)"');
    expect(htmlAll).toContain('aria-label="Visit Bait Al Majed Metal Works on YouTube"');
    expect(htmlAll).toContain('aria-label="Visit Bait Al Majed Metal Works on LinkedIn"');
  });

  it("9. provides accessible mobile accordion buttons with aria-expanded and aria-controls", () => {
    const html = renderToStaticMarkup(
      React.createElement(Footer, {
        settings: mockSettings,
        services: mockServices,
      })
    );

    expect(html).toContain('id="footer-btn-services"');
    expect(html).toContain('aria-controls="footer-section-services"');
    expect(html).toContain('aria-expanded="false"');

    expect(html).toContain('id="footer-btn-links"');
    expect(html).toContain('aria-controls="footer-section-links"');
    expect(html).toContain('aria-expanded="false"');

    expect(html).toContain('id="footer-btn-contact"');
    expect(html).toContain('aria-controls="footer-section-contact"');
    expect(html).toContain('aria-expanded="false"');
  });

  it("10. desktop footer layout maintains intact multi-column structure without accordion buttons", () => {
    const html = renderToStaticMarkup(
      React.createElement(Footer, {
        settings: mockSettings,
        services: mockServices,
      })
    );

    expect(html).toContain("md:grid-cols-2 lg:grid-cols-4");
    expect(html).toContain("md:hidden");
    expect(html).toContain("hidden md:block");
    expect(html).toContain("md:!block");
    expect(html).toContain(mockSettings.main_phone);
    expect(html).toContain(mockSettings.email);
  });
});

describe("Admin Settings Server Action (saveSettings)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("11. rejects unauthorized access when assertAdmin fails", async () => {
    mockAssertAdmin.mockRejectedValueOnce(new Error("Unauthorized: admin session required"));

    const { saveSettings } = await import("@/app/admin/actions/content");
    const fd = new FormData();
    fd.append("company_name", "BAM");

    await expect(saveSettings({ ok: false }, fd)).rejects.toThrow("Unauthorized");
    expect(mockSupabase.from).not.toHaveBeenCalled();
  });

  it("12. validates and saves contact details and social links for authorized administrators", async () => {
    mockAssertAdmin.mockResolvedValue(undefined);
    const mockUpsert = vi.fn().mockResolvedValue({ error: null });
    const mockSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      }),
    });

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === "site_settings") {
        return {
          select: mockSelect,
          upsert: mockUpsert,
        };
      }
      return {};
    });

    const { saveSettings } = await import("@/app/admin/actions/content");
    const fd = new FormData();
    fd.append("company_name", "Bait Al Majed Metal Works");
    fd.append("main_phone", "+971 54 716 7455");
    fd.append("secondary_phone", "00971 55 754 5936");
    fd.append("whatsapp_number", "+971 54 716 7455");
    fd.append("email", "info@bammetaluae.com");
    fd.append("facebook_url", "https://facebook.com/bammetal");
    fd.append("instagram_url", "https://instagram.com/bammetal");
    fd.append("x_url", "https://x.com/bammetal");
    fd.append("youtube_url", "https://youtube.com/@bammetal");

    const result = await saveSettings({ ok: false }, fd);

    expect(result.ok).toBe(true);
    expect(result.message).toBe("Settings saved.");
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 1,
        company_name: "Bait Al Majed Metal Works",
        main_phone: "+971 54 716 7455",
        secondary_phone: "00971 55 754 5936",
        email: "info@bammetaluae.com",
        x_url: "https://x.com/bammetal",
        facebook_url: "https://facebook.com/bammetal",
      }),
      { onConflict: "id" }
    );
    expect(mockRevalidatePublic).toHaveBeenCalled();
  });

  it("13. rejects saving when social URL is unsafe (e.g. javascript:)", async () => {
    mockAssertAdmin.mockResolvedValue(undefined);

    const { saveSettings } = await import("@/app/admin/actions/content");
    const fd = new FormData();
    fd.append("company_name", "BAM");
    fd.append("main_phone", "+971 54 716 7455");
    fd.append("whatsapp_number", "+971 54 716 7455");
    fd.append("email", "info@bammetaluae.com");
    fd.append("x_url", "javascript:malicious()");

    const result = await saveSettings({ ok: false }, fd);
    expect(result.ok).toBe(false);
    expect(result.message).toBe("Please correct the highlighted fields.");
    expect(result.errors?.x_url).toBeDefined();
    expect(mockSupabase.from).not.toHaveBeenCalled();
  });
});
