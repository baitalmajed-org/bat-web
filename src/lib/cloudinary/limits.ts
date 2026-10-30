export type ImagePurpose =
  | "product"
  | "service"
  | "blog"
  | "about"
  | "homepage_hero"
  | "homepage"
  | "logo"
  | "category"
  | "library";

export interface ImageLimitSpec {
  maxBytes: number;
  maxMB: number;
  label: string;
  recommendedTypes: string;
  note?: string;
}

/**
 * Centrally defined, configurable image upload limits.
 *
 * Cloudinary Free plan limit: 10 MB per image.
 * Vercel Hobby serverless request-body limit: 4.5 MB (bypassed via direct browser-to-Cloudinary upload).
 *
 * Application limits:
 * - Product images: max 5 MB
 * - Service & About images: max 5 MB
 * - Blog images: max 5 MB
 * - Homepage hero images: max 8 MB
 * - Homepage other section images: max 5 MB
 * - Logos and icons: max 2 MB
 * - Category images: max 5 MB
 * - Media library images: max 8 MB
 */
export const IMAGE_LIMITS: Record<ImagePurpose, ImageLimitSpec> = {
  product: {
    maxBytes: 5 * 1024 * 1024,
    maxMB: 5,
    label: "Product image",
    recommendedTypes: "JPEG, PNG or WebP",
    note: "High-resolution photos will be automatically optimized and responsive on delivery.",
  },
  service: {
    maxBytes: 5 * 1024 * 1024,
    maxMB: 5,
    label: "Service photo",
    recommendedTypes: "JPEG, PNG or WebP",
    note: "High-resolution photos will be automatically optimized and responsive on delivery.",
  },
  blog: {
    maxBytes: 5 * 1024 * 1024,
    maxMB: 5,
    label: "Blog feature photo",
    recommendedTypes: "JPEG, PNG or WebP",
    note: "High-resolution photos will be automatically optimized and responsive on delivery.",
  },
  about: {
    maxBytes: 5 * 1024 * 1024,
    maxMB: 5,
    label: "About page image",
    recommendedTypes: "JPEG, PNG or WebP",
    note: "High-resolution photos will be automatically optimized and responsive on delivery.",
  },
  homepage_hero: {
    maxBytes: 8 * 1024 * 1024,
    maxMB: 8,
    label: "Homepage hero image",
    recommendedTypes: "JPEG, PNG or WebP",
    note: "High-impact banner images up to 8 MB. Automatically delivered at optimal resolutions.",
  },
  homepage: {
    maxBytes: 5 * 1024 * 1024,
    maxMB: 5,
    label: "Homepage section image",
    recommendedTypes: "JPEG, PNG or WebP",
    note: "Section background images up to 5 MB.",
  },
  logo: {
    maxBytes: 2 * 1024 * 1024,
    maxMB: 2,
    label: "Logo or icon",
    recommendedTypes: "PNG or WebP",
    note: "Transparent PNG or WebP recommended. Maximum size 2 MB.",
  },
  category: {
    maxBytes: 5 * 1024 * 1024,
    maxMB: 5,
    label: "Category image",
    recommendedTypes: "JPEG, PNG or WebP",
    note: "Category showcase images up to 5 MB.",
  },
  library: {
    maxBytes: 8 * 1024 * 1024,
    maxMB: 8,
    label: "Media library asset",
    recommendedTypes: "JPEG, PNG or WebP",
    note: "Upload high-quality images up to 8 MB.",
  },
};

export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export type AllowedImageType = (typeof ALLOWED_IMAGE_TYPES)[number];

export function getImageLimit(purpose?: ImagePurpose): ImageLimitSpec {
  if (purpose && IMAGE_LIMITS[purpose]) {
    return IMAGE_LIMITS[purpose];
  }
  return IMAGE_LIMITS.library;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

export function validateImageFile(
  file: { size: number; type: string },
  purpose?: ImagePurpose
): string | null {
  if (!(ALLOWED_IMAGE_TYPES as readonly string[]).includes(file.type)) {
    return "Only JPEG, PNG or WebP images are allowed.";
  }
  if (file.size === 0) {
    return "The selected file is empty.";
  }
  if (purpose) {
    const limit = getImageLimit(purpose);
    if (file.size > limit.maxBytes) {
      return `${limit.label} is larger than ${limit.maxMB} MB. Please choose a smaller file.`;
    }
  } else if (file.size > MAX_IMAGE_BYTES) {
    return "Image is larger than 8 MB. Please choose a smaller file.";
  }
  return null;
}
