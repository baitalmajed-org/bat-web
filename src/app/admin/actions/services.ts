"use server";

import { redirect } from "next/navigation";
import { assertAdmin } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import { serviceSchema, fieldErrors } from "@/lib/validation/schemas";
import { parseLines, parseSpecs, slugify } from "@/lib/utils/text";
import { bool, dbMessage, done, fail, str } from "@/lib/admin-form";
import { revalidatePublic } from "@/lib/data/cache";
import { releaseAsset, saveImage } from "@/lib/cloudinary/media";
import { extractImageInput } from "@/lib/cloudinary/action-helper";
import type { FormState } from "@/lib/validation/state";

export async function saveService(id: string | null, _prev: FormState, fd: FormData): Promise<FormState> {
  await assertAdmin();
  const title = str(fd, "title");
  const parsed = serviceSchema.safeParse({
    title,
    slug: str(fd, "slug").trim() || slugify(title),
    short_description: str(fd, "short_description"),
    description: str(fd, "description"),
    icon: str(fd, "icon") || null,
    image_alt: str(fd, "image_alt"),
    sort_order: str(fd, "sort_order") || 0,
    show_on_home: bool(fd, "show_on_home"),
    is_published: bool(fd, "is_published"),
    seo_title: str(fd, "seo_title"),
    seo_description: str(fd, "seo_description"),
  });
  if (!parsed.success) return fail("Please correct the highlighted fields.", fieldErrors(parsed.error));

  const supabase = await createClient();
  const payload = { ...parsed.data, specifications: parseSpecs(str(fd, "specifications")), applications: parseLines(str(fd, "applications")) };
  let serviceId = id;
  let oldPublicId: string | null = null;

  if (id) {
    const { data: cur } = await supabase.from("services").select("image_public_id").eq("id", id).maybeSingle();
    oldPublicId = cur?.image_public_id ?? null;
    const { error } = await supabase.from("services").update(payload).eq("id", id);
    if (error) return fail(dbMessage(error), error.code === "23505" ? { slug: "Slug already in use" } : undefined);
  } else {
    const { data, error } = await supabase.from("services").insert(payload).select("id").single();
    if (error) return fail(dbMessage(error), error.code === "23505" ? { slug: "Slug already in use" } : undefined);
    serviceId = data.id;
  }

  const { directAsset, file: image } = extractImageInput(fd, "image");
  if ((directAsset || image) && serviceId) {
    const result = await saveImage({
      supabase, file: image, directAsset, purpose: "service", alt: payload.image_alt, oldPublicId,
      applyUpdate: async (a) => {
        const { error } = await supabase.from("services").update({ image_public_id: a.publicId }).eq("id", serviceId!);
        return { error: error ? dbMessage(error) : null };
      },
    });
    if (!result.ok) {
      revalidatePublic();
      if (!id) redirect(`/admin/services/${serviceId}/edit?imageError=1`);
      return fail(`Service saved, but the image failed: ${result.error}`);
    }
  }
  revalidatePublic();
  if (!id) {
    if (fd.get("modal") === "1") {
      return done("Service created.");
    }
    redirect(`/admin/services/${serviceId}/edit?created=1`);
  }
  return done("Service saved.");
}

export async function removeServiceImage(formData: FormData): Promise<void> {
  await assertAdmin();
  const id = str(formData, "id");
  const supabase = await createClient();
  const { data } = await supabase.from("services").select("image_public_id").eq("id", id).maybeSingle();
  const { error } = await supabase.from("services").update({ image_public_id: null }).eq("id", id);
  if (!error && data?.image_public_id) await releaseAsset(supabase, data.image_public_id);
  revalidatePublic();
  if (error) redirect(`/admin/services/${id}/edit?error=image_remove`);
  redirect(`/admin/services/${id}/edit?imageRemoved=1`);
}

export async function setServicePublished(formData: FormData): Promise<void> {
  await assertAdmin();
  const publish = str(formData, "publish") === "true";
  const supabase = await createClient();
  const { error } = await supabase.from("services").update({ is_published: publish }).eq("id", str(formData, "id"));
  if (error) console.error("[admin] service publish toggle failed", error.message);
  revalidatePublic();
  const back = str(formData, "back") || "/admin/services";
  const sep = back.includes("?") ? "&" : "?";
  if (error) redirect(`${back}${sep}error=publish`);
  redirect(`${back}${sep}published=${publish ? "1" : "0"}`);
}

export async function deleteService(formData: FormData): Promise<void> {
  await assertAdmin();
  const id = str(formData, "id");
  const supabase = await createClient();
  const { data } = await supabase.from("services").select("image_public_id").eq("id", id).maybeSingle();
  const { error } = await supabase.from("services").delete().eq("id", id);
  if (error) redirect("/admin/services?error=delete");
  if (data?.image_public_id) await releaseAsset(supabase, data.image_public_id);
  revalidatePublic();
  redirect("/admin/services?deleted=1");
}
