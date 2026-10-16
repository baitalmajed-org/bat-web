import { validateImageFile } from "@/lib/validation/schemas";
import { type ImagePurpose } from "@/lib/cloudinary/limits";
import { getDirectUploadSignature } from "@/app/admin/actions/cloudinary";
import type { DirectUploadedAssetPayload } from "@/lib/cloudinary/signature";

export async function computeFileSha1(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  if (typeof crypto !== "undefined" && crypto.subtle) {
    const digest = await crypto.subtle.digest("SHA-1", buffer);
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
      .slice(0, 20);
  }
  // Fallback for environments lacking crypto.subtle
  return Array.from(new Uint8Array(buffer.slice(0, 1000)))
    .reduce((acc, byte) => (acc * 31 + byte) >>> 0, 0)
    .toString(16)
    .padStart(20, "0")
    .slice(0, 20);
}

export interface DirectUploadOptions {
  file: File;
  purpose: ImagePurpose;
  onProgress?: (percent: number) => void;
}

/**
 * Uploads an image directly from the browser to Cloudinary using signed parameters.
 *
 * This completely bypasses the Vercel 4.5 MB request body limit, allowing images
 * up to the configured limit (up to 8 MB) without exceeding Vercel or Cloudinary limits.
 */
export async function uploadDirectToCloudinary({
  file,
  purpose,
  onProgress,
}: DirectUploadOptions): Promise<DirectUploadedAssetPayload> {
  // 1. Client-side validation: reject oversized or unsupported files immediately
  const validationError = validateImageFile(file, purpose);
  if (validationError) {
    throw new Error(validationError);
  }

  // 2. Compute SHA-1 for duplicate-upload protection
  const fileHash = await computeFileSha1(file);

  // 3. Request authenticated upload signature from server
  const auth = await getDirectUploadSignature(purpose, fileHash);
  if (!auth.ok) {
    throw new Error(auth.error);
  }

  const { params } = auth;

  // 4. Build FormData for Cloudinary direct upload endpoint
  const fd = new FormData();
  fd.append("file", file);
  fd.append("api_key", params.apiKey);
  fd.append("timestamp", String(params.timestamp));
  fd.append("signature", params.signature);
  fd.append("public_id", params.publicId);
  fd.append("transformation", params.transformation);
  fd.append("overwrite", "false");

  const uploadUrl = `https://api.cloudinary.com/v1_1/${params.cloudName}/image/upload`;

  // 5. Upload via XHR to monitor progress
  return new Promise<DirectUploadedAssetPayload>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", uploadUrl);

    if (xhr.upload && onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && event.total > 0) {
          const percent = Math.min(100, Math.round((event.loaded / event.total) * 100));
          onProgress(percent);
        }
      };
    }

    xhr.onload = () => {
      try {
        const res = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300) {
          if (!res.public_id || !res.secure_url) {
            return reject(new Error("Cloudinary response missing public_id or secure_url."));
          }
          resolve({
            publicId: res.public_id,
            secureUrl: res.secure_url,
            bytes: res.bytes,
            width: res.width,
            height: res.height,
            format: res.format,
            version: res.version,
            signature: res.signature,
          });
        } else {
          const errMsg = res.error?.message || `Upload failed with status ${xhr.status}`;
          reject(new Error(errMsg));
        }
      } catch {
        reject(new Error(`Failed to parse Cloudinary response (status ${xhr.status})`));
      }
    };

    xhr.onerror = () => {
      reject(new Error("Network error during Cloudinary image upload. Please check your connection."));
    };

    xhr.send(fd);
  });
}
