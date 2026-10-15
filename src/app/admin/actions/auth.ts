"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAdmin } from "@/lib/supabase/auth";
import { rateLimit } from "@/lib/rate-limit";
import { headers } from "next/headers";
import { z } from "zod";
import type { FormState } from "@/lib/validation/state";

const loginSchema = z.object({ email: z.email(), password: z.string().min(1).max(200) });

export async function signIn(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = loginSchema.safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) return { ok: false, message: "Enter your email and password." };

  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!rateLimit(`login:${ip}`, 8, 10 * 60 * 1000)) return { ok: false, message: "Too many attempts. Please wait a few minutes." };

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword(parsed.data);
    if (error) return { ok: false, message: "Invalid email or password." };

    // Signed in with Supabase Auth: now require the account to be an administrator.
    const admin = await getAdmin();
    if (!admin) {
      await supabase.auth.signOut();
      return { ok: false, message: "This account is not authorized to use the admin panel." };
    }
  } catch (e) {
    console.error("[auth] sign-in error", e instanceof Error ? e.message : e);
    return { ok: false, message: "Sign-in is unavailable right now. Check the Supabase configuration." };
  }
  redirect("/admin");
}

export async function signOut(): Promise<void> {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch (e) {
    console.error("[auth] sign-out error", e instanceof Error ? e.message : e);
  }
  redirect("/admin/login");
}
