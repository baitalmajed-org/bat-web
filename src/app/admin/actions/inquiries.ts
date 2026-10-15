"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { assertAdmin } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import { inquiryStatusSchema, noteSchema } from "@/lib/validation/schemas";
import { dbMessage, done, fail, str } from "@/lib/admin-form";
import { sendInquiryNotifications, INQUIRY_TYPE_LABELS } from "@/lib/brevo/notify";
import { getSettings } from "@/lib/data/public";
import type { FormState } from "@/lib/validation/state";
import type { Inquiry } from "@/types/db";

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
  redirect(`/admin/inquiries/${id}?saved=1`);
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

/** Retries only channels that are not already 'sent', so a delivered email is never re-sent. */
export async function retryNotifications(formData: FormData): Promise<void> {
  await assertAdmin();
  const id = str(formData, "id");
  const supabase = await createClient();
  const { data } = await supabase.from("inquiries").select("*").eq("id", id).maybeSingle();
  const inquiry = data as Inquiry | null;
  if (!inquiry) redirect("/admin/inquiries");

  const channels: ("admin" | "customer")[] = [];
  if (inquiry.admin_email_status !== "sent") channels.push("admin");
  if (inquiry.customer_email_status !== "sent") channels.push("customer");
  if (channels.length === 0) redirect(`/admin/inquiries/${id}?retry=nothing`);

  const settings = await getSettings();
  const outcome = await sendInquiryNotifications(
    supabase,
    { id: inquiry.id, reference: inquiry.reference },
    {
      reference: inquiry.reference, name: inquiry.customer_name, email: inquiry.customer_email, phone: inquiry.customer_phone,
      company: inquiry.company_name, typeLabel: INQUIRY_TYPE_LABELS[inquiry.inquiry_type] ?? inquiry.inquiry_type,
      relatedLabel: inquiry.related_label, subject: inquiry.subject, message: inquiry.message, createdAt: inquiry.created_at,
    },
    { channels, companyName: settings.company_name, responseCommitment: settings.response_time_commitment },
  );
  const allOk = channels.every((c) => outcome[c]);
  revalidatePath(`/admin/inquiries/${id}`);
  redirect(`/admin/inquiries/${id}?retry=${allOk ? "ok" : "failed"}`);
}
