import { describe, expect, it } from "vitest";
import { escapeHtml, parseLines, parseSpecs, slugify, specsToText } from "@/lib/utils/text";
import { adminInquiryEmail, customerConfirmationEmail } from "@/lib/brevo/templates";

describe("slugify", () => {
  it("lowercases and hyphenates", () => expect(slugify("Gas Trolleys")).toBe("gas-trolleys"));
  it("handles ampersand", () => expect(slugify("Structural & Architectural")).toBe("structural-and-architectural"));
  it("trims stray hyphens", () => expect(slugify("  --Hello!!  ")).toBe("hello"));
});

describe("specs and lists", () => {
  it("parses Label: value lines", () => expect(parseSpecs("Capacity: 90 L\nbad line\nWeight: 20 kg: net")).toEqual([{ label: "Capacity", value: "90 L" }, { label: "Weight", value: "20 kg: net" }]));
  it("round-trips", () => expect(parseSpecs(specsToText([{ label: "A", value: "1" }]))).toEqual([{ label: "A", value: "1" }]));
  it("dedupes lines", () => expect(parseLines("a\n\nb\na")).toEqual(["a", "b"]));
});

describe("email templates", () => {
  const data = { reference: "BAM-261014-ABC123", name: "<b>Eve</b>", email: "e@x.com", phone: "+971500000000", company: null, typeLabel: "Product inquiry", relatedLabel: null, subject: "Hi <script>", message: "<img src=x onerror=alert(1)>", createdAt: "2026-10-14T10:00:00Z" };
  it("escapes user content in admin email", () => {
    const { html } = adminInquiryEmail(data, "BAM");
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("<img");
    expect(html).toContain("&lt;img");
  });
  it("customer email includes reference and omits commitment when unset", () => {
    const { html, subject } = customerConfirmationEmail(data, "BAM", null);
    expect(subject).toContain(data.reference);
    expect(html).toContain(data.reference);
  });
  it("includes configured commitment only", () => {
    expect(customerConfirmationEmail(data, "BAM", "We reply within 1 business day.").html).toContain("within 1 business day");
  });
  it("escapeHtml covers quotes", () => expect(escapeHtml(`"'&`)).toBe("&quot;&#39;&amp;"));
});
