"use server";

import { assertAdmin } from "@/lib/supabase/auth";
import { createUploadSignature, type DirectUploadParams } from "@/lib/cloudinary/signature";
import type { ImagePurpose } from "@/lib/cloudinary/limits";

export type UploadAuthResult =
  | { ok: true; params: DirectUploadParams }
  | { ok: false; error: string };

/**
 * Server action to request authorized direct upload parameters for Cloudinary.
 * Strictly requires active administrator session via assertAdmin().
 */
export async function getDirectUploadSignature(
  purpose: ImagePurpose,
  fileHash: string
): Promise<UploadAuthResult> {
  try {
    await assertAdmin();
    const params = createUploadSignature(purpose, fileHash);
    return { ok: true, params };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to authorize upload";
    if (message === "UNAUTHORIZED") {
      return { ok: false, error: "You must be signed in as an administrator to upload images." };
    }
    if (message === "CLOUDINARY_NOT_CONFIGURED") {
      return { ok: false, error: "Cloudinary is not configured. Please add CLOUDINARY_* environment variables." };
    }
    return { ok: false, error: message };
  }
}
