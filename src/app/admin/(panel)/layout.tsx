import { requireAdmin } from "@/lib/supabase/auth";
import { hasSupabaseEnv } from "@/lib/env";
import { redirect } from "next/navigation";
import AdminNav from "@/components/admin/AdminNav";
import { signOut } from "../actions/auth";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  if (!hasSupabaseEnv()) redirect("/admin/login");
  const admin = await requireAdmin();
  return (
    <>
      <AdminNav email={admin.email} logout={signOut} />
      <div className="lg:pl-60">
        <div className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8">{children}</div>
      </div>
    </>
  );
}
