import "server-only";
import { createHash } from "node:crypto";
import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";
import { cloudinaryConfig } from "@/lib/env";

export type UploadedAsset = {
  publicId: string;
  secureUrl: string;
  bytes: number;
  width: number;
  height: number;
  format: string;
};

function configure() {
  const cfg = cloudinaryConfig();
  if (!cfg) throw new Error("CLOUDINARY_NOT_CONFIGURED");
  cloudinary.config({ cloud_name: cfg.cloudName, api_key: cfg.apiKey, api_secret: cfg.apiSecret, secure: true });
  return cfg;
}

export function isCloudinaryConfigured(): boolean {
  return cloudinaryConfig() !== null;
}

/**
 * Uploads an image. The public id is derived from the file's SHA-1 so uploading the
 * same picture twice reuses the existing asset instead of storing a duplicate.
 * Large originals are downscaled on upload (max 2400px) to conserve free-tier storage.
 */
export async function uploadImage(buffer: Buffer, purpose: string): Promise<UploadedAsset> {
  const cfg = configure();
  const hash = createHash("sha1").update(buffer).digest("hex").slice(0, 20);
  const publicId = `${cfg.folder}/${purpose}/${hash}`;

  const result = await new Promise<UploadApiResponse>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        public_id: publicId,
        overwrite: false,
        resource_type: "image",
        invalidate: false,
        transformation: [{ width: 2400, height: 2400, crop: "limit", quality: "auto:good" }],
      },
      (error, res) => (error || !res ? reject(error ?? new Error("Empty Cloudinary response")) : resolve(res)),
    );
    stream.end(buffer);
  });

  return {
    publicId: result.public_id,
    secureUrl: result.secure_url,
    bytes: result.bytes,
    width: result.width,
    height: result.height,
    format: result.format,
  };
}

/** Returns true when the asset is gone (deleted now, or already absent). */
export async function destroyAsset(publicId: string): Promise<boolean> {
  configure();
  const res = (await cloudinary.uploader.destroy(publicId, { resource_type: "image", invalidate: true })) as { result: string };
  return res.result === "ok" || res.result === "not found";
}
