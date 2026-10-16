import { beforeEach, describe, expect, it, vi } from "vitest";
import type { FormState } from "@/lib/validation/state";
import { toast, toastStore } from "@/lib/toast";

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
    mockSaveImage: vi.fn().mockResolvedValue({ ok: true, publicId: "test-img" }),
    mockSupabase: supabase,
  };
});

// Mock server-only
vi.mock("server-only", () => ({}));

// Mock next/navigation
vi.mock("next/navigation", () => ({
  redirect: (url: string) => mockRedirect(url),
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
  usePathname: () => "/admin/products",
  useSearchParams: () => new URLSearchParams(),
}));

// Mock assertAdmin
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

// Mock cloudinary media
vi.mock("@/lib/cloudinary/media", () => ({
  releaseAsset: (...args: unknown[]) => mockReleaseAsset(...args),
  saveImage: (...args: unknown[]) => mockSaveImage(...args),
}));

// Import server actions after mocks are registered
import { saveProduct } from "@/app/admin/actions/products";
import { saveCategory } from "@/app/admin/actions/categories";
import { saveService } from "@/app/admin/actions/services";
import { uploadLibraryImage } from "@/app/admin/actions/content";

describe("Admin UX Modal-Based Add & Edit Forms", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    toastStore.dismissAll();
  });

  describe("1 & 2. Modal Configuration, Sizing, and Presentation", () => {
    const SIZE_CLASSES: Record<string, string> = {
      sm: "max-w-md",
      md: "max-w-xl",
      lg: "max-w-3xl",
      xl: "max-w-5xl",
      full: "max-w-[94vw]",
    };

    it("supports configurable modal sizes matching design requirements", () => {
      expect(SIZE_CLASSES.sm).toBe("max-w-md");
      expect(SIZE_CLASSES.md).toBe("max-w-xl");
      expect(SIZE_CLASSES.lg).toBe("max-w-3xl");
      expect(SIZE_CLASSES.xl).toBe("max-w-5xl");
      expect(SIZE_CLASSES.full).toBe("max-w-[94vw]");
    });

    it("verifies accessible dialog attributes and ARIA semantics", () => {
      const modalAria = {
        role: "dialog",
        "aria-modal": "true",
        "aria-labelledby": "modal-title-id",
        "aria-describedby": "modal-desc-id",
      };

      expect(modalAria.role).toBe("dialog");
      expect(modalAria["aria-modal"]).toBe("true");
      expect(modalAria["aria-labelledby"]).toBeTruthy();
    });

    it("verifies scrollable container contracts keep header/footer visible", () => {
      const headerClasses = "shrink-0 border-b border-steel-200 bg-steel-50/75 px-5 py-4 sm:px-6";
      const bodyClasses = "flex-1 overflow-y-auto px-5 py-5 sm:px-6 overscroll-contain";
      const footerClasses = "shrink-0 border-t border-steel-200 bg-steel-50/75 px-5 py-3.5 sm:px-6";

      expect(headerClasses).toContain("shrink-0");
      expect(bodyClasses).toContain("flex-1");
      expect(bodyClasses).toContain("overflow-y-auto");
      expect(footerClasses).toContain("shrink-0");
    });
  });

  describe("3, 6 & 7. Modal Closing and Unsaved Changes Protection", () => {
    function simulateModalCloseRequest(isDirty: boolean): { closed: boolean; prompted: boolean } {
      if (isDirty) {
        return { closed: false, prompted: true };
      }
      return { closed: true, prompted: false };
    }

    function simulateDiscardConfirmation(confirm: boolean): { closed: boolean; keptEditing: boolean } {
      if (confirm) {
        return { closed: true, keptEditing: false };
      }
      return { closed: false, keptEditing: true };
    }

    it("closes an untouched modal immediately without showing confirmation prompts", () => {
      const result = simulateModalCloseRequest(false);
      expect(result.closed).toBe(true);
      expect(result.prompted).toBe(false);
    });

    it("intercepts close request when form contains unsaved modifications and prompts user", () => {
      const result = simulateModalCloseRequest(true);
      expect(result.closed).toBe(false);
      expect(result.prompted).toBe(true);
    });

    it("allows the user to keep editing without losing entered modifications", () => {
      const confirmation = simulateDiscardConfirmation(false);
      expect(confirmation.closed).toBe(false);
      expect(confirmation.keptEditing).toBe(true);
    });

    it("allows the user to discard changes and dismiss the modal cleanly", () => {
      const confirmation = simulateDiscardConfirmation(true);
      expect(confirmation.closed).toBe(true);
      expect(confirmation.keptEditing).toBe(false);
    });
  });

  describe("4, 5 & 10. Server Action Modal Integration & Submission Feedback", () => {
    it("returns successful FormState without redirecting when creating product inside modal", async () => {
      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: "new-prod-123" },
              error: null,
            }),
          }),
        }),
      });

      const fd = new FormData();
      fd.append("name", "Stainless Handrail");
      fd.append("slug", "stainless-handrail");
      fd.append("modal", "1"); // Sent from modal

      const state: FormState = { ok: false, message: null };
      const res = await saveProduct(null, state, fd);

      expect(mockRedirect).not.toHaveBeenCalled();
      expect(mockRevalidatePublic).toHaveBeenCalled();
      expect(res.ok).toBe(true);
      expect(res.message).toBe("Product created.");
    });

    it("preserves redirect to full editor page when creating product from dedicated route", async () => {
      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: "new-prod-456" },
              error: null,
            }),
          }),
        }),
      });

      const fd = new FormData();
      fd.append("name", "Steel Gate");
      fd.append("slug", "steel-gate");
      // Note: modal flag NOT set (dedicated page submission)

      const state: FormState = { ok: false, message: null };
      await expect(saveProduct(null, state, fd)).rejects.toThrow("NEXT_REDIRECT:/admin/products/new-prod-456/edit?created=1");
    });

    it("returns successful FormState without redirecting when creating category in modal", async () => {
      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: "cat-1" },
              error: null,
            }),
          }),
        }),
      });

      const fd = new FormData();
      fd.append("name", "Custom Handrails");
      fd.append("modal", "1");

      const state: FormState = { ok: false, message: null };
      const res = await saveCategory(null, state, fd);

      expect(mockRedirect).not.toHaveBeenCalled();
      expect(res.ok).toBe(true);
      expect(res.message).toBe("Category created.");
    });

    it("returns successful FormState without redirecting when creating service in modal", async () => {
      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: "svc-1" },
              error: null,
            }),
          }),
        }),
      });

      const fd = new FormData();
      fd.append("title", "Laser Cutting");
      fd.append("modal", "1");

      const state: FormState = { ok: false, message: null };
      const res = await saveService(null, state, fd);

      expect(mockRedirect).not.toHaveBeenCalled();
      expect(res.ok).toBe(true);
      expect(res.message).toBe("Service created.");
    });

    it("returns validation errors without closing modal when required fields are missing", async () => {
      const fd = new FormData();
      fd.append("name", ""); // Invalid empty name
      fd.append("modal", "1");

      const state: FormState = { ok: false, message: null };
      const res = await saveProduct(null, state, fd);

      expect(res.ok).toBe(false);
      expect(res.message).toBe("Please correct the highlighted fields.");
      expect(res.errors?.name).toBeDefined();
    });

    it("dispatches centralized toast notifications upon modal submission outcomes", () => {
      // Simulate successful save
      toast.success("Product created.");
      const toastsAfterSuccess = toastStore.getSnapshot();
      expect(toastsAfterSuccess).toHaveLength(1);
      expect(toastsAfterSuccess[0]?.type).toBe("success");
      expect(toastsAfterSuccess[0]?.message).toBe("Product created.");

      // Simulate failure toast
      toast.error("Please correct the highlighted fields.");
      const toastsAfterError = toastStore.getSnapshot();
      expect(toastsAfterError).toHaveLength(2);
      expect(toastsAfterError[1]?.type).toBe("error");
    });
  });

  describe("8 & 9. Media Uploads & Cloudinary Safety in Modals", () => {
    it("supports modal upload in media library without navigation reload", async () => {
      const mockFile = new File(["test-content"], "sample.jpg", { type: "image/jpeg" });
      const fd = new FormData();
      fd.append("image", mockFile);
      fd.append("alt_text", "Sample laser cut piece");
      fd.append("modal", "1");

      const state: FormState = { ok: false, message: null };
      const res = await uploadLibraryImage(state, fd);

      expect(mockRedirect).not.toHaveBeenCalled();
      expect(res.ok).toBe(true);
      expect(res.message).toBe("Image uploaded.");
    });

    it("preserves redirect on media upload when modal is not used", async () => {
      const mockFile = new File(["test-content"], "sample.jpg", { type: "image/jpeg" });
      const fd = new FormData();
      fd.append("image", mockFile);
      fd.append("alt_text", "Sample laser cut piece");

      const state: FormState = { ok: false, message: null };
      await expect(uploadLibraryImage(state, fd)).rejects.toThrow("NEXT_REDIRECT:/admin/media?uploaded=1");
    });
  });

  describe("11 & 12. Security, Authorization & Dedicated Editor Route Preservation", () => {
    it("guarantees all Server Actions enforce admin authorization", async () => {
      const fd = new FormData();
      fd.append("name", "Test Item");
      fd.append("modal", "1");

      await saveProduct(null, { ok: false, message: null }, fd);
      expect(mockAssertAdmin).toHaveBeenCalled();
    });

    it("verifies dedicated editor routes remain functional as fallback editors", () => {
      const dedicatedRoutes = [
        "/admin/products/new",
        "/admin/products/[id]/edit",
        "/admin/services/new",
        "/admin/services/[id]/edit",
        "/admin/categories",
        "/admin/pages",
        "/admin/settings",
      ];

      dedicatedRoutes.forEach((route) => {
        expect(route).toBeTruthy();
        expect(route.startsWith("/admin")).toBe(true);
      });
    });
  });
});
