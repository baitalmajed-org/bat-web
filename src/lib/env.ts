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

export function brevoConfig(): { apiKey: string; senderEmail: string; senderName: string; adminEmail: string } | null {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL;
  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL;
  if (!apiKey || !senderEmail || !adminEmail) return null;
  return { apiKey, senderEmail, senderName: process.env.BREVO_SENDER_NAME || "Bait Al Majed Metal Works", adminEmail };
}
