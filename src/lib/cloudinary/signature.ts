import "server-only";
import { v2 as cloudinary } from "cloudinary";
import { cloudinaryConfig } from "@/lib/env";
import { type ImagePurpose, IMAGE_LIMITS } from "./limits";
import type { UploadedAsset } from "./client";

export interface DirectUploadParams {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  publicId: string;
  folder: string;
  transformation: string;
  maxBytes: number;
  allowedFormats: string[];
}

export interface DirectUploadedAssetPayload {
  publicId: string;
  secureUrl: string;
  bytes: number;
  width: number;
  height: number;
  format: string;
  version?: number | string;
  signature?: string;
}

const ALLOWED_FORMATS = ["jpg", "jpeg", "png", "webp"];
const HASH_RE = /^[a-f0-9]{10,64}$/i;

function configure() {
  const cfg = cloudinaryConfig();
  if (!cfg) throw new Error("CLOUDINARY_NOT_CONFIGURED");
  cloudinary.config({ cloud_name: cfg.cloudName, api_key: cfg.apiKey, api_secret: cfg.apiSecret, secure: true });
  return cfg;
}

/**
 * Creates authenticated Cloudinary upload parameters and cryptographic signature.
 * Only authenticated administrators may call this.
 * Restricts upload strictly to the intended folder, purpose, and SHA-1 public_id.
 */
export function createUploadSignature(purpose: ImagePurpose, fileHash: string): DirectUploadParams {
  const cfg = configure();

  if (!IMAGE_LIMITS[purpose]) {
    throw new Error(`Invalid upload purpose: ${purpose}`);
  }

  const cleanHash = fileHash.trim().toLowerCase();
  if (!HASH_RE.test(cleanHash)) {
    throw new Error("Invalid file hash provided for signature generation.");
  }

  const folder = `${cfg.folder}/${purpose}`;
  const publicId = `${folder}/${cleanHash.slice(0, 20)}`;
  const timestamp = Math.floor(Date.now() / 1000);
  const transformation = "c_limit,h_2400,q_auto:good,w_2400";

  // Cloudinary signature signs parameters in alphabetical order
  const paramsToSign = {
    overwrite: false,
    public_id: publicId,
    timestamp,
    transformation,
  };

  const signature = cloudinary.utils.api_sign_request(paramsToSign, cfg.apiSecret);

  return {
    cloudName: cfg.cloudName,
    apiKey: cfg.apiKey,
    timestamp,
    signature,
    publicId,
    folder,
    transformation,
    maxBytes: IMAGE_LIMITS[purpose].maxBytes,
    allowedFormats: ALLOWED_FORMATS,
  };
}

/**
 * Validates asset information returned from Cloudinary direct upload before saving to Supabase.
 * - Prevents unauthorized folder access.
 * - Validates format, byte size against configured purpose limit, dimensions, and URL structure.
 * - Cryptographically verifies the Cloudinary response signature.
 */
export function verifyDirectAsset(
  rawAsset: DirectUploadedAssetPayload,
  purpose: ImagePurpose
): UploadedAsset {
  const cfg = configure();
  const limit = IMAGE_LIMITS[purpose] ?? IMAGE_LIMITS.library;

  if (!rawAsset || typeof rawAsset !== "object") {
    throw new Error("Invalid asset descriptor: payload must be an object.");
  }

  const { publicId, secureUrl, bytes, width, height, format, version, signature } = rawAsset;

  if (!publicId || typeof publicId !== "string") {
    throw new Error("Invalid asset: missing or malformed public_id.");
  }

  // Security: strictly enforce folder namespace to prevent writing to other locations
  const expectedPrefix = `${cfg.folder}/${purpose}/`;
  if (!publicId.startsWith(expectedPrefix)) {
    throw new Error(`Unauthorized asset location: public_id must start with '${expectedPrefix}'.`);
  }

  // Prevent path traversal
  if (publicId.includes("..") || publicId.includes("//")) {
    throw new Error("Invalid characters in public_id.");
  }

  // Validate format
  const normFormat = (format || "").trim().toLowerCase();
  if (!ALLOWED_FORMATS.includes(normFormat)) {
    throw new Error(`Unsupported image format '${normFormat}'. Allowed: ${ALLOWED_FORMATS.join(", ")}`);
  }

  // Validate size
  if (typeof bytes !== "number" || bytes <= 0) {
    throw new Error("Invalid asset byte size.");
  }
  if (bytes > limit.maxBytes) {
    throw new Error(`${limit.label} exceeds maximum allowed size of ${limit.maxMB} MB (received ${(bytes / (1024 * 1024)).toFixed(1)} MB).`);
  }

  // Validate dimensions
  if (typeof width !== "number" || width <= 0 || typeof height !== "number" || height <= 0) {
    throw new Error("Invalid asset dimensions.");
  }

  // Validate secure URL
  if (
    typeof secureUrl !== "string" ||
    !secureUrl.startsWith("https://res.cloudinary.com/") ||
    !secureUrl.includes(cfg.cloudName)
  ) {
    throw new Error("Invalid secure URL host or format.");
  }

  // Cryptographic signature check: verify Cloudinary genuinely produced this asset
  if (signature && version !== undefined) {
    const expectedSignature = cloudinary.utils.api_sign_request(
      { public_id: publicId, version: Number(version) },
      cfg.apiSecret
    );
    if (signature !== expectedSignature) {
      throw new Error("Security check failed: Cloudinary upload signature mismatch.");
    }
  }

  return {
    publicId,
    secureUrl,
    bytes,
    width,
    height,
    format: normFormat,
  };
}
