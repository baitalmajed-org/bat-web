"use server";

import { redirect } from "next/navigation";
import { assertAdmin } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import { categorySchema, fieldErrors } from "@/lib/validation/schemas";
import { slugify } from "@/lib/utils/text";
import { bool, dbMessage, done, fail, file, str } from "@/lib/admin-form";
import { revalidatePublic } from "@/lib/data/cache";
import { releaseAsset, saveImage } from "@/lib/cloudinary/media";
import type { FormState } from "@/lib/validation/state";

export async function saveCategory(id: string | null, _prev: FormState, fd: FormData): Promise<FormState> {
  await assertAdmin();
  const name = str(fd, "name");
  const parsed = categorySchema.safeParse({
    name,
    slug: str(fd, "slug").trim() || slugify(name),
    description: str(fd, "description"),
    image_alt: str(fd, "image_alt"),
    sort_order: str(fd, "sort_order") || 0,
    is_active: bool(fd, "is_active"),
  });
  if (!parsed.success) return fail("Please correct the highlighted fields.", fieldErrors(parsed.error));

  const supabase = await createClient();
  let categoryId = id;
  let oldPublicId: string | null = null;

  if (id) {
    const { data: current } = await supabase.from("categories").select("image_public_id").eq("id", id).maybeSingle();
    oldPublicId = current?.image_public_id ?? null;
    const { error } = await supabase.from("categories").update(parsed.data).eq("id", id);
    if (error) return fail(dbMessage(error), error.code === "23505" ? { slug: "Slug already in use" } : undefined);
  } else {
    const { data, error } = await supabase.from("categories").insert(parsed.data).select("id").single();
    if (error) return fail(dbMessage(error), error.code === "23505" ? { slug: "Slug already in use" } : undefined);
    categoryId = data.id;
  }

  const image = file(fd, "image");
  if (image && categoryId) {
    const result = await saveImage({
      supabase, file: image, purpose: "category", alt: parsed.data.image_alt, oldPublicId,
      applyUpdate: async (a) => {
        const { error } = await supabase.from("categories").update({ image_public_id: a.publicId }).eq("id", categoryId!);
        return { error: error ? dbMessage(error) : null };
      },
    });
    if (!result.ok) { revalidatePublic(); return fail(`Category saved, but the image failed: ${result.error}`); }
  }
  revalidatePublic();
  if (!id) {
    if (fd.get("modal") === "1") {
      return done("Category created.");
    }
    redirect("/admin/categories?created=1");
  }
  return done("Category saved.");
}

export async function deleteCategory(formData: FormData): Promise<void> {
  await assertAdmin();
  const id = str(formData, "id");
  const moveTo = str(formData, "moveTo");
  const supabase = await createClient();

  const { count } = await supabase.from("products").select("id", { count: "exact", head: true }).eq("category_id", id);
  if ((count ?? 0) > 0) {
    if (!moveTo || moveTo === id) redirect(`/admin/categories?error=in_use&n=${count}`);
    const { error } = await supabase.from("products").update({ category_id: moveTo }).eq("category_id", id);
    if (error) redirect("/admin/categories?error=move");
  }
  const { data: cat } = await supabase.from("categories").select("image_public_id").eq("id", id).maybeSingle();
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) redirect("/admin/categories?error=delete");
  if (cat?.image_public_id) await releaseAsset(supabase, cat.image_public_id);
  revalidatePublic();
  redirect("/admin/categories?deleted=1");
}
