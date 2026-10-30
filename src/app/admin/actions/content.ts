"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { assertAdmin } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import { aboutSchema, fieldErrors, homepageSectionSchema, settingsSchema } from "@/lib/validation/schemas";
import { parseLines } from "@/lib/utils/text";
import { bool, dbMessage, done, fail, str } from "@/lib/admin-form";
import { revalidatePublic } from "@/lib/data/cache";
import { releaseAsset, saveImage } from "@/lib/cloudinary/media";
import { extractImageInput } from "@/lib/cloudinary/action-helper";
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
    eyebrow: str(fd, "eyebrow"),
    heading: str(fd, "heading"),
    body: str(fd, "body"),
    image_alt: str(fd, "image_alt"),
    mobile_image_alt: str(fd, "mobile_image_alt"),
    primary_cta_label: str(fd, "primary_cta_label"),
    primary_cta_href: str(fd, "primary_cta_href"),
    secondary_cta_label: str(fd, "secondary_cta_label"),
    secondary_cta_href: str(fd, "secondary_cta_href"),
    is_visible: bool(fd, "is_visible"),
    sort_order: str(fd, "sort_order") || 0,
  });
  if (!parsed.success) return fail("Please correct the highlighted fields.", fieldErrors(parsed.error));

  const supabase = await createClient();
  const { mobile_image_alt, ...baseData } = parsed.data;
  const payload: Record<string, unknown> = {
    ...baseData,
    ...(key === "hero" ? { mobile_image_alt } : {}),
  };
  if (fd.has("items")) payload.items = parseItems(str(fd, "items"));

  const { data: current } = await supabase
    .from("homepage_sections")
    .select("*")
    .eq("key", key)
    .maybeSingle();

  let { error } = await supabase.from("homepage_sections").update(payload).eq("key", key);
  if (error && error.message?.includes("mobile_image_alt")) {
    const fallbackPayload = { ...payload };
    delete fallbackPayload.mobile_image_alt;
    const retry = await supabase.from("homepage_sections").update(fallbackPayload).eq("key", key);
    if (!retry.error) {
      error = null;
    }
  }
  if (error) return fail(dbMessage(error));

  const purpose = key === "hero" ? "homepage_hero" : "homepage";
  const warnings: string[] = [];

  // 1. Desktop / standard background image
  const { directAsset, file: image } = extractImageInput(fd, "image");
  if (directAsset || image) {
    const result = await saveImage({
      supabase,
      file: image,
      directAsset,
      purpose,
      alt: parsed.data.image_alt,
      oldPublicId: (current as { image_public_id?: string | null } | null)?.image_public_id ?? null,
      applyUpdate: async (a) => {
        const { error: e } = await supabase
          .from("homepage_sections")
          .update({ image_public_id: a.publicId })
          .eq("key", key);
        return { error: e ? dbMessage(e) : null };
      },
    });
    if (!result.ok) {
      revalidatePublic();
      return fail(`Text saved, but the desktop image failed: ${result.error}`);
    }
    if (result.cleanupWarning) warnings.push(result.cleanupWarning);
  }

  // 2. Separate mobile background image (hero section)
  if (key === "hero") {
    const { directAsset: mobileDirectAsset, file: mobileImage } = extractImageInput(fd, "mobile_image");
    if (mobileDirectAsset || mobileImage) {
      const mobileResult = await saveImage({
        supabase,
        file: mobileImage,
        directAsset: mobileDirectAsset,
        purpose,
        alt: mobile_image_alt ?? parsed.data.image_alt,
        oldPublicId: (current as { mobile_image_public_id?: string | null } | null)?.mobile_image_public_id ?? null,
        applyUpdate: async (a) => {
          const { error: e } = await supabase
            .from("homepage_sections")
            .update({ mobile_image_public_id: a.publicId })
            .eq("key", key);
          return { error: e ? dbMessage(e) : null };
        },
      });
      if (!mobileResult.ok) {
        revalidatePublic();
        return fail(`Text saved, but the mobile image failed: ${mobileResult.error}`);
      }
      if (mobileResult.cleanupWarning) warnings.push(mobileResult.cleanupWarning);
    }
  }

  revalidatePublic();
  return done("Section saved." + (warnings.length ? ` ${warnings.join(" ")}` : ""));
}

export async function removeHomeImage(formData: FormData): Promise<void> {
  await assertAdmin();
  const key = str(formData, "key");
  const target = str(formData, "target") === "mobile" ? "mobile" : "desktop";
  const column = target === "mobile" ? "mobile_image_public_id" : "image_public_id";
  const supabase = await createClient();
  const { data } = await supabase.from("homepage_sections").select("*").eq("key", key).maybeSingle();
  const oldPublicId = (data as Record<string, string | null> | null)?.[column] ?? null;
  const updatePayload: Record<string, unknown> = { [column]: null };
  if (target === "mobile") updatePayload.mobile_image_alt = null;
  const { error } = await supabase.from("homepage_sections").update(updatePayload).eq("key", key);
  if (!error && oldPublicId) await releaseAsset(supabase, oldPublicId);
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

  const { directAsset, file: image } = extractImageInput(fd, "image");
  if (directAsset || image) {
    const result = await saveImage({
      supabase, file: image, directAsset, purpose: "about", alt: null, oldPublicId: current?.hero_image_public_id ?? null,
      applyUpdate: async (a) => {
        const { error: e } = await supabase.from("pages").update({ hero_image_public_id: a.publicId }).eq("slug", "about");
        return { error: e ? dbMessage(e) : null };
      },
    });
    if (!result.ok) {
      revalidatePublic();
      revalidatePath("/about");
      return fail(`Text saved, but the image failed: ${result.error}`);
    }
  }
  revalidatePublic();
  revalidatePath("/about");
  revalidatePath("/admin/pages");
  return done("About page saved.");
}

export async function saveSettings(_prev: FormState, fd: FormData): Promise<FormState> {
  await assertAdmin();
  const keys = [
    "company_name", "tagline", "main_phone", "whatsapp_number", "secondary_phone", "email", "address_text", "business_hours",
    "google_maps_url", "google_maps_embed_url", "facebook_url", "instagram_url", "linkedin_url", "youtube_url", "x_url",
    "seo_default_title", "seo_default_description", "footer_description", "response_time_commitment"
  ];
  const rawData: Record<string, unknown> = Object.fromEntries(keys.map((k) => [k, str(fd, k)]));
  if (fd.has("announcement_enabled")) {
    rawData.announcement_enabled = bool(fd, "announcement_enabled");
    rawData.announcement_text = str(fd, "announcement_text");
    rawData.announcement_link_url = str(fd, "announcement_link_url");
    rawData.announcement_link_label = str(fd, "announcement_link_label");
    rawData.announcement_link_new_tab = bool(fd, "announcement_link_new_tab");
  }

  const hasTopBar = fd.has("top_bar_enabled") || fd.has("top_contact_bar_enabled");
  if (hasTopBar) {
    const rawVal = fd.has("top_bar_enabled") ? fd.get("top_bar_enabled") : fd.get("top_contact_bar_enabled");
    const isTrue =
      rawVal !== "false" &&
      rawVal !== "0" &&
      rawVal !== "off" &&
      bool(fd, fd.has("top_bar_enabled") ? "top_bar_enabled" : "top_contact_bar_enabled");
    rawData.top_bar_enabled = isTrue;
    rawData.top_contact_bar_enabled = isTrue;
  } else if (fd.has("top_bar_toggle_present") || fd.has("has_top_bar_toggle")) {
    rawData.top_bar_enabled = false;
    rawData.top_contact_bar_enabled = false;
  }

  const parsed = settingsSchema.safeParse(rawData);
  if (!parsed.success) return fail("Please correct the highlighted fields.", fieldErrors(parsed.error));

  const supabase = await createClient();
  const { data: current } = await supabase.from("site_settings").select("logo_public_id").eq("id", 1).maybeSingle();
  let { error } = await supabase.from("site_settings").upsert({ id: 1, ...parsed.data }, { onConflict: "id" });
  if (error && (error.message?.includes("top_bar_enabled") || error.message?.includes("top_contact_bar_enabled"))) {
    const fallbackData = { ...(parsed.data as Record<string, unknown>) };
    delete fallbackData.top_bar_enabled;
    delete fallbackData.top_contact_bar_enabled;
    const retry = await supabase.from("site_settings").upsert({ id: 1, ...fallbackData }, { onConflict: "id" });
    if (!retry.error) {
      error = null;
    }
  }
  if (error) return fail(dbMessage(error));

  const { directAsset, file: logo } = extractImageInput(fd, "logo");
  if (directAsset || logo) {
    const result = await saveImage({
      supabase, file: logo, directAsset, purpose: "logo", alt: parsed.data.company_name, oldPublicId: current?.logo_public_id ?? null,
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
  if (error) redirect("/admin/homepage?error=logo_reset");
  redirect("/admin/settings?logoReset=1");
}

export async function uploadLibraryImage(_prev: FormState, fd: FormData): Promise<FormState> {
  await assertAdmin();
  const { directAsset, file: f } = extractImageInput(fd, "image");
  if (!directAsset && !f) return fail("Choose an image to upload.");
  const supabase = await createClient();
  const result = await saveImage({
    supabase,
    file: f,
    directAsset,
    purpose: "library",
    alt: str(fd, "alt_text").trim() || null,
    applyUpdate: async () => ({ error: null }),
  });
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
