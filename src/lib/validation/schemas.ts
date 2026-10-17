import { z } from "zod";

const slug = z
  .string()
  .trim()
  .min(2, "Slug is too short")
  .max(80)
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Use lowercase letters, numbers and single hyphens");

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Maximum ${max} characters`)
    .optional()
    .transform((v) => (v ? v : null));

const optionalUrl = z
  .string()
  .trim()
  .max(500)
  .optional()
  .transform((v) => (v ? v : null))
  .refine((v) => v === null || /^https:\/\/[^\s]+$/i.test(v), "Must be a valid https:// URL");

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function uuidOrNull(v: string | undefined): string | null {
  return v && UUID_RE.test(v) ? v : null;
}

export const INQUIRY_TYPES = ["product", "service", "custom_fabrication", "general"] as const;

// Phone: digits with optional + and common separators, 7-15 digits.
const phone = z
  .string()
  .trim()
  .max(30)
  .refine((v) => /^\+?[\d\s().-]+$/.test(v) && v.replace(/\D/g, "").length >= 7 && v.replace(/\D/g, "").length <= 15, "Enter a valid phone number");

export const inquirySchema = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(120),
  email: z.email("Enter a valid email address").max(254),
  phone,
  company: z.string().trim().max(160).optional().default(""),
  type: z.enum(INQUIRY_TYPES, { error: "Choose an inquiry type" }),
  // Hidden fields: a missing or malformed id means "no specific item" instead of blocking the visitor.
  productId: z.string().optional().transform(uuidOrNull),
  serviceId: z.string().optional().transform(uuidOrNull),
  subject: z.string().trim().min(3, "Please add a subject").max(200),
  message: z.string().trim().min(10, "Please tell us a little more (min 10 characters)").max(4000),
  privacy: z.literal("on", { error: "Please acknowledge the privacy notice" }),
  website: z.string().optional().default(""), // honeypot, allows parsing bot values so server action detects them
});
export type InquiryInput = z.infer<typeof inquirySchema>;

export const categorySchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug,
  description: optionalText(1000),
  image_alt: optionalText(200),
  sort_order: z.coerce.number().int().min(0).max(9999).default(0),
  is_active: z.boolean(),
});

export const productSchema = z.object({
  name: z.string().trim().min(2).max(160),
  slug,
  category_id: z.uuid().nullable(),
  short_description: optionalText(300),
  description: optionalText(8000),
  sort_order: z.coerce.number().int().min(0).max(9999).default(0),
  is_featured: z.boolean(),
  is_published: z.boolean(),
  seo_title: optionalText(70),
  seo_description: optionalText(170),
});

export const serviceSchema = z.object({
  title: z.string().trim().min(2).max(160),
  slug,
  short_description: optionalText(300),
  description: optionalText(8000),
  icon: z.enum(["handling", "construction", "fabrication", "safety", "custom", "structural"]).nullable(),
  image_alt: optionalText(200),
  sort_order: z.coerce.number().int().min(0).max(9999).default(0),
  show_on_home: z.boolean(),
  is_published: z.boolean(),
  seo_title: optionalText(70),
  seo_description: optionalText(170),
});

export const safeAnnouncementUrl = z
  .string()
  .trim()
  .max(500)
  .optional()
  .transform((v) => (v ? v : null))
  .refine((v) => {
    if (v === null) return true;
    if (/^(javascript|vbscript|data):/i.test(v)) return false;
    if (/^\/[a-zA-Z0-9_\-\/?#&=.%]*$/.test(v)) return true;
    try {
      const u = new URL(v);
      return u.protocol === "https:";
    } catch {
      return false;
    }
  }, "Must be a valid https:// URL or an internal path starting with /");

export const settingsSchema = z.object({
  company_name: z.string().trim().min(2).max(120),
  tagline: optionalText(200),
  main_phone: phone,
  whatsapp_number: phone,
  secondary_phone: phone.optional().or(z.literal("")).transform((v) => (v ? v : null)),
  email: z.email().max(254),
  address_text: optionalText(300),
  business_hours: optionalText(300),
  google_maps_url: optionalUrl,
  google_maps_embed_url: optionalUrl.refine(
    (v) => v === null || /^https:\/\/www\.google\.com\/maps\/embed/i.test(v),
    "Use the src URL from Google Maps > Share > Embed a map",
  ),
  facebook_url: optionalUrl,
  instagram_url: optionalUrl,
  linkedin_url: optionalUrl,
  youtube_url: optionalUrl,
  x_url: optionalUrl,
  announcement_enabled: z.boolean().optional().default(false),
  announcement_text: optionalText(300),
  announcement_link_url: safeAnnouncementUrl,
  announcement_link_label: optionalText(80),
  announcement_link_new_tab: z.boolean().optional().default(false),
  seo_default_title: optionalText(70),
  seo_default_description: optionalText(170),
  footer_description: optionalText(400),
  response_time_commitment: optionalText(200),
});

const ctaHref = z
  .string()
  .trim()
  .max(300)
  .optional()
  .transform((v) => (v ? v : null))
  .refine((v) => v === null || v === "whatsapp" || v === "tel" || /^(\/|https:\/\/|tel:|mailto:)/.test(v), "Use whatsapp, tel, a /path or an https:// URL");

export const homepageSectionSchema = z.object({
  eyebrow: optionalText(80),
  heading: optionalText(200),
  body: optionalText(1000),
  image_alt: optionalText(200),
  primary_cta_label: optionalText(40),
  primary_cta_href: ctaHref,
  secondary_cta_label: optionalText(40),
  secondary_cta_href: ctaHref,
  is_visible: z.boolean(),
  sort_order: z.coerce.number().int().min(0).max(99).default(0),
});

export const aboutSchema = z.object({
  title: z.string().trim().min(2).max(120),
  meta_description: optionalText(170),
  overview: z.string().trim().max(4000).default(""),
  mission: z.string().trim().max(2000).default(""),
  vision: z.string().trim().max(2000).default(""),
  quality: z.string().trim().max(2000).default(""),
  founded: z.string().trim().max(40).default(""),
  team_size: z.string().trim().max(40).default(""),
});

export const noteSchema = z.object({ note: z.string().trim().min(1, "Write a note first").max(4000) });

export const inquiryStatusSchema = z.enum(["new", "in_progress", "replied", "closed"]);

import { IMAGE_LIMITS, ALLOWED_IMAGE_TYPES, type ImagePurpose, getImageLimit } from "@/lib/cloudinary/limits";
export { IMAGE_LIMITS, ALLOWED_IMAGE_TYPES, type ImagePurpose, getImageLimit };

export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

export function validateImageFile(file: { size: number; type: string }, purpose?: ImagePurpose): string | null {
  if (!(ALLOWED_IMAGE_TYPES as readonly string[]).includes(file.type)) return "Only JPEG, PNG or WebP images are allowed.";
  if (file.size === 0) return "The selected file is empty.";
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

export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
