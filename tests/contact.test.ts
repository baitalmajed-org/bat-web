import { describe, expect, it } from "vitest";
import { normalizePhone, telHref, whatsappHref } from "@/lib/config/site";

describe("phone normalisation", () => {
  it("handles +971 with spaces", () => expect(normalizePhone("+971 54 716 7455")).toBe("971547167455"));
  it("handles 00971 prefix", () => expect(normalizePhone("00971 55 754 5936")).toBe("971557545936"));
  it("handles local 05x format", () => expect(normalizePhone("054 716 7455")).toBe("971547167455"));
  it("builds tel links", () => expect(telHref("+971 54 716 7455")).toBe("tel:+971547167455"));
  it("builds wa.me links", () => expect(whatsappHref("+971 54 716 7455")).toBe("https://wa.me/971547167455"));
  it("encodes WhatsApp messages", () => expect(whatsappHref("+971547167455", "Hi there & you")).toBe("https://wa.me/971547167455?text=Hi%20there%20%26%20you"));
});
