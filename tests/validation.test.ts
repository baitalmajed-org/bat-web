import { describe, expect, it } from "vitest";
import { inquirySchema, productSchema, settingsSchema, validateImageFile, MAX_IMAGE_BYTES } from "@/lib/validation/schemas";

const valid = {
  name: "Ali Khan", email: "ali@example.com", phone: "+971 50 123 4567", company: "", type: "product",
  productId: "", serviceId: "", subject: "Wheelbarrow quote", message: "Need 20 wheelbarrows please.", privacy: "on", website: "",
};

describe("inquirySchema", () => {
  it("accepts a valid inquiry", () => expect(inquirySchema.safeParse(valid).success).toBe(true));
  it("rejects bad email", () => expect(inquirySchema.safeParse({ ...valid, email: "nope" }).success).toBe(false));
  it("rejects short message", () => expect(inquirySchema.safeParse({ ...valid, message: "hi" }).success).toBe(false));
  it("rejects bad phone", () => expect(inquirySchema.safeParse({ ...valid, phone: "abc" }).success).toBe(false));
  it("requires privacy acknowledgment", () => expect(inquirySchema.safeParse({ ...valid, privacy: "" }).success).toBe(false));
  it("rejects unknown type", () => expect(inquirySchema.safeParse({ ...valid, type: "hack" }).success).toBe(false));
  it("keeps honeypot value so the action can detect bots", () => {
    const r = inquirySchema.safeParse({ ...valid, website: "spam" });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.website).toBe("spam");
    }
  });
  it("treats a malformed hidden product id as no product instead of failing", () => {
    const r = inquirySchema.safeParse({ ...valid, productId: "not-a-uuid" });
    expect(r.success && r.data.productId).toBeNull();
  });
  it("keeps a valid product uuid", () => {
    const id = "123e4567-e89b-42d3-a456-426614174000";
    const r = inquirySchema.safeParse({ ...valid, productId: id });
    expect(r.success && r.data.productId).toBe(id);
  });
  it("rejects oversized message", () => expect(inquirySchema.safeParse({ ...valid, message: "x".repeat(4001) }).success).toBe(false));
});

describe("productSchema", () => {
  const base = { name: "Pallet Trolley", slug: "pallet-trolley", category_id: null, short_description: "", description: "", sort_order: "3", is_featured: false, is_published: true, seo_title: "", seo_description: "" };
  it("accepts valid product and coerces order", () => {
    const r = productSchema.safeParse(base);
    expect(r.success && r.data.sort_order).toBe(3);
  });
  it("rejects invalid slug", () => expect(productSchema.safeParse({ ...base, slug: "Bad Slug!" }).success).toBe(false));
});

describe("settingsSchema", () => {
  const base = { company_name: "BAM", tagline: "", main_phone: "+971 54 716 7455", whatsapp_number: "+971 54 716 7455", secondary_phone: "", email: "info@bammetaluae.com", address_text: "", business_hours: "", google_maps_url: "", google_maps_embed_url: "", facebook_url: "", instagram_url: "", linkedin_url: "", youtube_url: "", seo_default_title: "", seo_default_description: "", footer_description: "", response_time_commitment: "" };
  it("accepts valid settings and nulls empty fields", () => {
    const r = settingsSchema.safeParse(base);
    expect(r.success).toBe(true);
    if (r.success) { expect(r.data.facebook_url).toBeNull(); expect(r.data.secondary_phone).toBeNull(); }
  });
  it("rejects non-https social URLs", () => expect(settingsSchema.safeParse({ ...base, facebook_url: "javascript:alert(1)" }).success).toBe(false));
  it("rejects maps embed from other hosts", () => expect(settingsSchema.safeParse({ ...base, google_maps_embed_url: "https://evil.example/embed" }).success).toBe(false));
});

describe("validateImageFile", () => {
  it("accepts jpeg", () => expect(validateImageFile({ size: 1000, type: "image/jpeg" })).toBeNull());
  it("rejects svg", () => expect(validateImageFile({ size: 1000, type: "image/svg+xml" })).not.toBeNull());
  it("rejects too large", () => expect(validateImageFile({ size: MAX_IMAGE_BYTES + 1, type: "image/png" })).not.toBeNull());
  it("rejects empty", () => expect(validateImageFile({ size: 0, type: "image/png" })).not.toBeNull());
});
