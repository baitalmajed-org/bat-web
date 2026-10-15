import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { brevoConfig } from "@/lib/env";
import { sendEmail } from "./client";
import { adminInquiryEmail, customerConfirmationEmail, type InquiryEmailData } from "./templates";

export const INQUIRY_TYPE_LABELS: Record<string, string> = {
  product: "Product inquiry",
  service: "Service inquiry",
  custom_fabrication: "Custom fabrication requirement",
  general: "General question",
};

type Channel = "admin" | "customer";

/**
 * Sends the requested channels. A channel is only sent while its stored status is
 * 'pending' or 'failed', so a retry or double submit never re-sends a delivered email.
 * The outcome is persisted through record_notification_result().
 */
export async function sendInquiryNotifications(
  supabase: SupabaseClient,
  inquiry: { id: string; reference: string },
  data: InquiryEmailData,
  opts: { channels: Channel[]; companyName: string; responseCommitment: string | null },
): Promise<{ admin?: boolean; customer?: boolean }> {
  const cfg = brevoConfig();
  const outcome: { admin?: boolean; customer?: boolean } = {};

  for (const channel of opts.channels) {
    if (!cfg) {
      await supabase.rpc("record_notification_result", {
        p_id: inquiry.id, p_reference: inquiry.reference, p_channel: channel, p_ok: false,
        p_error: "Email service not configured",
      });
      outcome[channel] = false;
      continue;
    }
    const mail =
      channel === "admin"
        ? adminInquiryEmail(data, opts.companyName)
        : customerConfirmationEmail(data, opts.companyName, opts.responseCommitment);

    const result = await sendEmail({
      to: channel === "admin" ? { email: cfg.adminEmail } : { email: data.email, name: data.name },
      subject: mail.subject,
      html: mail.html,
      replyTo: channel === "admin" ? { email: data.email, name: data.name } : undefined,
      tag: `inquiry-${channel}`,
    });

    await supabase.rpc("record_notification_result", {
      p_id: inquiry.id, p_reference: inquiry.reference, p_channel: channel, p_ok: result.ok,
      p_error: result.ok ? null : result.error,
    });
    outcome[channel] = result.ok;
  }
  return outcome;
}
