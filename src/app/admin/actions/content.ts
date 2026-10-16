"use server";

import { redirect } from "next/navigation";
import { assertAdmin } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import { aboutSchema, fieldErrors, homepageSectionSchema, settingsSchema } from "@/lib/validation/schemas";
import { parseLines } from "@/lib/utils/text";
import { bool, dbMessage, done, fail, file, str } from "@/lib/admin-form";
import { revalidatePublic } from "@/lib/data/cache";
import { releaseAsset, saveImage } from "@/lib/cloudinary/media";
import type { FormState } from "@/lib/validation/state";
import type { HomepageItem } from "@/types/db";

const SECTION_KEYS = ["hero", "featured_products", "services", "about", "trust", "contact_cta"] as const;
type SectionKey = (typeof SECTION_KEYS)[number];

function parseItems(text: string): HomepageItem[] {
  return parseLines(text, 12).map((line) => {
    const [title, ...rest] = line.split("|");
    const t = (title ?? "").trim().slice(0, 80);
    const body = rest.join("|").trim().slice(0, 120);
    return body ? { title: t, text: body } : { title: t };
  }).filter((i) => i.title);
}

export async function saveHomeSection(key: SectionKey, _prev: FormState, fd: FormData): Promise<FormState> {
  await assertAdmin();
  if (!SECTION_KEYS.includes(key)) return fail("Unknown section.");
  const parsed = homepageSectionSchema.safeParse({
    eyebrow: str(fd, "eyebrow"), heading: str(fd, "heading"), body: str(fd, "body"), image_alt: str(fd, "image_alt"),
    primary_cta_label: str(fd, "primary_cta_label"), primary_cta_href: str(fd, "primary_cta_href"),
    secondary_cta_label: str(fd, "secondary_cta_label"), secondary_cta_href: str(fd, "secondary_cta_href"),
    is_visible: bool(fd, "is_visible"), sort_order: str(fd, "sort_order") || 0,
  });
  if (!parsed.success) return fail("Please correct the highlighted fields.", fieldErrors(parsed.error));

  const supabase = await createClient();
  const payload: Record<string, unknown> = { ...parsed.data };
  if (fd.has("items")) payload.items = parseItems(str(fd, "items"));

  const { data: current } = await supabase.from("homepage_sections").select("image_public_id").eq("key", key).maybeSingle();
  const { error } = await supabase.from("homepage_sections").update(payload).eq("key", key);
  if (error) return fail(dbMessage(error));

  const image = file(fd, "image");
  if (image) {
    const result = await saveImage({
      supabase, file: image, purpose: "homepage", alt: parsed.data.image_alt, oldPublicId: current?.image_public_id ?? null,
      applyUpdate: async (a) => {
        const { error: e } = await supabase.from("homepage_sections").update({ image_public_id: a.publicId }).eq("key", key);
        return { error: e ? dbMessage(e) : null };
      },
    });
    if (!result.ok) { revalidatePublic(); return fail(`Text saved, but the image failed: ${result.error}`); }
    revalidatePublic();
    return done("Section saved." + (result.cleanupWarning ? ` ${result.cleanupWarning}` : ""));
  }
  revalidatePublic();
  return done("Section saved.");
}

export async function removeHomeImage(formData: FormData): Promise<void> {
  await assertAdmin();
  const key = str(formData, "key");
  const supabase = await createClient();
  const { data } = await supabase.from("homepage_sections").select("image_public_id").eq("key", key).maybeSingle();
  const { error } = await supabase.from("homepage_sections").update({ image_public_id: null }).eq("key", key);
  if (!error && data?.image_public_id) await releaseAsset(supabase, data.image_public_id);
  revalidatePublic();
  if (error) redirect("/admin/homepage?error=image_remove");
  redirect("/admin/homepage?imageRemoved=1");
}

export async function saveFeaturedProducts(formData: FormData): Promise<void> {
  await assertAdmin();
  const chosen = new Set(formData.getAll("featured").map(String));
  const supabase = await createClient();
  const { data } = await supabase.from("products").select("id,is_featured");
  const toOn = (data ?? []).filter((p) => chosen.has(p.id) && !p.is_featured).map((p) => p.id);
  const toOff = (data ?? []).filter((p) => !chosen.has(p.id) && p.is_featured).map((p) => p.id);
  if (toOn.length) await supabase.from("products").update({ is_featured: true }).in("id", toOn);
  if (toOff.length) await supabase.from("products").update({ is_featured: false }).in("id", toOff);
  revalidatePublic();
  redirect("/admin/homepage?featured=1");
}

export async function saveHomeServices(formData: FormData): Promise<void> {
  await assertAdmin();
  const chosen = new Set(formData.getAll("services").map(String));
  const supabase = await createClient();
  const { data } = await supabase.from("services").select("id,show_on_home");
  const toOn = (data ?? []).filter((s) => chosen.has(s.id) && !s.show_on_home).map((s) => s.id);
  const toOff = (data ?? []).filter((s) => !chosen.has(s.id) && s.show_on_home).map((s) => s.id);
  if (toOn.length) await supabase.from("services").update({ show_on_home: true }).in("id", toOn);
  if (toOff.length) await supabase.from("services").update({ show_on_home: false }).in("id", toOff);
  revalidatePublic();
  redirect("/admin/homepage?services=1");
}

export async function saveAbout(_prev: FormState, fd: FormData): Promise<FormState> {
  await assertAdmin();
  const parsed = aboutSchema.safeParse({
    title: str(fd, "title"), meta_description: str(fd, "meta_description"), overview: str(fd, "overview"),
    mission: str(fd, "mission"), vision: str(fd, "vision"), quality: str(fd, "quality"),
    founded: str(fd, "founded"), team_size: str(fd, "team_size"),
  });
  if (!parsed.success) return fail("Please correct the highlighted fields.", fieldErrors(parsed.error));
  const { title, meta_description, ...rest } = parsed.data;
  const supabase = await createClient();
  const { data: current } = await supabase.from("pages").select("hero_image_public_id").eq("slug", "about").maybeSingle();
  const { error } = await supabase.from("pages").upsert({
    slug: "about", title, meta_description,
    content: {
      ...rest,
      capabilities: parseLines(str(fd, "capabilities")),
      industries: parseLines(str(fd, "industries")),
      strengths: parseLines(str(fd, "strengths")),
      certifications: parseLines(str(fd, "certifications")),
    },
  }, { onConflict: "slug" });
  if (error) return fail(dbMessage(error));

  const image = file(fd, "image");
  if (image) {
    const result = await saveImage({
      supabase, file: image, purpose: "page", alt: null, oldPublicId: current?.hero_image_public_id ?? null,
      applyUpdate: async (a) => {
        const { error: e } = await supabase.from("pages").update({ hero_image_public_id: a.publicId }).eq("slug", "about");
        return { error: e ? dbMessage(e) : null };
      },
    });
    if (!result.ok) { revalidatePublic(); return fail(`Text saved, but the image failed: ${result.error}`); }
  }
  revalidatePublic();
  return done("About page saved.");
}

export async function saveSettings(_prev: FormState, fd: FormData): Promise<FormState> {
  await assertAdmin();
  const keys = ["company_name", "tagline", "main_phone", "whatsapp_number", "secondary_phone", "email", "address_text", "business_hours",
    "google_maps_url", "google_maps_embed_url", "facebook_url", "instagram_url", "linkedin_url", "youtube_url",
    "seo_default_title", "seo_default_description", "footer_description", "response_time_commitment"];
  const parsed = settingsSchema.safeParse(Object.fromEntries(keys.map((k) => [k, str(fd, k)])));
  if (!parsed.success) return fail("Please correct the highlighted fields.", fieldErrors(parsed.error));

  const supabase = await createClient();
  const { data: current } = await supabase.from("site_settings").select("logo_public_id").eq("id", 1).maybeSingle();
  const { error } = await supabase.from("site_settings").upsert({ id: 1, ...parsed.data }, { onConflict: "id" });
  if (error) return fail(dbMessage(error));

  const logo = file(fd, "logo");
  if (logo) {
    const result = await saveImage({
      supabase, file: logo, purpose: "logo", alt: parsed.data.company_name, oldPublicId: current?.logo_public_id ?? null,
      applyUpdate: async (a) => {
        const { error: e } = await supabase.from("site_settings").update({ logo_public_id: a.publicId }).eq("id", 1);
        return { error: e ? dbMessage(e) : null };
      },
    });
    if (!result.ok) { revalidatePublic(); return fail(`Settings saved, but the logo failed: ${result.error}`); }
  }
  revalidatePublic();
  return done("Settings saved.");
}

/** Revert to the bundled official logo. The previous custom logo is released if unused. */
export async function resetLogo(): Promise<void> {
  await assertAdmin();
  const supabase = await createClient();
  const { data } = await supabase.from("site_settings").select("logo_public_id").eq("id", 1).maybeSingle();
  const { error } = await supabase.from("site_settings").update({ logo_public_id: null }).eq("id", 1);
  if (!error && data?.logo_public_id) await releaseAsset(supabase, data.logo_public_id);
  revalidatePublic();
  if (error) redirect("/admin/settings?error=logo_reset");
  redirect("/admin/settings?logoReset=1");
}

export async function uploadLibraryImage(_prev: FormState, fd: FormData): Promise<FormState> {
  await assertAdmin();
  const f = file(fd, "image");
  if (!f) return fail("Choose an image to upload.");
  const supabase = await createClient();
  const result = await saveImage({ supabase, file: f, purpose: "library", alt: str(fd, "alt_text").trim() || null, applyUpdate: async () => ({ error: null }) });
  if (!result.ok) return fail(result.error);
  if (fd.get("modal") === "1") {
    return done("Image uploaded.");
  }
  redirect("/admin/media?uploaded=1");
}

export async function deleteMedia(formData: FormData): Promise<void> {
  await assertAdmin();
  const publicId = str(formData, "publicId");
  const supabase = await createClient();
  const { data: refs, error } = await supabase.rpc("count_asset_references", { p_public_id: publicId });
  if (error) redirect("/admin/media?error=check");
  if ((refs as number) > 0) redirect("/admin/media?error=in_use");
  const warning = await releaseAsset(supabase, publicId);
  redirect(warning ? "/admin/media?error=cloudinary" : "/admin/media?deleted=1");
}
