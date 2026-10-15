"use server";

import { headers } from "next/headers";
import { createPublicClient } from "@/lib/supabase/public";
import { inquirySchema, fieldErrors } from "@/lib/validation/schemas";
import type { FormState } from "@/lib/validation/state";
import { rateLimit } from "@/lib/rate-limit";
import { sendInquiryNotifications, INQUIRY_TYPE_LABELS } from "@/lib/brevo/notify";
import { getSettings } from "@/lib/data/public";

const GENERIC_ERROR = "We could not send your inquiry right now. Please try again, or contact us by phone or WhatsApp.";

export async function submitInquiry(_prev: FormState, formData: FormData): Promise<FormState> {
  const raw = Object.fromEntries(
    Array.from(formData.entries()).filter(([, v]) => typeof v === "string") as [string, string][],
  );

  // Honeypot: bots fill the hidden field. Pretend success, store nothing.
  const honeypot = typeof raw.website === "string" ? raw.website.trim() : "";
  if (honeypot) {
    return { ok: true, message: "Thank you. Your inquiry has been received." };
  }

  const parsed = inquirySchema.safeParse(raw);
  const values = { ...raw };
  delete values.privacy;

  if (!parsed.success) {
    return { ok: false, errors: fieldErrors(parsed.error), values, message: "Please correct the highlighted fields." };
  }
  const input = parsed.data;

  // Secondary check if parsed data retained a non-empty website
  if (input.website) {
    return { ok: true, message: "Thank you. Your inquiry has been received." };
  }

  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!rateLimit(`inquiry:${ip}`, 5, 10 * 60 * 1000)) {
    return { ok: false, values, message: "Too many submissions. Please wait a few minutes and try again." };
  }

  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase.rpc("submit_inquiry", {
      p_name: input.name,
      p_email: input.email,
      p_phone: input.phone,
      p_company: input.company,
      p_type: input.type,
      p_product_id: input.type === "product" ? input.productId : null,
      p_service_id: input.type === "service" ? input.serviceId : null,
      p_subject: input.subject,
      p_message: input.message,
    });

    if (error) {
      if (error.message.includes("rate_limited")) {
        return { ok: false, values, message: "You have sent several inquiries recently. Please try again later or call us." };
      }
      console.error("[inquiry] save failed", error.code, error.message);
      return { ok: false, values, message: GENERIC_ERROR };
    }

    const row = (Array.isArray(data) ? data[0] : data) as { id: string; reference: string; related_label: string | null } | undefined;
    if (!row) return { ok: false, values, message: GENERIC_ERROR };

    // The inquiry is safely stored. Email problems must never fail the customer's submission.
    try {
      const settings = await getSettings();
      await sendInquiryNotifications(
        supabase,
        { id: row.id, reference: row.reference },
        {
          reference: row.reference,
          name: input.name,
          email: input.email,
          phone: input.phone,
          company: input.company || null,
          typeLabel: INQUIRY_TYPE_LABELS[input.type] ?? input.type,
          relatedLabel: row.related_label,
          subject: input.subject,
          message: input.message,
          createdAt: new Date().toISOString(),
        },
        { channels: ["admin", "customer"], companyName: settings.company_name, responseCommitment: settings.response_time_commitment },
      );
    } catch (e) {
      console.error("[inquiry] notification step failed", e instanceof Error ? e.message : e);
    }

    return { ok: true, reference: row.reference, message: "Thank you. Your inquiry has been received." };
  } catch (e) {
    console.error("[inquiry] unexpected error", e instanceof Error ? e.message : e);
    return { ok: false, values, message: GENERIC_ERROR };
  }
}
