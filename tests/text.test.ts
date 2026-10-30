import { describe, expect, it } from "vitest";
import { escapeHtml, parseLines, parseSpecs, slugify, specsToText } from "@/lib/utils/text";

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

describe("escapeHtml", () => {
  it("escapeHtml covers quotes", () => expect(escapeHtml(`"'&`)).toBe("&quot;&#39;&amp;"));
});
