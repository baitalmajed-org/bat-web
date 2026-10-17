import { describe, it, expect, vi, beforeEach } from "vitest";
import { IMAGE_LIMITS, validateImageFile, getImageLimit, type ImagePurpose } from "@/lib/cloudinary/limits";
import type { SupabaseClient } from "@supabase/supabase-js";

// Mock server-only
vi.mock("server-only", () => ({}));

const { mockUploadImage, mockDestroyAsset, mockAssertAdmin, mockSignRequest, mockVerifySignature } = vi.hoisted(() => ({
  mockUploadImage: vi.fn(),
  mockDestroyAsset: vi.fn().mockResolvedValue(true),
  mockAssertAdmin: vi.fn().mockResolvedValue({ id: "admin-1", email: "admin@bam.ae" }),
  mockSignRequest: vi.fn().mockReturnValue("mock-sig-12345"),
  mockVerifySignature: vi.fn().mockReturnValue(true),
}));

vi.mock("cloudinary", () => ({
  v2: {
    config: vi.fn(),
    utils: {
      api_sign_request: (...args: unknown[]) => mockSignRequest(...args),
      verify_api_response_signature: (...args: unknown[]) => mockVerifySignature(...args),
    },
    uploader: {
      upload_stream: vi.fn(),
      destroy: vi.fn().mockResolvedValue({ result: "ok" }),
    },
  },
}));

vi.mock("@/lib/env", () => ({
  cloudinaryConfig: () => ({
    cloudName: "bam-cloud",
    apiKey: "test-api-key",
    apiSecret: "super-secret-cloudinary-key",
    folder: "bam",
  }),
}));

vi.mock("@/lib/supabase/auth", () => ({
  assertAdmin: () => mockAssertAdmin(),
  getAdmin: () => mockAssertAdmin(),
}));

vi.mock("@/lib/cloudinary/client", () => ({
  uploadImage: (buffer: Buffer, purpose: string) => mockUploadImage(buffer, purpose),
  destroyAsset: (publicId: string) => mockDestroyAsset(publicId),
  isCloudinaryConfigured: () => true,
}));

describe("Image Upload Limits & Purpose Specifications", () => {
  it("centralized limits agree across client and server", () => {
    expect(IMAGE_LIMITS.product.maxBytes).toBe(5 * 1024 * 1024);
    expect(IMAGE_LIMITS.product.maxMB).toBe(5);

    expect(IMAGE_LIMITS.service.maxBytes).toBe(5 * 1024 * 1024);
    expect(IMAGE_LIMITS.service.maxMB).toBe(5);

    expect(IMAGE_LIMITS.about.maxBytes).toBe(5 * 1024 * 1024);
    expect(IMAGE_LIMITS.about.maxMB).toBe(5);

    expect(IMAGE_LIMITS.homepage_hero.maxBytes).toBe(8 * 1024 * 1024);
    expect(IMAGE_LIMITS.homepage_hero.maxMB).toBe(8);

    expect(IMAGE_LIMITS.homepage.maxBytes).toBe(5 * 1024 * 1024);
    expect(IMAGE_LIMITS.homepage.maxMB).toBe(5);

    expect(IMAGE_LIMITS.logo.maxBytes).toBe(2 * 1024 * 1024);
    expect(IMAGE_LIMITS.logo.maxMB).toBe(2);

    expect(IMAGE_LIMITS.category.maxBytes).toBe(5 * 1024 * 1024);
    expect(IMAGE_LIMITS.category.maxMB).toBe(5);

    expect(IMAGE_LIMITS.library.maxBytes).toBe(8 * 1024 * 1024);
    expect(IMAGE_LIMITS.library.maxMB).toBe(8);
  });

  it("accepts images above 1 MB but below the configured limit", () => {
    // 3 MB product image (above 1 MB old limit, below 5 MB)
    expect(validateImageFile({ size: 3 * 1024 * 1024, type: "image/jpeg" }, "product")).toBeNull();

    // 1.8 MB logo image (above 1 MB old limit, below 2 MB)
    expect(validateImageFile({ size: 1800 * 1024, type: "image/png" }, "logo")).toBeNull();

    // 4.5 MB service image (above 1 MB old limit, below 5 MB)
    expect(validateImageFile({ size: 4.5 * 1024 * 1024, type: "image/webp" }, "service")).toBeNull();

    // 7.2 MB homepage hero image (above 1 MB old limit, below 8 MB)
    expect(validateImageFile({ size: 7.2 * 1024 * 1024, type: "image/jpeg" }, "homepage_hero")).toBeNull();

    // 4 MB category image
    expect(validateImageFile({ size: 4 * 1024 * 1024, type: "image/jpeg" }, "category")).toBeNull();

    // 7 MB library image
    expect(validateImageFile({ size: 7 * 1024 * 1024, type: "image/webp" }, "library")).toBeNull();
  });

  it("rejects images above the configured limit with clear, purpose-specific errors", () => {
    // Product > 5 MB
    const prodErr = validateImageFile({ size: 5.2 * 1024 * 1024, type: "image/jpeg" }, "product");
    expect(prodErr).toContain("5 MB");
    expect(prodErr).toContain("Product image");

    // Logo > 2 MB
    const logoErr = validateImageFile({ size: 2.1 * 1024 * 1024, type: "image/png" }, "logo");
    expect(logoErr).toContain("2 MB");
    expect(logoErr).toContain("Logo");

    // Service > 5 MB
    const servErr = validateImageFile({ size: 5.5 * 1024 * 1024, type: "image/jpeg" }, "service");
    expect(servErr).toContain("5 MB");

    // Homepage Hero > 8 MB
    const heroErr = validateImageFile({ size: 8.3 * 1024 * 1024, type: "image/jpeg" }, "homepage_hero");
    expect(heroErr).toContain("8 MB");

    // Homepage non-hero > 5 MB
    const homeErr = validateImageFile({ size: 5.2 * 1024 * 1024, type: "image/jpeg" }, "homepage");
    expect(homeErr).toContain("5 MB");
  });

  it("rejects invalid formats for all purposes", () => {
    expect(validateImageFile({ size: 500, type: "image/gif" }, "product")).toContain("Only JPEG, PNG or WebP");
    expect(validateImageFile({ size: 500, type: "image/svg+xml" }, "logo")).toContain("Only JPEG, PNG or WebP");
    expect(validateImageFile({ size: 500, type: "application/pdf" }, "library")).toContain("Only JPEG, PNG or WebP");
    expect(validateImageFile({ size: 500, type: "application/x-msdownload" }, "category")).toContain("Only JPEG, PNG or WebP");
    expect(validateImageFile({ size: 500, type: "image/avif" }, "service")).toContain("Only JPEG, PNG or WebP");
  });

  it("rejects empty files (size 0)", () => {
    expect(validateImageFile({ size: 0, type: "image/jpeg" }, "product")).toBe("The selected file is empty.");
  });
});

describe("Direct Upload Authorization & Security (signature.ts & cloudinary.ts)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAssertAdmin.mockResolvedValue({ id: "admin-1", email: "admin@bam.ae" });
    mockVerifySignature.mockReturnValue(true);
  });

  it("requires an authenticated admin to generate upload signature", async () => {
    const { getDirectUploadSignature } = await import("@/app/admin/actions/cloudinary");

    mockAssertAdmin.mockRejectedValueOnce(new Error("UNAUTHORIZED"));
    const res = await getDirectUploadSignature("product", "0123456789abcdef0123");

    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.error).toContain("administrator");
    }
  });

  it("generates valid signed parameters for authorized admin without exposing API secret", async () => {
    const { getDirectUploadSignature } = await import("@/app/admin/actions/cloudinary");

    const res = await getDirectUploadSignature("product", "a1b2c3d4e5f678901234");
    expect(res.ok).toBe(true);

    if (res.ok) {
      // Must contain cloudName, apiKey, timestamp, signature, publicId
      expect(res.params.cloudName).toBe("bam-cloud");
      expect(res.params.apiKey).toBe("test-api-key");
      expect(res.params.publicId).toBe("bam/product/a1b2c3d4e5f678901234");
      expect(res.params.folder).toBe("bam/product");
      expect(res.params.transformation).toBe("c_limit,h_2400,q_auto:good,w_2400");
      expect(res.params.maxBytes).toBe(5 * 1024 * 1024);

      // CRITICAL SECURITY REQUIREMENT: API secret must NEVER appear in client payload
      expect((res.params as unknown as Record<string, unknown>).apiSecret).toBeUndefined();
      expect((res.params as unknown as Record<string, unknown>).api_secret).toBeUndefined();
      expect(JSON.stringify(res.params)).not.toContain("super-secret-cloudinary-key");
    }
  });

  it("verifies direct asset: accepts valid asset and validates constraints", async () => {
    const { verifyDirectAsset } = await import("@/lib/cloudinary/signature");

    const validAsset = {
      publicId: "bam/product/a1b2c3d4e5f678901234",
      secureUrl: "https://res.cloudinary.com/bam-cloud/image/upload/v1/bam/product/a1b2c3d4e5f678901234.jpg",
      bytes: 3.5 * 1024 * 1024,
      width: 2400,
      height: 1800,
      format: "jpg",
      version: 123456,
      signature: "mock-sig-12345",
    };

    const verified = verifyDirectAsset(validAsset, "product");
    expect(verified.publicId).toBe(validAsset.publicId);
    expect(verified.bytes).toBe(validAsset.bytes);
    expect(mockSignRequest).toHaveBeenCalledWith(
      { public_id: validAsset.publicId, version: 123456 },
      "super-secret-cloudinary-key"
    );
  });

  it("verifies direct asset: rejects asset placed in unauthorized folder", async () => {
    const { verifyDirectAsset } = await import("@/lib/cloudinary/signature");

    const rogueAsset = {
      publicId: "other_folder/malicious_asset",
      secureUrl: "https://res.cloudinary.com/bam-cloud/image/upload/v1/other_folder/malicious_asset.jpg",
      bytes: 100000,
      width: 800,
      height: 600,
      format: "jpg",
    };

    expect(() => verifyDirectAsset(rogueAsset, "product")).toThrow("Unauthorized asset location");
  });

  it("verifies direct asset: rejects asset exceeding configured purpose limit", async () => {
    const { verifyDirectAsset } = await import("@/lib/cloudinary/signature");

    const oversizedAsset = {
      publicId: "bam/logo/logo-test",
      secureUrl: "https://res.cloudinary.com/bam-cloud/image/upload/v1/bam/logo/logo-test.png",
      bytes: 2.5 * 1024 * 1024, // 2.5 MB exceeds 2 MB logo limit
      width: 800,
      height: 600,
      format: "png",
    };

    expect(() => verifyDirectAsset(oversizedAsset, "logo")).toThrow("exceeds maximum allowed size");
  });

  it("verifies direct asset: rejects tampered Cloudinary response signature", async () => {
    const { verifyDirectAsset } = await import("@/lib/cloudinary/signature");

    mockVerifySignature.mockReturnValueOnce(false); // verification failed

    const tamperedAsset = {
      publicId: "bam/product/forged-id",
      secureUrl: "https://res.cloudinary.com/bam-cloud/image/upload/v1/bam/product/forged-id.jpg",
      bytes: 100000,
      width: 800,
      height: 600,
      format: "jpg",
      version: 123,
      signature: "fake-sig",
    };

    expect(() => verifyDirectAsset(tamperedAsset, "product")).toThrow("Security check failed");
  });
});

describe("Direct Upload Asset Lifecycle, Safety & Compensation (media.ts)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockVerifySignature.mockReturnValue(true);
  });

  it("safely records direct-uploaded asset and compensates by releasing if DB update fails", async () => {
    const { saveImage } = await import("@/lib/cloudinary/media");

    const upsertMock = vi.fn().mockResolvedValue({ error: null });
    const rpcMock = vi.fn().mockResolvedValue({ data: 0, error: null });
    const deleteMock = vi.fn().mockReturnValue({ eq: vi.fn() });

    const fakeClient = {
      from: vi.fn((table: string) => {
        if (table === "media_assets") {
          return { upsert: upsertMock, delete: deleteMock, update: vi.fn().mockReturnValue({ eq: vi.fn() }) };
        }
        return {};
      }),
      rpc: rpcMock,
    } as unknown as SupabaseClient;

    const directAsset = {
      publicId: "bam/product/brand-new-direct-asset",
      secureUrl: "https://res.cloudinary.com/bam-cloud/image/upload/bam/product/brand-new-direct-asset.jpg",
      bytes: 3 * 1024 * 1024, // 3 MB
      width: 2000,
      height: 1500,
      format: "jpg",
      version: 1700000000,
      signature: "mock-sig-12345",
    };

    // Database update fails!
    const applyUpdate = vi.fn().mockResolvedValue({ error: "DB deadlock violation" });

    const result = await saveImage({
      supabase: fakeClient,
      directAsset,
      purpose: "product",
      alt: "Product view",
      oldPublicId: "bam/product/existing-safe-asset",
      applyUpdate,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("DB deadlock violation");
    }

    // New unreferenced asset MUST be released
    expect(rpcMock).toHaveBeenCalledWith("count_asset_references", { p_public_id: "bam/product/brand-new-direct-asset" });
    // Old asset MUST NOT be released or touched
    expect(rpcMock).not.toHaveBeenCalledWith("count_asset_references", { p_public_id: "bam/product/existing-safe-asset" });
    expect(mockDestroyAsset).not.toHaveBeenCalledWith("bam/product/existing-safe-asset");
  });

  it("releases old asset only after database update succeeds with direct asset", async () => {
    const { saveImage } = await import("@/lib/cloudinary/media");

    const upsertMock = vi.fn().mockResolvedValue({ error: null });
    const rpcMock = vi.fn().mockResolvedValue({ data: 0, error: null }); // old asset has 0 references
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

    const directAsset = {
      publicId: "bam/homepage_hero/banner-direct",
      secureUrl: "https://res.cloudinary.com/bam-cloud/image/upload/bam/homepage_hero/banner-direct.webp",
      bytes: 6 * 1024 * 1024, // 6 MB hero
      width: 2400,
      height: 1350,
      format: "webp",
      version: 1700000001,
      signature: "mock-sig-12345",
    };

    const applyUpdate = vi.fn().mockResolvedValue({ error: null });

    const result = await saveImage({
      supabase: fakeClient,
      directAsset,
      purpose: "homepage_hero",
      alt: "Hero Banner",
      oldPublicId: "bam/homepage_hero/old-hero-asset",
      applyUpdate,
    });

    expect(result.ok).toBe(true);
    expect(applyUpdate).toHaveBeenCalled();
    // Old asset checked and released
    expect(rpcMock).toHaveBeenCalledWith("count_asset_references", { p_public_id: "bam/homepage_hero/old-hero-asset" });
    expect(mockDestroyAsset).toHaveBeenCalledWith("bam/homepage_hero/old-hero-asset");
  });

  it("shared assets cannot be deleted prematurely when still referenced", async () => {
    const { releaseAsset } = await import("@/lib/cloudinary/media");

    // count_asset_references returns 2 (still used in 2 products/sections)
    const rpcMock = vi.fn().mockResolvedValue({ data: 2, error: null });
    const fakeClient = { rpc: rpcMock } as unknown as SupabaseClient;

    const warning = await releaseAsset(fakeClient, "bam/product/shared-asset-123");
    expect(warning).toBeUndefined();
    // destroyAsset must NOT be called because references remain
    expect(mockDestroyAsset).not.toHaveBeenCalled();
  });
});
