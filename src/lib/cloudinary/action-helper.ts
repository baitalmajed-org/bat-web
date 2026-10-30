import "server-only";
import type { DirectUploadedAssetPayload } from "@/lib/cloudinary/signature";
import { str, file } from "@/lib/admin-form";

/**
 * Extracts either direct-uploaded Cloudinary asset metadata or a binary File
 * from the submitted form data.
 */
export function extractImageInput(
  fd: FormData,
  name = "image"
): {
  directAsset: DirectUploadedAssetPayload | null;
  file: File | null;
} {
  const directStr = str(fd, `${name}_direct_asset`) || (name === "image" ? str(fd, "direct_asset") : "");
  let directAsset: DirectUploadedAssetPayload | null = null;
  if (directStr) {
    try {
      const parsed = JSON.parse(directStr);
      if (parsed && typeof parsed === "object" && parsed.publicId) {
        directAsset = parsed as DirectUploadedAssetPayload;
      }
    } catch {
      directAsset = null;
    }
  }

  const f = file(fd, name);
  return { directAsset, file: f };
}
