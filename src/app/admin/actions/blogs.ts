"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { assertAdmin } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import { blogSchema, fieldErrors } from "@/lib/validation/schemas";
import { slugify } from "@/lib/utils/text";
import { bool, dbMessage, fail, str } from "@/lib/admin-form";
import { revalidatePublic } from "@/lib/data/cache";
import { releaseAsset, saveImage } from "@/lib/cloudinary/media";
import { extractImageInput } from "@/lib/cloudinary/action-helper";
import type { FormState } from "@/lib/validation/state";

function cleanSnippet(text: string, maxLen = 155): string {
  const stripped = text.replace(/<[^>]*>?/gm, "").replace(/\s+/g, " ").trim();
  if (stripped.length <= maxLen) return stripped;
  return stripped.slice(0, maxLen).replace(/\s+\S*$/, "") + "...";
}

export async function saveBlog(id: string | null, _prev: FormState, fd: FormData): Promise<FormState> {
  await assertAdmin();
  const title = str(fd, "title");
  const rawContent = str(fd, "content");
  const rawExcerpt = str(fd, "excerpt");
  const rawSeoTitle = str(fd, "seo_title");
  const rawSeoDesc = str(fd, "seo_description");

  // Auto-generate meta title and description if left empty
  const seoTitle = rawSeoTitle || `${title} | Bait Al Majed Metal Works`;
  const seoDescription = rawSeoDesc || rawExcerpt || cleanSnippet(rawContent, 155);

  const parsed = blogSchema.safeParse({
    title,
    slug: str(fd, "slug").trim() || slugify(title),
    excerpt: rawExcerpt,
    content: rawContent,
    image_alt: str(fd, "image_alt"),
    is_published: bool(fd, "is_published"),
    seo_title: seoTitle,
    seo_description: seoDescription,
  });

  if (!parsed.success) {
    return fail("Please correct the highlighted fields.", fieldErrors(parsed.error));
  }

  const supabase = await createClient();
  const payload = parsed.data;
  let blogId = id;
  let oldPublicId: string | null = null;

  if (id) {
    const { data: cur } = await supabase.from("blogs").select("image_public_id").eq("id", id).maybeSingle();
    oldPublicId = cur?.image_public_id ?? null;
    const { error } = await supabase.from("blogs").update(payload).eq("id", id);
    if (error) return fail(dbMessage(error), error.code === "23505" ? { slug: "Slug already in use" } : undefined);
  } else {
    const { data, error } = await supabase.from("blogs").insert(payload).select("id").single();
    if (error) return fail(dbMessage(error), error.code === "23505" ? { slug: "Slug already in use" } : undefined);
    blogId = data.id;
  }

  const shouldRemoveImage = bool(fd, "remove_image");
  if (shouldRemoveImage && blogId && oldPublicId) {
    const { error: remErr } = await supabase.from("blogs").update({ image_public_id: null }).eq("id", blogId);
    if (!remErr) {
      await releaseAsset(supabase, oldPublicId);
      oldPublicId = null;
    }
  }

  const { directAsset, file: image } = extractImageInput(fd, "image");
  if (!shouldRemoveImage && (directAsset || image) && blogId) {
    const result = await saveImage({
      supabase,
      file: image,
      directAsset,
      purpose: "blog",
      alt: payload.image_alt,
      oldPublicId,
      applyUpdate: async (a) => {
        const { error } = await supabase.from("blogs").update({ image_public_id: a.publicId }).eq("id", blogId!);
        return { error: error ? dbMessage(error) : null };
      },
    });
    if (!result.ok) {
      revalidatePublic();
      if (!id) redirect(`/admin/blogs/${blogId}/edit?imageError=1`);
      return fail(`Blog saved, but image upload failed: ${result.error}`);
    }
  }

  revalidatePublic();
  revalidatePath("/admin/blogs");
  revalidatePath("/blog");
  if (payload.slug) revalidatePath(`/blog/${payload.slug}`);

  redirect(`/admin/blogs?${id ? "saved=1" : "created=1"}`);
}

export async function removeBlogImage(formData: FormData): Promise<void> {
  await assertAdmin();
  const id = str(formData, "id");
  const supabase = await createClient();
  const { data } = await supabase.from("blogs").select("image_public_id").eq("id", id).maybeSingle();
  const { error } = await supabase.from("blogs").update({ image_public_id: null }).eq("id", id);
  if (!error && data?.image_public_id) {
    await releaseAsset(supabase, data.image_public_id);
  }
  revalidatePublic();
  revalidatePath("/admin/blogs");
  revalidatePath(`/admin/blogs/${id}/edit`);
  revalidatePath("/blog");
  const back = str(formData, "back") || `/admin/blogs/${id}/edit`;
  const sep = back.includes("?") ? "&" : "?";
  if (error) redirect(`${back}${sep}error=image_remove`);
  redirect(`${back}${sep}imageRemoved=1`);
}

export async function setBlogPublished(formData: FormData): Promise<void> {
  await assertAdmin();
  const publish = str(formData, "publish") === "true";
  const id = str(formData, "id");
  const supabase = await createClient();
  const { error } = await supabase.from("blogs").update({ is_published: publish }).eq("id", id);
  if (error) console.error("[admin] blog publish toggle failed", error.message);
  revalidatePublic();
  revalidatePath("/admin/blogs");
  revalidatePath("/blog");
  const back = str(formData, "back") || "/admin/blogs";
  const sep = back.includes("?") ? "&" : "?";
  if (error) redirect(`${back}${sep}error=publish`);
  redirect(`${back}${sep}published=${publish ? "1" : "0"}`);
}

export async function deleteBlog(formData: FormData): Promise<void> {
  await assertAdmin();
  const id = str(formData, "id");
  const supabase = await createClient();
  const { data } = await supabase.from("blogs").select("image_public_id").eq("id", id).maybeSingle();
  const { error } = await supabase.from("blogs").delete().eq("id", id);
  if (error) redirect("/admin/blogs?error=delete");
  if (data?.image_public_id) {
    await releaseAsset(supabase, data.image_public_id);
  }
  revalidatePublic();
  revalidatePath("/admin/blogs");
  revalidatePath("/blog");
  redirect("/admin/blogs?deleted=1");
}

