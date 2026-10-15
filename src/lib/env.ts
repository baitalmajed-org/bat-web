/** Environment access with clear diagnostics. Server-only values are never read in client code. */
export function hasSupabaseEnv(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export function requireSupabaseEnv(): { url: string; anonKey: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local.",
    );
  }
  return { url, anonKey };
}

export function cloudinaryConfig(): { cloudName: string; apiKey: string; apiSecret: string; folder: string } | null {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) return null;
  return { cloudName, apiKey, apiSecret, folder: process.env.CLOUDINARY_FOLDER || "bam" };
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isPlaceholderKey(key: string): boolean {
  const trimmed = key.trim().toLowerCase();
  return (
    trimmed === "" ||
    trimmed.startsWith("your-") ||
    trimmed.startsWith("your_") ||
    trimmed.startsWith("<your-") ||
    trimmed === "placeholder" ||
    trimmed === "changeme"
  );
}

function isValidEmail(email: string | undefined): boolean {
  if (!email) return false;
  const trimmed = email.trim();
  return trimmed.length > 0 && trimmed.length <= 254 && EMAIL_RE.test(trimmed);
}

export function brevoConfig(): { apiKey: string; senderEmail: string; senderName: string; adminEmail: string } | null {
  const rawKey = process.env.BREVO_API_KEY;
  const rawSender = process.env.BREVO_SENDER_EMAIL;
  const rawAdmin = process.env.ADMIN_NOTIFICATION_EMAIL;

  if (!rawKey || isPlaceholderKey(rawKey)) return null;
  if (!rawSender || !isValidEmail(rawSender)) return null;
  if (!rawAdmin || !isValidEmail(rawAdmin)) return null;

  return {
    apiKey: rawKey.trim(),
    senderEmail: rawSender.trim(),
    senderName: process.env.BREVO_SENDER_NAME?.trim() || "Bait Al Majed Metal Works",
    adminEmail: rawAdmin.trim(),
  };
}
