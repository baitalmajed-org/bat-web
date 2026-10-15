"use server";

import { redirect } from "next/navigation";
import { assertAdmin } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import { productSchema, fieldErrors } from "@/lib/validation/schemas";
import { parseLines, parseSpecs, slugify } from "@/lib/utils/text";
import { bool, dbMessage, done, fail, file, str } from "@/lib/admin-form";
import { revalidatePublic } from "@/lib/data/cache";
import { releaseAsset, saveImage } from "@/lib/cloudinary/media";
import type { FormState } from "@/lib/validation/state";

function parseProduct(fd: FormData) {
  const name = str(fd, "name");
  const parsed = productSchema.safeParse({
    name,
    slug: str(fd, "slug").trim() || slugify(name),
    category_id: str(fd, "category_id") || null,
    short_description: str(fd, "short_description"),
    description: str(fd, "description"),
    sort_order: str(fd, "sort_order") || 0,
    is_featured: bool(fd, "is_featured"),
    is_published: bool(fd, "is_published"),
    seo_title: str(fd, "seo_title"),
    seo_description: str(fd, "seo_description"),
  });
  return parsed;
}

export async function saveProduct(id: string | null, _prev: FormState, fd: FormData): Promise<FormState> {
  await assertAdmin();
  const parsed = parseProduct(fd);
  if (!parsed.success) return fail("Please correct the highlighted fields.", fieldErrors(parsed.error));

  const supabase = await createClient();
  const payload = {
    ...parsed.data,
    specifications: parseSpecs(str(fd, "specifications")),
    applications: parseLines(str(fd, "applications")),
  };

  if (!id) {
    const { data, error } = await supabase.from("products").insert(payload).select("id").single();
    if (error) return fail(dbMessage(error), error.code === "23505" ? { slug: "Slug already in use" } : undefined);
    revalidatePublic();
    redirect(`/admin/products/${data.id}/edit?created=1`);
  }

  const { error } = await supabase.from("products").update(payload).eq("id", id);
  if (error) return fail(dbMessage(error), error.code === "23505" ? { slug: "Slug already in use" } : undefined);
  revalidatePublic();
  return done("Product saved.");
}

export async function setProductPublished(formData: FormData): Promise<void> {
  await assertAdmin();
  const id = str(formData, "id");
  const publish = str(formData, "publish") === "true";
  const supabase = await createClient();
  const { error } = await supabase.from("products").update({ is_published: publish }).eq("id", id);
  if (error) console.error("[admin] publish toggle failed", error.message);
  revalidatePublic();
  redirect(str(formData, "back") || "/admin/products");
}

export async function deleteProduct(formData: FormData): Promise<void> {
  await assertAdmin();
  const id = str(formData, "id");
  if (!id) {
    redirect("/admin/products?error=delete");
  }

  const supabase = await createClient();
  const { data: images, error: imagesError } = await supabase
    .from("product_images")
    .select("public_id")
    .eq("product_id", id);

  if (imagesError) {
    console.error("[admin] product images fetch failed", imagesError.message);
    redirect("/admin/products?error=delete");
  }

  const { error: deleteError } = await supabase.from("products").delete().eq("id", id);
  if (deleteError) {
    console.error("[admin] product delete failed", deleteError.message);
    redirect("/admin/products?error=delete");
  }

  for (const img of images ?? []) {
    try {
      await releaseAsset(supabase, img.public_id);
    } catch (err) {
      console.error("[admin] image cleanup failed for", img.public_id, err);
    }
  }

  revalidatePublic();
  redirect("/admin/products?deleted=1");
}

export async function addProductImage(productId: string, _prev: FormState, fd: FormData): Promise<FormState> {
  await assertAdmin();
  const f = file(fd, "image");
  if (!f) return fail("Choose an image to upload.");
  const alt = str(fd, "alt_text").trim() || null;
  const supabase = await createClient();
  const { data: last } = await supabase.from("product_images").select("sort_order").eq("product_id", productId).order("sort_order", { ascending: false }).limit(1);
  const next = (last?.[0]?.sort_order ?? -1) + 1;

  const result = await saveImage({
    supabase, file: f, purpose: "product", alt,
    applyUpdate: async (a) => {
      const { error } = await supabase.from("product_images").insert({ product_id: productId, public_id: a.publicId, secure_url: a.secureUrl, alt_text: alt, sort_order: next });
      return { error: error ? dbMessage(error) : null };
    },
  });
  if (!result.ok) return fail(result.error);
  revalidatePublic();
  return done("Image added." + (result.cleanupWarning ? ` ${result.cleanupWarning}` : ""));
}

export async function replaceProductImage(imageId: string, _prev: FormState, fd: FormData): Promise<FormState> {
  await assertAdmin();
  const f = file(fd, "image");
  if (!f) return fail("Choose a replacement image.");
  const supabase = await createClient();
  const { data: current } = await supabase.from("product_images").select("public_id,alt_text").eq("id", imageId).maybeSingle();
  if (!current) return fail("Image not found.");

  const result = await saveImage({
    supabase, file: f, purpose: "product", alt: current.alt_text, oldPublicId: current.public_id,
    applyUpdate: async (a) => {
      const { error } = await supabase.from("product_images").update({ public_id: a.publicId, secure_url: a.secureUrl }).eq("id", imageId);
      return { error: error ? dbMessage(error) : null };
    },
  });
  if (!result.ok) return fail(result.error);
  revalidatePublic();
  return done("Image replaced." + (result.cleanupWarning ? ` ${result.cleanupWarning}` : ""));
}

export async function deleteProductImage(formData: FormData): Promise<void> {
  await assertAdmin();
  const imageId = str(formData, "imageId");
  const productId = str(formData, "productId");
  const supabase = await createClient();
  const { data: img } = await supabase.from("product_images").select("public_id").eq("id", imageId).maybeSingle();
  const { error } = await supabase.from("product_images").delete().eq("id", imageId);
  if (!error && img) await releaseAsset(supabase, img.public_id);
  revalidatePublic();
  redirect(`/admin/products/${productId}/edit`);
}

export async function makePrimaryImage(formData: FormData): Promise<void> {
  await assertAdmin();
  const imageId = str(formData, "imageId");
  const productId = str(formData, "productId");
  const supabase = await createClient();
  const { data } = await supabase.from("product_images").select("id").eq("product_id", productId).order("sort_order");
  const order = [imageId, ...(data ?? []).map((r) => r.id).filter((i) => i !== imageId)];
  await Promise.all(order.map((id, i) => supabase.from("product_images").update({ sort_order: i }).eq("id", id)));
  revalidatePublic();
  redirect(`/admin/products/${productId}/edit`);
}

export async function updateImageAlt(formData: FormData): Promise<void> {
  await assertAdmin();
  const supabase = await createClient();
  await supabase.from("product_images").update({ alt_text: str(formData, "alt_text").trim().slice(0, 200) || null }).eq("id", str(formData, "imageId"));
  revalidatePublic();
  redirect(`/admin/products/${str(formData, "productId")}/edit`);
}
