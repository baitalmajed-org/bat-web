import Image from "next/image";
import { redirect } from "next/navigation";
import { getAdmin } from "@/lib/supabase/auth";
import { hasSupabaseEnv } from "@/lib/env";
import { ADMIN_METADATA } from "@/lib/seo/metadata";
import LoginForm from "./LoginForm";

export const metadata = { ...ADMIN_METADATA, title: "Admin login" };

export default async function LoginPage() {
  const configured = hasSupabaseEnv();
  if (configured && (await getAdmin().catch(() => null))) redirect("/admin");
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm border border-steel-200 bg-white p-8">
        <div className="relative mx-auto mb-6 h-20 w-40"><Image src="/brand/logo-on-white.png" alt="Bait Al Majed Metal Works" fill sizes="160px" className="object-contain" priority /></div>
        <h1 className="mb-6 text-center text-xl">Admin sign in</h1>
        {configured ? <LoginForm /> : <p className="border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900" role="alert">Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local.</p>}
      </div>
    </div>
  );
}
