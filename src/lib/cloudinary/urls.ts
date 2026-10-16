/** Pure URL builders (safe for server and client). */
export type ImagePreset = "hero" | "card" | "gallery" | "thumb" | "about" | "logo";

const PRESETS: Record<ImagePreset, { ar?: string; crop: string }> = {
  hero: { ar: "16:9", crop: "fill" },
  card: { ar: "4:3", crop: "fill" },
  gallery: { ar: "4:3", crop: "limit" },
  thumb: { ar: "1:1", crop: "fill" },
  about: { ar: "4:3", crop: "fill" },
  logo: { crop: "limit" },
};

/**
 * Extracts a clean public ID from a raw ID or full Cloudinary URL,
 * stripping domains, transform prefixes, version tags, and leading slashes.
 */
export function cleanPublicId(raw: string | null | undefined): string {
  if (!raw || typeof raw !== "string") return "";
  let cleaned = raw.trim();
  const match = cleaned.match(/^https?:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/(?:[a-zA-Z0-9_,:]+\/)?(?:v\d+\/)?([^\s?#]+?)(?:\.[a-zA-Z0-9]+)?$/);
  if (match && match[1]) {
    cleaned = match[1];
  }
  return cleaned.replace(/^\/+/, "");
}

export function cloudinaryUrl(publicId: string, width: number, preset: ImagePreset = "card", quality: number | "auto" = "auto"): string {
  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const cleaned = cleanPublicId(publicId);
  if (!cloud || !cleaned) return "";
  const p = PRESETS[preset] ?? PRESETS.card;
  const safeWidth = Math.max(1, Math.round(width || 800));
  const parts = ["f_auto", `q_${quality}`, `c_${p.crop}`, `w_${safeWidth}`];
  if (p.ar && p.crop === "fill") parts.push(`ar_${p.ar}`, "g_auto");
  return `https://res.cloudinary.com/${cloud}/image/upload/${parts.join(",")}/${cleaned}`;
}

