import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { destroyAsset, uploadImage, type UploadedAsset } from "./client";
import { validateImageFile } from "@/lib/validation/schemas";

export type ReplaceResult =
  | { ok: true; asset: UploadedAsset; cleanupWarning?: string }
  | { ok: false; error: string };

async function track(supabase: SupabaseClient, asset: UploadedAsset, purpose: string, alt: string | null) {
  const { error } = await supabase.from("media_assets").upsert(
    {
      public_id: asset.publicId,
      secure_url: asset.secureUrl,
      resource_type: "image",
      format: asset.format,
      bytes: asset.bytes,
      width: asset.width,
      height: asset.height,
      alt_text: alt,
      purpose,
      cleanup_status: "active",
      cleanup_error: null,
    },
    { onConflict: "public_id" },
  );
  return error;
}

/**
 * Deletes a Cloudinary asset ONLY if no content record references it any more.
 * On Cloudinary failure the tracking row is marked 'delete_failed' so it can be retried.
 */
export async function releaseAsset(supabase: SupabaseClient, publicId: string): Promise<string | undefined> {
  const { data: count, error } = await supabase.rpc("count_asset_references", { p_public_id: publicId });
  if (error) return `Could not verify references for ${publicId}; asset kept.`;
  if ((count as number) > 0) return undefined; // still in use elsewhere: keep it

  await supabase.from("media_assets").update({ cleanup_status: "pending_delete" }).eq("public_id", publicId);
  try {
    const gone = await destroyAsset(publicId);
    if (!gone) throw new Error("Cloudinary did not confirm deletion");
    await supabase.from("media_assets").update({ cleanup_status: "deleted", cleanup_error: null }).eq("public_id", publicId);
    return undefined;
  } catch (e) {
    const message = e instanceof Error ? e.message : "unknown error";
    console.error("[cloudinary] delete failed", publicId, message);
    await supabase
      .from("media_assets")
      .update({ cleanup_status: "delete_failed", cleanup_error: message.slice(0, 300) })
      .eq("public_id", publicId);
    return `Old image could not be removed from Cloudinary (will be retryable from Media). `;
  }
}

/**
 * Safe replace workflow:
 * validate -> upload new -> track -> apply DB update -> (on failure: undo new upload)
 * -> release old asset only if nothing references it.
 * The old image is never deleted before the new reference is saved.
 */
export async function saveImage(opts: {
  supabase: SupabaseClient;
  file: File;
  purpose: string;
  alt: string | null;
  oldPublicId?: string | null;
  applyUpdate: (asset: UploadedAsset) => Promise<{ error: string | null }>;
}): Promise<ReplaceResult> {
  const { supabase, file, purpose, alt, oldPublicId, applyUpdate } = opts;
  const invalid = validateImageFile(file);
  if (invalid) return { ok: false, error: invalid };

  let asset: UploadedAsset;
  try {
    asset = await uploadImage(Buffer.from(await file.arrayBuffer()), purpose);
  } catch (e) {
    if (e instanceof Error && e.message === "CLOUDINARY_NOT_CONFIGURED") {
      return { ok: false, error: "Cloudinary is not configured. Add the CLOUDINARY_* variables to enable uploads." };
    }
    console.error("[cloudinary] upload failed", e instanceof Error ? e.message : e);
    return { ok: false, error: "Image upload failed. Nothing was changed. Please try again." };
  }

  const alreadyExisted = oldPublicId === asset.publicId;
  const trackError = await track(supabase, asset, purpose, alt);
  if (trackError) {
    console.error("[media] tracking failed", trackError.message);
    if (!alreadyExisted) await compensate(supabase, asset.publicId);
    return { ok: false, error: "Could not record the uploaded image. Nothing was changed." };
  }

  const { error } = await applyUpdate(asset);
  if (error) {
    // New upload is unreferenced: remove it (unless it is a re-used identical asset).
    await releaseAsset(supabase, asset.publicId);
    return { ok: false, error };
  }

  if (oldPublicId && !alreadyExisted) {
    const warning = await releaseAsset(supabase, oldPublicId);
    return { ok: true, asset, cleanupWarning: warning };
  }
  return { ok: true, asset };
}

async function compensate(supabase: SupabaseClient, publicId: string) {
  try {
    await destroyAsset(publicId);
  } catch (e) {
    console.error("[cloudinary] compensating delete failed", publicId, e instanceof Error ? e.message : e);
  }
  await supabase.from("media_assets").delete().eq("public_id", publicId);
}
