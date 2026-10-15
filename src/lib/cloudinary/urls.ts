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

export function cloudinaryUrl(publicId: string, width: number, preset: ImagePreset = "card", quality: number | "auto" = "auto"): string {
  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  if (!cloud) return "";
  const p = PRESETS[preset];
  const parts = ["f_auto", `q_${quality}`, `c_${p.crop}`, `w_${Math.round(width)}`];
  if (p.ar && p.crop === "fill") parts.push(`ar_${p.ar}`, "g_auto");
  return `https://res.cloudinary.com/${cloud}/image/upload/${parts.join(",")}/${publicId}`;
}
