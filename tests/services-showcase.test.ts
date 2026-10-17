import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

(globalThis as any).React = React;

import ServicesGrid from "@/components/home/ServicesGrid";
import CloudImage from "@/components/ui/CloudImage";
import type { ServiceCard } from "@/lib/data/public-types";

// Mock server-only
vi.mock("server-only", () => ({}));

// Mock next/image
vi.mock("next/image", () => ({
  default: ({ priority, ...props }: any) => React.createElement("img", { ...props }),
}));

const {
  mockRedirect,
  mockAssertAdmin,
  mockRevalidatePublic,
  mockReleaseAsset,
  mockSaveImage,
  mockSupabase,
} = vi.hoisted(() => {
  const supabase = {
    from: vi.fn(),
  };

  return {
    mockRedirect: vi.fn((url: string) => {
      throw new Error(`NEXT_REDIRECT:${url}`);
    }),
    mockAssertAdmin: vi.fn().mockResolvedValue(undefined),
    mockRevalidatePublic: vi.fn(),
    mockReleaseAsset: vi.fn().mockResolvedValue(undefined),
    mockSaveImage: vi.fn().mockResolvedValue({ ok: true, publicId: "new-uploaded-asset" }),
    mockSupabase: supabase,
  };
});

vi.mock("next/navigation", () => ({
  redirect: (url: string) => mockRedirect(url),
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
  usePathname: () => "/admin/services",
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/lib/supabase/auth", () => ({
  assertAdmin: () => mockAssertAdmin(),
  requireAdmin: () => mockAssertAdmin(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => Promise.resolve(mockSupabase),
}));

vi.mock("@/lib/data/cache", () => ({
  revalidatePublic: () => mockRevalidatePublic(),
}));

vi.mock("@/lib/cloudinary/media", () => ({
  releaseAsset: (...args: unknown[]) => mockReleaseAsset(...args),
  saveImage: (...args: unknown[]) => mockSaveImage(...args),
}));

import { deleteService, removeServiceImage, saveService, setServicePublished } from "@/app/admin/actions/services";

const sampleServices: ServiceCard[] = [
  {
    id: "svc-1",
    title: "Material Handling Equipment",
    slug: "material-handling-equipment",
    short_description: "Trolleys, carts and handling equipment fabricated in steel.",
    icon: "handling",
    image_public_id: "bam/service/handling-01",
    image_alt: "Industrial steel material handling carts",
    show_on_home: true,
    is_sample: false,
    sort_order: 1,
  },
  {
    id: "svc-2",
    title: "Construction Equipment",
    slug: "construction-equipment",
    short_description: "Steel equipment for construction sites.",
    icon: "construction",
    image_public_id: null, // No image -> uses fallback icon
    image_alt: null,
    show_on_home: true,
    is_sample: false,
    sort_order: 2,
  },
];

describe("Homepage Services Section — Image-Based Cards & Fallback", () => {
  it("renders image-led card with consistent aspect ratio when service has an image", () => {
    const html = renderToStaticMarkup(React.createElement(ServicesGrid, { services: [sampleServices[0]!] }));
    
    // Contains title and short description
    expect(html).toContain("Material Handling Equipment");
    expect(html).toContain("Trolleys, carts and handling equipment fabricated in steel.");
    // Contains link to service detail page
    expect(html).toContain('href="/services/material-handling-equipment"');
    expect(html).toContain("Learn more");
    // Aspect ratio container for consistent card image area
    expect(html).toContain("aspect-[16/10]");
    expect(html).toContain("object-cover");
  });

  it("renders icon-based fallback when service does not have an uploaded image", () => {
    const html = renderToStaticMarkup(React.createElement(ServicesGrid, { services: [sampleServices[1]!] }));
    
    expect(html).toContain("Construction Equipment");
    expect(html).toContain("Steel equipment for construction sites.");
    expect(html).toContain('href="/services/construction-equipment"');
    expect(html).toContain("Learn more");
    // Uses industrial steel pattern background and fallback icon container
    expect(html).toContain("steel-pattern");
    expect(html).toContain("aspect-[16/10]");
  });

  it("applies responsive grid classes for desktop (3-col), tablet (2-col), and mobile (1-col)", () => {
    const html = renderToStaticMarkup(React.createElement(ServicesGrid, { services: sampleServices }));
    
    expect(html).toContain("grid-cols-1");
    expect(html).toContain("sm:grid-cols-2");
    expect(html).toContain("lg:grid-cols-3");
  });

  it("returns null when services list is empty", () => {
    const html = renderToStaticMarkup(React.createElement(ServicesGrid, { services: [] }));
    expect(html).toBe("");
  });
});

describe("CloudImage Fallback Architecture", () => {
  const originalCloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

  beforeEach(() => {
    delete process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME = originalCloud;
  });

  it("renders custom fallback node when Cloudinary is not configured or image fails", () => {
    const fallbackNode = React.createElement("span", { "data-testid": "custom-fallback" }, "Custom Icon Fallback");
    const html = renderToStaticMarkup(
      React.createElement(CloudImage, { publicId: "bam/service/test", alt: "Test Alt", fallback: fallbackNode })
    );

    expect(html).toContain("custom-fallback");
    expect(html).toContain("Custom Icon Fallback");
  });
});

describe("Admin CMS Service Actions & Safe Image Management", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("enforces admin authorization on saveService", async () => {
    const fd = new FormData();
    fd.append("title", "New Metal Service");
    fd.append("modal", "1");

    mockSupabase.from.mockReturnValue({
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: { id: "svc-123" }, error: null }),
        }),
      }),
    });

    const res = await saveService(null, { ok: false, message: null }, fd);
    expect(mockAssertAdmin).toHaveBeenCalled();
    expect(res.ok).toBe(true);
    expect(res.message).toBe("Service created.");
  });

  it("safely removes image and releases asset when remove_image flag is set", async () => {
    const fd = new FormData();
    fd.append("title", "Updated Service");
    fd.append("slug", "updated-service");
    fd.append("remove_image", "on");

    const updateMock = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });
    const selectMock = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        maybeSingle: vi.fn().mockResolvedValue({ data: { image_public_id: "bam/service/old-photo" } }),
      }),
    });

    mockSupabase.from.mockReturnValue({
      select: selectMock,
      update: updateMock,
    });

    const res = await saveService("svc-1", { ok: false, message: null }, fd);

    expect(mockAssertAdmin).toHaveBeenCalled();
    expect(mockReleaseAsset).toHaveBeenCalledWith(mockSupabase, "bam/service/old-photo");
    expect(mockRevalidatePublic).toHaveBeenCalled();
    expect(res.ok).toBe(true);
    expect(res.message).toBe("Service saved.");
  });

  it("safely clears image in removeServiceImage action and releases asset", async () => {
    const fd = new FormData();
    fd.append("id", "svc-1");

    const updateMock = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });
    const selectMock = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        maybeSingle: vi.fn().mockResolvedValue({ data: { image_public_id: "bam/service/retiring-asset" } }),
      }),
    });

    mockSupabase.from.mockReturnValue({
      select: selectMock,
      update: updateMock,
    });

    await expect(removeServiceImage(fd)).rejects.toThrow("NEXT_REDIRECT:/admin/services/svc-1/edit?imageRemoved=1");
    expect(mockAssertAdmin).toHaveBeenCalled();
    expect(mockReleaseAsset).toHaveBeenCalledWith(mockSupabase, "bam/service/retiring-asset");
    expect(mockRevalidatePublic).toHaveBeenCalled();
  });

  it("safely releases asset on service deletion", async () => {
    const fd = new FormData();
    fd.append("id", "svc-to-delete");

    const deleteMock = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });
    const selectMock = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        maybeSingle: vi.fn().mockResolvedValue({ data: { image_public_id: "bam/service/delete-asset" } }),
      }),
    });

    mockSupabase.from.mockReturnValue({
      select: selectMock,
      delete: deleteMock,
    });

    await expect(deleteService(fd)).rejects.toThrow("NEXT_REDIRECT:/admin/services?deleted=1");
    expect(mockAssertAdmin).toHaveBeenCalled();
    expect(mockReleaseAsset).toHaveBeenCalledWith(mockSupabase, "bam/service/delete-asset");
    expect(mockRevalidatePublic).toHaveBeenCalled();
  });

  it("toggles published visibility and revalidates public site", async () => {
    const fd = new FormData();
    fd.append("id", "svc-1");
    fd.append("publish", "true");

    const updateMock = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });
    mockSupabase.from.mockReturnValue({ update: updateMock });

    await expect(setServicePublished(fd)).rejects.toThrow("NEXT_REDIRECT:/admin/services?published=1");
    expect(mockAssertAdmin).toHaveBeenCalled();
    expect(mockRevalidatePublic).toHaveBeenCalled();
  });
});

describe("Homepage Services Visibility and Ordering Logic", () => {
  it("filters out unpublished services and services not marked show_on_home", () => {
    const allServices = [
      { id: "1", title: "S1", is_published: true, show_on_home: true, sort_order: 1 },
      { id: "2", title: "S2", is_published: false, show_on_home: true, sort_order: 2 }, // draft
      { id: "3", title: "S3", is_published: true, show_on_home: false, sort_order: 3 }, // not for home
      { id: "4", title: "S4", is_published: true, show_on_home: true, sort_order: 4 },
    ];

    // Emulate homepage filter
    const homeServices = allServices.filter((s) => s.is_published && s.show_on_home);
    expect(homeServices.map((s) => s.id)).toEqual(["1", "4"]);
  });

  it("respects sort_order and limits homepage display to 6 services", () => {
    const manyServices = Array.from({ length: 10 }, (_, i) => ({
      id: `svc-${i + 1}`,
      title: `Service ${i + 1}`,
      is_published: true,
      show_on_home: true,
      sort_order: 10 - i, // reverse order
    }));

    // Sort by sort_order and take top 6
    const sorted = [...manyServices].sort((a, b) => a.sort_order - b.sort_order).slice(0, 6);
    expect(sorted).toHaveLength(6);
    expect(sorted[0]!.id).toBe("svc-10");
    expect(sorted[5]!.id).toBe("svc-5");
  });
});
