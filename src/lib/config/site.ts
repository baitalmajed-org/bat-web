/**
 * Central, single source of truth for company contact details.
 * Runtime values are read from the `site_settings` table (editable in the admin Settings page);
 * these defaults come from the business card and are used when the database is unreachable.
 */
export const COMPANY = {
  name: "Bait Al Majed Metal Works",
  shortName: "BAM",
  tagline: "We do all kind of welding and fabrication works",
  mainPhone: "+971 54 716 7455",
  whatsappNumber: "+971 54 716 7455",
  secondaryPhone: "00971 55 754 5936",
  email: "info@bammetaluae.com",
  location: "Ajman, United Arab Emirates",
} as const;

/** Convert any phone format to international digits-only form (e.g. 971547167455). */
export function normalizePhone(input: string): string {
  let digits = input.replace(/[^\d+]/g, "");
  if (digits.startsWith("+")) digits = digits.slice(1);
  else if (digits.startsWith("00")) digits = digits.slice(2);
  else if (digits.startsWith("0")) digits = "971" + digits.slice(1);
  return digits.replace(/\D/g, "");
}

export function telHref(phone: string): string {
  return `tel:+${normalizePhone(phone)}`;
}

export function whatsappHref(phone: string, message?: string): string {
  const base = `https://wa.me/${normalizePhone(phone)}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

export function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

export const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/products", label: "Products" },
  { href: "/services", label: "Services" },
  { href: "/contact", label: "Contact" },
] as const;

export function isSafeUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  const trimmed = url.trim();
  if (/^javascript:/i.test(trimmed)) return false;
  return /^https?:\/\//i.test(trimmed);
}

/**
 * Checks whether the administrator has provided an actual YouTube channel or video link
 * rather than an empty string, null, or a bare root domain like "https://youtube.com".
 */
export function isConfiguredYoutubeUrl(url: string | null | undefined): boolean {
  if (!isSafeUrl(url)) return false;
  const trimmed = url!.trim().replace(/\/+$/, "").toLowerCase();
  const bareRoots = [
    "https://youtube.com",
    "https://www.youtube.com",
    "http://youtube.com",
    "http://www.youtube.com",
    "https://m.youtube.com",
  ];
  return !bareRoots.includes(trimmed);
}

