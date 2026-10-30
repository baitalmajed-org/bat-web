import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const dir = path.resolve(__dirname, "../supabase/migrations");
const files = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();
const sql = files.map((f) => readFileSync(path.join(dir, f), "utf8")).join("\n");

describe("supabase migrations", () => {
  it("are ordered with numeric prefixes", () =>
    expect(files).toEqual([
      "0001_schema.sql",
      "0002_functions.sql",
      "0003_rls.sql",
      "0004_announcement_and_social.sql",
      "0005_top_contact_bar_visibility.sql",
      "0006_hero_mobile_image.sql",
      "0007_inquiries_and_blogs.sql",
    ]));

  const tables = [...sql.matchAll(/create table public\.(\w+)/g)].map((m) => m[1]!);
  it("define the required tables", () => {
    for (const t of ["site_settings", "homepage_sections", "categories", "products", "product_images", "services", "media_assets", "inquiries", "inquiry_notes", "blogs"]) expect(tables).toContain(t);
  });
  it("enable RLS on every table", () => {
    for (const t of tables) expect(sql, `RLS missing for ${t}`).toMatch(new RegExp(`alter table public\\.${t} enable row level security`));
  });
  it("gives anonymous users no access to private tables", () => {
    const anonGrant = sql.match(/grant select on ([^;]+) to anon;/)?.[1] ?? "";
    for (const t of ["inquiries", "inquiry_notes", "media_assets", "admin_users"]) expect(anonGrant).not.toContain(t);
    expect(sql).not.toMatch(/on public\.inquiries for (select|all|insert)[^;]*to anon/);
  });
  it("restricts admin functions to authenticated users", () => {
    expect(sql).toMatch(/grant execute on function public\.count_asset_references\(text\) to authenticated;/);
    expect(sql).toMatch(/grant execute on function public\.asset_reference_counts\(\) to authenticated;/);
  });
  it("seed uses only tables that exist", () => {
    const seed = readFileSync(path.resolve(__dirname, "../supabase/seed.sql"), "utf8");
    for (const m of seed.matchAll(/insert into public\.(\w+)/g)) expect(tables).toContain(m[1]!);
  });
});
