import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanPublicId, cloudinaryUrl } from "@/lib/cloudinary/urls";
import { validateImageFile, MAX_IMAGE_BYTES } from "@/lib/validation/schemas";
import type { SupabaseClient } from "@supabase/supabase-js";

// Mock server-only
vi.mock("server-only", () => ({}));

const { mockUploadImage, mockDestroyAsset } = vi.hoisted(() => ({
  mockUploadImage: vi.fn(),
  mockDestroyAsset: vi.fn().mockResolvedValue(true),
}));

vi.mock("@/lib/cloudinary/client", () => ({
  uploadImage: (buffer: Buffer, purpose: string) => mockUploadImage(buffer, purpose),
  destroyAsset: (publicId: string) => mockDestroyAsset(publicId),
  isCloudinaryConfigured: () => true,
}));

describe("Cloudinary URL Builder & Sanitization (urls.ts)", () => {
  const originalEnv = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME = "bam-cloud";
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME = originalEnv;
  });

  describe("cleanPublicId", () => {
    it("preserves standard public IDs unchanged", () => {
      expect(cleanPublicId("bam/products/wheelbarrow-01")).toBe("bam/products/wheelbarrow-01");
      expect(cleanPublicId("bam/hero/workshop-main")).toBe("bam/hero/workshop-main");
    });

    it("strips leading slashes", () => {
      expect(cleanPublicId("/bam/services/welding")).toBe("bam/services/welding");
      expect(cleanPublicId("///bam/products/pallet")).toBe("bam/products/pallet");
    });

    it("extracts public ID from full Cloudinary URL with version tag and extension", () => {
      const fullUrl = "https://res.cloudinary.com/bam-cloud/image/upload/v1700000000/bam/products/gas-trolley.jpg";
      expect(cleanPublicId(fullUrl)).toBe("bam/products/gas-trolley");
    });

    it("extracts public ID from full Cloudinary URL with transformation parameters", () => {
      const fullUrl = "https://res.cloudinary.com/bam-cloud/image/upload/f_auto,q_auto,w_800/v1700000000/bam/homepage/hero.webp";
      expect(cleanPublicId(fullUrl)).toBe("bam/homepage/hero");
    });

    it("handles null, undefined, empty, and non-string inputs safely", () => {
      expect(cleanPublicId("")).toBe("");
      expect(cleanPublicId("   ")).toBe("");
      expect(cleanPublicId(null as unknown as string)).toBe("");
      expect(cleanPublicId(undefined as unknown as string)).toBe("");
      expect(cleanPublicId(12345 as unknown as string)).toBe("");
    });
  });

  describe("cloudinaryUrl", () => {
    it("returns empty string when cloud name is missing", () => {
      delete process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
      expect(cloudinaryUrl("bam/products/sample", 600)).toBe("");
    });

    it("returns empty string when publicId is empty or blank", () => {
      expect(cloudinaryUrl("", 600)).toBe("");
      expect(cloudinaryUrl("   ", 600)).toBe("");
      expect(cloudinaryUrl(null as unknown as string, 600)).toBe("");
    });

    it("generates correct transformation URL for hero preset (16:9, fill)", () => {
      const url = cloudinaryUrl("bam/hero/main", 1920, "hero");
      expect(url).toContain("https://res.cloudinary.com/bam-cloud/image/upload/");
      expect(url).toContain("c_fill");
      expect(url).toContain("ar_16:9");
      expect(url).toContain("g_auto");
      expect(url).toContain("w_1920");
      expect(url.endsWith("/bam/hero/main")).toBe(true);
    });

    it("generates correct transformation URL for card preset (4:3, fill)", () => {
      const url = cloudinaryUrl("bam/products/wheelbarrow", 400, "card");
      expect(url).toContain("c_fill");
      expect(url).toContain("ar_4:3");
      expect(url).toContain("w_400");
      expect(url.endsWith("/bam/products/wheelbarrow")).toBe(true);
    });

    it("generates correct transformation URL for thumb preset (1:1, fill)", () => {
      const url = cloudinaryUrl("bam/products/thumb-1", 120, "thumb");
      expect(url).toContain("c_fill");
      expect(url).toContain("ar_1:1");
      expect(url).toContain("w_120");
      expect(url.endsWith("/bam/products/thumb-1")).toBe(true);
    });

    it("generates correct transformation URL for gallery preset (limit without aspect crop)", () => {
      const url = cloudinaryUrl("bam/products/gallery-1", 1200, "gallery");
      expect(url).toContain("c_limit");
      expect(url).not.toContain("ar_");
      expect(url).toContain("w_1200");
    });

    it("sanitizes full URL passed as publicId to avoid malformed double URLs", () => {
      const raw = "https://res.cloudinary.com/bam-cloud/image/upload/v12345/bam/products/concrete-bucket.jpg";
      const url = cloudinaryUrl(raw, 800, "card");
      expect(url).not.toContain("https://res.cloudinary.com/bam-cloud/image/upload/https");
      expect(url.endsWith("/bam/products/concrete-bucket")).toBe(true);
    });

    it("defaults to standard width when 0 or invalid width is passed", () => {
      const url = cloudinaryUrl("bam/products/test", 0, "card");
      expect(url).toContain("w_800");
    });
  });
});

describe("Image File Validation (schemas.ts)", () => {
  it("accepts valid JPEG, PNG, and WebP images", () => {
    expect(validateImageFile({ size: 1024, type: "image/jpeg" })).toBeNull();
    expect(validateImageFile({ size: 2048, type: "image/png" })).toBeNull();
    expect(validateImageFile({ size: 4096, type: "image/webp" })).toBeNull();
  });

  it("rejects empty files (size 0)", () => {
    const error = validateImageFile({ size: 0, type: "image/jpeg" });
    expect(error).toBe("The selected file is empty.");
  });

  it("rejects oversized images greater than 8 MB", () => {
    const error = validateImageFile({ size: MAX_IMAGE_BYTES + 1, type: "image/jpeg" });
    expect(error).toContain("larger than 8 MB");
  });

  it("rejects unsupported MIME types (GIF, SVG, PDF, EXE)", () => {
    expect(validateImageFile({ size: 1024, type: "image/gif" })).toContain("Only JPEG, PNG or WebP");
    expect(validateImageFile({ size: 1024, type: "image/svg+xml" })).toContain("Only JPEG, PNG or WebP");
    expect(validateImageFile({ size: 1024, type: "application/pdf" })).toContain("Only JPEG, PNG or WebP");
    expect(validateImageFile({ size: 1024, type: "application/x-msdownload" })).toContain("Only JPEG, PNG or WebP");
  });
});

describe("Safe Image Replacement & Rollback Workflow (media.ts)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects invalid file before calling Cloudinary upload or database", async () => {
    const { saveImage } = await import("@/lib/cloudinary/media");
    const fakeClient = {} as SupabaseClient;
    const fakeFile = new File([], "empty.jpg", { type: "image/jpeg" });
    const applyUpdate = vi.fn();

    const result = await saveImage({
      supabase: fakeClient,
      file: fakeFile,
      purpose: "product",
      alt: "Empty test",
      applyUpdate,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("The selected file is empty.");
    }
    expect(mockUploadImage).not.toHaveBeenCalled();
    expect(applyUpdate).not.toHaveBeenCalled();
  });

  it("preserves previous image and safely releases new asset if DB update fails", async () => {
    const { saveImage } = await import("@/lib/cloudinary/media");

    mockUploadImage.mockResolvedValueOnce({
      publicId: "bam/product/new-hash-123",
      secureUrl: "https://res.cloudinary.com/cloud/image/upload/bam/product/new-hash-123.jpg",
      bytes: 50000,
      width: 1200,
      height: 900,
      format: "jpg",
    });

    const upsertMock = vi.fn().mockResolvedValue({ error: null });
    const rpcMock = vi.fn().mockResolvedValue({ data: 0, error: null });
    const updateMock = vi.fn().mockReturnValue({ eq: vi.fn() });

    const fakeClient = {
      from: vi.fn((table: string) => {
        if (table === "media_assets") {
          return { upsert: upsertMock, update: updateMock };
        }
        return {};
      }),
      rpc: rpcMock,
    } as unknown as SupabaseClient;

    const fakeFile = new File([new Uint8Array(100)], "sample.jpg", { type: "image/jpeg" });
    const applyUpdate = vi.fn().mockResolvedValue({ error: "DB connection failed" });

    const result = await saveImage({
      supabase: fakeClient,
      file: fakeFile,
      purpose: "product",
      alt: "Sample alt",
      oldPublicId: "bam/product/old-working-asset",
      applyUpdate,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("DB connection failed");
    }
    // Verify reference counting was checked for new asset compensation
    expect(rpcMock).toHaveBeenCalledWith("count_asset_references", { p_public_id: "bam/product/new-hash-123" });
    // Verify that the old working asset was NEVER released or touched
    expect(rpcMock).not.toHaveBeenCalledWith("count_asset_references", { p_public_id: "bam/product/old-working-asset" });
  });

  it("releases old asset only after database update succeeds", async () => {
    const { saveImage } = await import("@/lib/cloudinary/media");

    mockUploadImage.mockResolvedValueOnce({
      publicId: "bam/product/brand-new-hash",
      secureUrl: "https://res.cloudinary.com/cloud/image/upload/bam/product/brand-new-hash.jpg",
      bytes: 60000,
      width: 1200,
      height: 900,
      format: "jpg",
    });

    const upsertMock = vi.fn().mockResolvedValue({ error: null });
    // Old asset now has 0 references remaining in content
    const rpcMock = vi.fn().mockResolvedValue({ data: 0, error: null });
    const updateMock = vi.fn().mockReturnValue({ eq: vi.fn() });

    const fakeClient = {
      from: vi.fn((table: string) => {
        if (table === "media_assets") {
          return { upsert: upsertMock, update: updateMock };
        }
        return {};
      }),
      rpc: rpcMock,
    } as unknown as SupabaseClient;

    const fakeFile = new File([new Uint8Array(100)], "new.jpg", { type: "image/jpeg" });
    const applyUpdate = vi.fn().mockResolvedValue({ error: null });

    const result = await saveImage({
      supabase: fakeClient,
      file: fakeFile,
      purpose: "product",
      alt: "New Alt",
      oldPublicId: "bam/product/retiring-asset",
      applyUpdate,
    });

    expect(result.ok).toBe(true);
    expect(applyUpdate).toHaveBeenCalled();
    // Verify reference counting was checked on the retiring old asset
    expect(rpcMock).toHaveBeenCalledWith("count_asset_references", { p_public_id: "bam/product/retiring-asset" });
    expect(mockDestroyAsset).toHaveBeenCalledWith("bam/product/retiring-asset");
  });

  it("does not release old asset when replacement is identical (same SHA-1 deduplication)", async () => {
    const { saveImage } = await import("@/lib/cloudinary/media");

    mockUploadImage.mockResolvedValueOnce({
      publicId: "bam/product/identical-hash",
      secureUrl: "https://res.cloudinary.com/cloud/image/upload/bam/product/identical-hash.jpg",
      bytes: 40000,
      width: 1000,
      height: 750,
      format: "jpg",
    });

    const upsertMock = vi.fn().mockResolvedValue({ error: null });
    const rpcMock = vi.fn().mockResolvedValue({ data: 1, error: null });

    const fakeClient = {
      from: vi.fn(() => ({ upsert: upsertMock })),
      rpc: rpcMock,
    } as unknown as SupabaseClient;

    const fakeFile = new File([new Uint8Array(100)], "same.jpg", { type: "image/jpeg" });
    const applyUpdate = vi.fn().mockResolvedValue({ error: null });

    const result = await saveImage({
      supabase: fakeClient,
      file: fakeFile,
      purpose: "product",
      alt: "Same Image",
      oldPublicId: "bam/product/identical-hash", // same ID
      applyUpdate,
    });

    expect(result.ok).toBe(true);
    // When oldPublicId === asset.publicId, releaseAsset should not be called
    expect(rpcMock).not.toHaveBeenCalled();
    expect(mockDestroyAsset).not.toHaveBeenCalled();
  });
});
