import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = path.join(dir, n);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}
const root = path.resolve(__dirname, "../src");
const files = walk(root).filter((f) => /\.(ts|tsx)$/.test(f));
const read = (f: string) => readFileSync(f, "utf8");

describe("security conventions", () => {
  it("never reads secrets in client components", () => {
    for (const f of files) {
      const src = read(f);
      if (!/^["']use client["']/.test(src)) continue;
      expect(src, f).not.toMatch(/CLOUDINARY_API_SECRET|SERVICE_ROLE/);
    }
  });
  it("keeps secret-using modules server-only", () => {
    for (const f of ["lib/cloudinary/client.ts", "lib/supabase/server.ts"]) expect(read(path.join(root, f))).toContain('import "server-only"');
  });
  it("every admin server action checks authorization", () => {
    const actionsDir = path.join(root, "app/admin/actions");
    for (const f of readdirSync(actionsDir).filter((n) => n !== "auth.ts")) {
      const src = read(path.join(actionsDir, f));
      const fnCount = (src.match(/export async function/g) ?? []).length;
      const guardCount = (src.match(/await assertAdmin\(\)/g) ?? []).length;
      expect(guardCount, f).toBeGreaterThanOrEqual(fnCount);
    }
  });
  it("every admin page calls requireAdmin or is the login page", () => {
    for (const f of files.filter((n) => /app\/admin\/.*page\.tsx$/.test(n) && !n.includes("login"))) expect(read(f), f).toContain("requireAdmin()");
  });
  it("public navigation never links to the admin area", () => {
    for (const f of files.filter((n) => /components\/(layout|home|products|inquiry|ui)\//.test(n))) expect(read(f), f).not.toMatch(/["'`]\/admin/);
    expect(read(path.join(root, "lib/config/site.ts"))).not.toContain("/admin");
  });
  it("robots and sitemap exclude admin", () => {
    expect(read(path.join(root, "app/robots.ts"))).toContain("/admin");
    expect(read(path.join(root, "app/sitemap.ts"))).not.toContain("/admin");
  });
  it("admin layout is noindex", () => expect(read(path.join(root, "lib/seo/metadata.ts"))).toMatch(/index: false/));
});
