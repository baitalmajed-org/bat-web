import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "./server";

export type AdminSession = { userId: string; email: string | null };

/**
 * Authoritative server-side admin check. Verifies the JWT with Supabase Auth
 * (getUser, not getSession) AND that the user exists in admin_users.
 * Call it at the top of every admin page, layout section and server action.
 */
export async function getAdmin(): Promise<AdminSession | null> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (isAdmin !== true) return null;
  return { userId: data.user.id, email: data.user.email ?? null };
}

export async function requireAdmin(): Promise<AdminSession> {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}

/** For server actions that return state instead of redirecting. */
export async function assertAdmin(): Promise<AdminSession> {
  const admin = await getAdmin();
  if (!admin) throw new Error("UNAUTHORIZED");
  return admin;
}
