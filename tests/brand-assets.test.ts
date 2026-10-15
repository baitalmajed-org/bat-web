import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import sharp from "sharp";

const root = path.resolve(__dirname, "..");

describe("Favicon, touch-icon, and logo assets (FIX 1 & FIX 2)", () => {
  it("src/app/icon.png exists, is 512x512 PNG, and has alpha transparency", async () => {
    const iconPath = path.join(root, "src/app/icon.png");
    expect(existsSync(iconPath)).toBe(true);

    const meta = await sharp(iconPath).metadata();
    expect(meta.format).toBe("png");
    expect(meta.width).toBe(512);
    expect(meta.height).toBe(512);
    expect(meta.hasAlpha).toBe(true);
  });

  it("src/app/apple-icon.png exists, is 180x180 PNG conforming to Apple Touch HIG", async () => {
    const appleIconPath = path.join(root, "src/app/apple-icon.png");
    expect(existsSync(appleIconPath)).toBe(true);

    const meta = await sharp(appleIconPath).metadata();
    expect(meta.format).toBe("png");
    expect(meta.width).toBe(180);
    expect(meta.height).toBe(180);
  });

  it("public/brand/logo-dark.png exists, is a valid PNG with transparent background", async () => {
    const logoDarkPath = path.join(root, "public/brand/logo-dark.png");
    expect(existsSync(logoDarkPath)).toBe(true);

    const meta = await sharp(logoDarkPath).metadata();
    expect(meta.format).toBe("png");
    expect(meta.hasAlpha).toBe(true);
    expect(meta.width).toBeGreaterThan(0);
    expect(meta.height).toBeGreaterThan(0);

    // Verify it contains transparent pixels
    const { data } = await sharp(logoDarkPath).raw().toBuffer({ resolveWithObject: true });
    let hasTransparentPixels = false;
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] === 0) {
        hasTransparentPixels = true;
        break;
      }
    }
    expect(hasTransparentPixels).toBe(true);
  });

  it("Footer.tsx uses transparent dark logo asset and removes artificial white background wrapper", () => {
    const footerSrc = readFileSync(path.join(root, "src/components/layout/Footer.tsx"), "utf8");
    expect(footerSrc).toContain("/brand/logo-dark.png");
    expect(footerSrc).not.toMatch(/h-16\s+w-32\s+bg-white/);
  });
});
