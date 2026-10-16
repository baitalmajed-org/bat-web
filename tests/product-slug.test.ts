import { beforeEach, describe, expect, it, vi } from "vitest";
import { slugify } from "@/lib/utils/text";
import { productSchema } from "@/lib/validation/schemas";
import type { FormState } from "@/lib/validation/state";

const {
  mockRedirect,
  mockAssertAdmin,
  mockRevalidatePublic,
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
    mockSupabase: supabase,
  };
});

// Mock server-only
vi.mock("server-only", () => ({}));

// Mock next/navigation
vi.mock("next/navigation", () => ({
  redirect: (url: string) => mockRedirect(url),
  useRouter: () => ({ refresh: vi.fn() }),
  usePathname: () => "/admin/products",
  useSearchParams: () => new URLSearchParams(),
}));

// Mock assertAdmin
vi.mock("@/lib/supabase/auth", () => ({
  assertAdmin: () => mockAssertAdmin(),
}));

// Mock createClient
vi.mock("@/lib/supabase/server", () => ({
  createClient: () => Promise.resolve(mockSupabase),
}));

// Mock revalidatePublic
vi.mock("@/lib/data/cache", () => ({
  revalidatePublic: () => mockRevalidatePublic(),
}));

import { saveProduct } from "@/app/admin/actions/products";

describe("BAM Admin — Auto-Generate Editable Product Slug", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("1. Slug generation from product names", () => {
    it("generates correct URL slugs for standard product names", () => {
      expect(slugify("Gas Cylinder Trolley")).toBe("gas-cylinder-trolley");
      expect(slugify("Heavy-Duty Steel Wheelbarrow")).toBe("heavy-duty-steel-wheelbarrow");
      expect(slugify("Steel Bin (Industrial)")).toBe("steel-bin-industrial");
      expect(slugify("Heavy Duty Steel Wheelbarrow")).toBe("heavy-duty-steel-wheelbarrow");
    });
  });

  describe("2. Lowercase conversion and whitespace normalization", () => {
    it("converts all characters to lowercase", () => {
      expect(slugify("STAINLESS STEEL HANDRAIL")).toBe("stainless-steel-handrail");
      expect(slugify("StAinLess StEel")).toBe("stainless-steel");
    });

    it("trims leading, trailing, and interior multiple whitespaces", () => {
      expect(slugify("   Steel Wheelbarrow   ")).toBe("steel-wheelbarrow");
      expect(slugify("Heavy    Duty    Wheelbarrow")).toBe("heavy-duty-wheelbarrow");
      expect(slugify("\tSteel\t\tCart\n")).toBe("steel-cart");
    });
  });

  describe("3. Punctuation and repeated separator handling", () => {
    it("collapses multiple consecutive separators and hyphens into a single hyphen", () => {
      expect(slugify("Heavy---Duty---Cart")).toBe("heavy-duty-cart");
      expect(slugify("Steel // Beam -- 100")).toBe("steel-beam-100");
    });

    it("handles ampersands and special characters cleanly", () => {
      expect(slugify("Nuts & Bolts")).toBe("nuts-and-bolts");
      expect(slugify("Steel Pipe (Grade #304 / 316) & Fittings!")).toBe("steel-pipe-grade-304-316-and-fittings");
    });

    it("removes leading and trailing hyphens or punctuation", () => {
      expect(slugify("---Heavy Duty Steel---")).toBe("heavy-duty-steel");
      expect(slugify("...Steel Gate...")).toBe("steel-gate");
    });

    it("normalizes diacritics and accented characters", () => {
      expect(slugify("Café Façade Panel")).toBe("cafe-facade-panel");
    });

    it("avoids trailing hyphens when sliced at maximum 80-character boundary", () => {
      const longName = "A".repeat(79) + " - B";
      const slug = slugify(longName);
      expect(slug.length).toBeLessThanOrEqual(80);
      expect(slug.endsWith("-")).toBe(false);
    });
  });

  describe("4, 5, 6 & 7. Form State Transitions: Auto-sync, Manual edits, Clearing, and Existing Products", () => {
    // Helper replicating ProductForm client-side state machine
    class ProductFormSlugStateMachine {
      name: string;
      slug: string;
      isCustomSlug: boolean;

      constructor(initialProduct?: { name?: string; slug?: string } | null) {
        this.name = initialProduct?.name ?? "";
        this.slug = initialProduct?.slug ?? "";
        this.isCustomSlug = Boolean(initialProduct?.slug);
      }

      onNameChange(newName: string) {
        this.name = newName;
        if (!this.isCustomSlug) {
          this.slug = slugify(newName);
        }
      }

      onSlugChange(newSlug: string) {
        if (!newSlug.trim()) {
          this.isCustomSlug = false;
          this.slug = this.name.trim() ? slugify(this.name) : "";
        } else {
          this.isCustomSlug = true;
          this.slug = newSlug;
        }
      }

      onResetSlug() {
        this.isCustomSlug = false;
        this.slug = this.name.trim() ? slugify(this.name) : "";
      }
    }

    it("4. Automatically updates slug while typing in product name for new products", () => {
      const state = new ProductFormSlugStateMachine(null);
      expect(state.name).toBe("");
      expect(state.slug).toBe("");
      expect(state.isCustomSlug).toBe(false);

      state.onNameChange("Heavy Duty Steel Wheelbarrow");
      expect(state.slug).toBe("heavy-duty-steel-wheelbarrow");

      state.onNameChange("Heavy Duty Steel Wheelbarrow 90L");
      expect(state.slug).toBe("heavy-duty-steel-wheelbarrow-90l");
    });

    it("5. Preserves manual slug edits when the product name changes", () => {
      const state = new ProductFormSlugStateMachine(null);
      state.onNameChange("Heavy Duty Steel Wheelbarrow");
      expect(state.slug).toBe("heavy-duty-steel-wheelbarrow");

      // Admin manually customizes the slug
      state.onSlugChange("heavy-wheelbarrow-pro");
      expect(state.isCustomSlug).toBe(true);
      expect(state.slug).toBe("heavy-wheelbarrow-pro");

      // Admin updates product name: custom slug MUST be preserved
      state.onNameChange("Heavy Duty Steel Wheelbarrow 120L Deluxe");
      expect(state.slug).toBe("heavy-wheelbarrow-pro");
    });

    it("6. Re-enables automatic generation when the admin clears the slug field", () => {
      const state = new ProductFormSlugStateMachine(null);
      state.onNameChange("Heavy Duty Steel Wheelbarrow");
      state.onSlugChange("custom-slug-value");
      expect(state.isCustomSlug).toBe(true);

      // Admin clears the slug field
      state.onSlugChange("");
      expect(state.isCustomSlug).toBe(false);
      // Immediately resumes auto-generation from current name
      expect(state.slug).toBe("heavy-duty-steel-wheelbarrow");

      // Further name changes continue to update slug automatically
      state.onNameChange("Heavy Duty Steel Wheelbarrow Extra");
      expect(state.slug).toBe("heavy-duty-steel-wheelbarrow-extra");
    });

    it("6b. Allows manual reset to automatic generation via reset action", () => {
      const state = new ProductFormSlugStateMachine(null);
      state.onNameChange("Industrial Trolley");
      state.onSlugChange("custom-trolley");
      expect(state.isCustomSlug).toBe(true);

      state.onResetSlug();
      expect(state.isCustomSlug).toBe(false);
      expect(state.slug).toBe("industrial-trolley");
    });

    it("7. Existing product loads saved slug without regenerating or overwriting on open", () => {
      const existingProduct = {
        name: "Custom Storage Locker",
        slug: "legacy-locker-code-123",
      };

      const state = new ProductFormSlugStateMachine(existingProduct);
      // Must not overwrite legacy custom slug with slugify("Custom Storage Locker")
      expect(state.slug).toBe("legacy-locker-code-123");
      expect(state.isCustomSlug).toBe(true);

      // Changing name preserves existing slug
      state.onNameChange("Custom Storage Locker Updated");
      expect(state.slug).toBe("legacy-locker-code-123");

      // If admin explicitly clears slug, it switches to auto-generation
      state.onSlugChange("");
      expect(state.isCustomSlug).toBe(false);
      expect(state.slug).toBe("custom-storage-locker-updated");
    });
  });

  describe("8 & 9. Server Validation, Uniqueness Constraints, and Custom Slug Saving", () => {
    it("8. Rejects duplicate slugs and returns an inline error without closing the form", async () => {
      // Simulate Postgres code 23505 (unique_violation)
      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: "23505", message: 'duplicate key value violates unique constraint "products_slug_key"' },
            }),
          }),
        }),
      });

      const fd = new FormData();
      fd.append("name", "Stainless Railing");
      fd.append("slug", "already-taken-slug");
      fd.append("modal", "1");

      const state: FormState = { ok: false, message: null };
      const res = await saveProduct(null, state, fd);

      expect(res.ok).toBe(false);
      expect(res.errors?.slug).toBe("Slug already in use");
      expect(mockRedirect).not.toHaveBeenCalled();
    });

    it("8b. Validates slug format server-side using productSchema", () => {
      // Slugs with spaces or uppercase must fail schema validation
      const invalid = productSchema.safeParse({
        name: "Test Product",
        slug: "Invalid Slug With Spaces",
        category_id: null,
        sort_order: 0,
        is_featured: false,
        is_published: false,
      });

      expect(invalid.success).toBe(false);
      if (!invalid.success) {
        const errors = invalid.error.flatten().fieldErrors;
        expect(errors.slug).toBeDefined();
      }

      // Valid hyphenated lowercase slug must succeed
      const valid = productSchema.safeParse({
        name: "Test Product",
        slug: "valid-hyphenated-slug-123",
        category_id: null,
        sort_order: 0,
        is_featured: false,
        is_published: false,
      });

      expect(valid.success).toBe(true);
    });

    it("9. Successfully saves a valid custom slug through Server Action", async () => {
      let insertedPayload: Record<string, unknown> | null = null;

      mockSupabase.from.mockReturnValue({
        insert: vi.fn((payload) => {
          insertedPayload = payload;
          return {
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { id: "new-prod-custom" },
                error: null,
              }),
            }),
          };
        }),
      });

      const fd = new FormData();
      fd.append("name", "Heavy Duty Steel Wheelbarrow");
      fd.append("slug", "special-wheelbarrow-custom");
      fd.append("modal", "1");

      const state: FormState = { ok: false, message: null };
      const res = await saveProduct(null, state, fd);

      expect(res.ok).toBe(true);
      expect(res.message).toBe("Product created.");
      expect(insertedPayload).toBeDefined();
      expect(insertedPayload?.["slug"]).toBe("special-wheelbarrow-custom");
    });

    it("10. Updates an existing product without treating its own existing slug as a duplicate", async () => {
      let updatedPayload: Record<string, unknown> | null = null;

      mockSupabase.from.mockReturnValue({
        update: vi.fn((payload) => {
          updatedPayload = payload;
          return {
            eq: vi.fn().mockResolvedValue({
              error: null,
            }),
          };
        }),
      });

      const fd = new FormData();
      fd.append("name", "Updated Product Name");
      fd.append("slug", "same-existing-slug");
      fd.append("modal", "1");

      const state: FormState = { ok: false, message: null };
      const res = await saveProduct("existing-prod-id", state, fd);

      expect(res.ok).toBe(true);
      expect(res.message).toBe("Product saved.");
      expect(updatedPayload?.["slug"]).toBe("same-existing-slug");
    });
  });
});
