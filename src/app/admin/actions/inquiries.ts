"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { assertAdmin } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import { inquiryStatusSchema, noteSchema } from "@/lib/validation/schemas";
import { dbMessage, done, fail, str } from "@/lib/admin-form";
import type { FormState } from "@/lib/validation/state";

export async function updateInquiry(formData: FormData): Promise<void> {
  await assertAdmin();
  const id = str(formData, "id");
  const status = inquiryStatusSchema.safeParse(str(formData, "status"));
  if (!status.success) redirect(`/admin/inquiries/${id}?error=status`);
  const followUp = str(formData, "follow_up_at");
  const supabase = await createClient();
  const { error } = await supabase.from("inquiries").update({
    status: status.data,
    follow_up_at: followUp ? new Date(followUp).toISOString() : null,
  }).eq("id", id);
  if (error) console.error("[admin] inquiry update failed", error.message);
  revalidatePath("/admin/inquiries");
  revalidatePath(`/admin/inquiries/${id}`);
  redirect(`/admin/inquiries/${id}?saved=1`);
}

export async function markInquiryStatus(formData: FormData): Promise<void> {
  await assertAdmin();
  const id = str(formData, "id");
  const targetStatus = str(formData, "status") || "read";
  const parsed = inquiryStatusSchema.safeParse(targetStatus);
  if (!parsed.success) redirect(`/admin/inquiries`);

  const supabase = await createClient();
  const { error } = await supabase.from("inquiries").update({ status: parsed.data }).eq("id", id);
  if (error) console.error("[admin] inquiry mark status failed", error.message);

  revalidatePath("/admin/inquiries");
  revalidatePath(`/admin/inquiries/${id}`);

  const back = str(formData, "back") || "/admin/inquiries";
  redirect(back);
}

export async function addInquiryNote(inquiryId: string, _prev: FormState, fd: FormData): Promise<FormState> {
  const admin = await assertAdmin();
  const parsed = noteSchema.safeParse({ note: str(fd, "note") });
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid note.");
  const supabase = await createClient();
  const { error } = await supabase.from("inquiry_notes").insert({ inquiry_id: inquiryId, author_id: admin.userId, note: parsed.data.note });
  if (error) return fail(dbMessage(error));
  revalidatePath(`/admin/inquiries/${inquiryId}`);
  return done("Note added.");
}
