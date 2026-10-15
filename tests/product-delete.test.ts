import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockRedirect,
  mockAssertAdmin,
  mockRevalidatePublic,
  mockReleaseAsset,
  mockDestroyAsset,
  mockState,
} = vi.hoisted(() => {
  const state = {
    selectEqField: "",
    selectEqVal: "",
    selectResult: { data: [] as unknown, error: null as unknown },
    deleteEqField: "",
    deleteEqVal: "",
    deleteResult: { error: null as unknown },
  };

  return {
    mockRedirect: vi.fn((url: string) => {
      throw new Error(`NEXT_REDIRECT:${url}`);
    }),
    mockAssertAdmin: vi.fn().mockResolvedValue(undefined),
    mockRevalidatePublic: vi.fn(),
    mockReleaseAsset: vi.fn().mockResolvedValue(undefined),
    mockDestroyAsset: vi.fn().mockResolvedValue(true),
    mockState: state,
  };
});

// Mock server-only
vi.mock("server-only", () => ({}));

// Mock next/navigation redirect
vi.mock("next/navigation", () => ({
  redirect: (url: string) => mockRedirect(url),
}));

// Mock assertAdmin
vi.mock("@/lib/supabase/auth", () => ({
  assertAdmin: () => mockAssertAdmin(),
}));

// Mock revalidatePublic
vi.mock("@/lib/data/cache", () => ({
  revalidatePublic: () => mockRevalidatePublic(),
}));

// Mock releaseAsset
vi.mock("@/lib/cloudinary/media", () => ({
  releaseAsset: (supabase: unknown, publicId: string) => mockReleaseAsset(supabase, publicId),
  saveImage: vi.fn(),
}));

// Mock destroyAsset
vi.mock("@/lib/cloudinary/client", () => ({
  destroyAsset: (publicId: string) => mockDestroyAsset(publicId),
  uploadImage: vi.fn(),
}));

// Mock Supabase client
vi.mock("@/lib/supabase/server", () => {
  const fakeSupabase = {
    from: vi.fn((table: string) => {
      if (table === "product_images") {
        return {
          select: vi.fn((_columns: string) => ({
            eq: vi.fn((field: string, val: string) => {
              mockState.selectEqField = field;
              mockState.selectEqVal = val;
              return Promise.resolve(mockState.selectResult);
            }),
          })),
        };
      }
      if (table === "products") {
        return {
          delete: vi.fn(() => ({
            eq: vi.fn((field: string, val: string) => {
              mockState.deleteEqField = field;
              mockState.deleteEqVal = val;
              return Promise.resolve(mockState.deleteResult);
            }),
          })),
        };
      }
      return {};
    }),
  };

  return {
    createClient: vi.fn().mockResolvedValue(fakeSupabase),
  };
});

import { deleteProduct } from "@/app/admin/actions/products";
import { releaseAsset } from "@/lib/cloudinary/media";

describe("deleteProduct action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockState.selectEqField = "";
    mockState.selectEqVal = "";
    mockState.selectResult = { data: [], error: null };
    mockState.deleteEqField = "";
    mockState.deleteEqVal = "";
    mockState.deleteResult = { error: null };
  });

  it("filters product_images by product_id rather than image primary key", async () => {
    const fd = new FormData();
    const productId = "prod-123";
    fd.append("id", productId);
    mockState.selectResult = { data: [{ public_id: "img-1" }], error: null };

    await expect(deleteProduct(fd)).rejects.toThrow("NEXT_REDIRECT:/admin/products?deleted=1");

    expect(mockState.selectEqField).toBe("product_id");
    expect(mockState.selectEqVal).toBe(productId);
    expect(mockState.deleteEqField).toBe("id");
    expect(mockState.deleteEqVal).toBe(productId);
  });

  it("identifies all images belonging to the product before deletion and releases each after success", async () => {
    const fd = new FormData();
    const productId = "prod-abc";
    fd.append("id", productId);
    mockState.selectResult = {
      data: [{ public_id: "img-alpha" }, { public_id: "img-beta" }, { public_id: "img-gamma" }],
      error: null,
    };

    await expect(deleteProduct(fd)).rejects.toThrow("NEXT_REDIRECT:/admin/products?deleted=1");

    expect(mockReleaseAsset).toHaveBeenCalledTimes(3);
    expect(mockReleaseAsset).toHaveBeenNthCalledWith(1, expect.anything(), "img-alpha");
    expect(mockReleaseAsset).toHaveBeenNthCalledWith(2, expect.anything(), "img-beta");
    expect(mockReleaseAsset).toHaveBeenNthCalledWith(3, expect.anything(), "img-gamma");
  });

  it("does not release assets if product deletion fails", async () => {
    const fd = new FormData();
    fd.append("id", "prod-fail");
    mockState.selectResult = { data: [{ public_id: "img-1" }, { public_id: "img-2" }], error: null };
    mockState.deleteResult = { error: new Error("Foreign key violation or DB error") };

    await expect(deleteProduct(fd)).rejects.toThrow("NEXT_REDIRECT:/admin/products?error=delete");

    // Product deletion failed: releaseAsset must never be called!
    expect(mockReleaseAsset).not.toHaveBeenCalled();
  });

  it("does not delete product or release assets if image lookup fails", async () => {
    const fd = new FormData();
    fd.append("id", "prod-lookup-fail");
    mockState.selectResult = { data: null, error: new Error("DB connection timeout") };

    await expect(deleteProduct(fd)).rejects.toThrow("NEXT_REDIRECT:/admin/products?error=delete");

    // Product delete must not be attempted if we cannot safely fetch images
    expect(mockState.deleteEqField).toBe("");
    expect(mockReleaseAsset).not.toHaveBeenCalled();
  });

  it("continues processing remaining images even if one releaseAsset call throws an error", async () => {
    const fd = new FormData();
    fd.append("id", "prod-partial");
    mockState.selectResult = {
      data: [{ public_id: "img-fail" }, { public_id: "img-success-1" }, { public_id: "img-success-2" }],
      error: null,
    };

    mockReleaseAsset
      .mockRejectedValueOnce(new Error("Network glitch"))
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(undefined);

    await expect(deleteProduct(fd)).rejects.toThrow("NEXT_REDIRECT:/admin/products?deleted=1");

    // All three were attempted despite the first throwing
    expect(mockReleaseAsset).toHaveBeenCalledTimes(3);
  });
});

describe("releaseAsset reference counting and failure tracking", () => {
  it("protects shared assets: does not delete from Cloudinary when reference count > 0", async () => {
    const { releaseAsset: actualReleaseAsset } = await vi.importActual<typeof import("@/lib/cloudinary/media")>("@/lib/cloudinary/media");
    const rpcMock = vi.fn().mockResolvedValue({ data: 2, error: null });
    const updateMock = vi.fn(() => ({ eq: vi.fn() }));
    const fakeClient = {
      rpc: rpcMock,
      from: vi.fn(() => ({ update: updateMock })),
    } as unknown as Parameters<typeof releaseAsset>[0];

    const warning = await actualReleaseAsset(fakeClient, "shared-asset-123");

    expect(rpcMock).toHaveBeenCalledWith("count_asset_references", { p_public_id: "shared-asset-123" });
    // Still in use elsewhere: destroyAsset should not be called
    expect(mockDestroyAsset).not.toHaveBeenCalled();
    expect(warning).toBeUndefined();
  });

  it("records cleanup failure status and error message in media_assets if Cloudinary deletion fails", async () => {
    const { releaseAsset: actualReleaseAsset } = await vi.importActual<typeof import("@/lib/cloudinary/media")>("@/lib/cloudinary/media");
    const rpcMock = vi.fn().mockResolvedValue({ data: 0, error: null });
    const updatePayloads: unknown[] = [];
    const eqMock = vi.fn();
    const updateMock = vi.fn((payload) => {
      updatePayloads.push(payload);
      return { eq: eqMock };
    });
    const fakeClient = {
      rpc: rpcMock,
      from: vi.fn(() => ({ update: updateMock })),
    } as unknown as Parameters<typeof releaseAsset>[0];

    mockDestroyAsset.mockRejectedValueOnce(new Error("Cloudinary rate limited"));

    const warning = await actualReleaseAsset(fakeClient, "orphan-asset-fail");

    expect(updatePayloads).toContainEqual({ cleanup_status: "pending_delete" });
    expect(updatePayloads).toContainEqual({
      cleanup_status: "delete_failed",
      cleanup_error: "Cloudinary rate limited",
    });
    expect(warning).toContain("Old image could not be removed from Cloudinary");
  });
});
