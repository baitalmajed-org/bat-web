import { beforeEach, describe, expect, it } from "vitest";
import { rateLimit, resetRateLimits } from "@/lib/rate-limit";

describe("rateLimit", () => {
  beforeEach(() => resetRateLimits());
  it("allows up to the limit then blocks", () => {
    for (let i = 0; i < 3; i++) expect(rateLimit("k", 3, 1000, 100)).toBe(true);
    expect(rateLimit("k", 3, 1000, 200)).toBe(false);
  });
  it("recovers after the window", () => {
    for (let i = 0; i < 3; i++) rateLimit("k", 3, 1000, 100);
    expect(rateLimit("k", 3, 1000, 1500)).toBe(true);
  });
  it("tracks keys independently", () => {
    rateLimit("a", 1, 1000, 0);
    expect(rateLimit("b", 1, 1000, 0)).toBe(true);
  });
});
