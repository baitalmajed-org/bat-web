import "server-only";
import { brevoConfig } from "@/lib/env";

export type SendResult = { ok: true; messageId?: string } | { ok: false; retryable: boolean; error: string };

export function isBrevoConfigured(): boolean {
  return brevoConfig() !== null;
}

/**
 * Sends one transactional email through Brevo's REST API.
 * Duplicate sends are prevented by the callers through the per-channel status columns.
 */
export async function sendEmail(opts: {
  to: { email: string; name?: string };
  subject: string;
  html: string;
  replyTo?: { email: string; name?: string };
  tag: string;
}): Promise<SendResult> {
  const cfg = brevoConfig();
  if (!cfg) return { ok: false, retryable: false, error: "Brevo is not configured" };

  try {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { "api-key": cfg.apiKey, "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({
        sender: { email: cfg.senderEmail, name: cfg.senderName },
        to: [opts.to],
        subject: opts.subject,
        htmlContent: opts.html,
        replyTo: opts.replyTo,
        tags: [opts.tag],
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (res.ok) {
      const json = (await res.json().catch(() => ({}))) as { messageId?: string };
      return { ok: true, messageId: json.messageId };
    }
    const retryable = res.status === 429 || res.status >= 500;
    console.error("[brevo] send failed", res.status, opts.tag);
    return { ok: false, retryable, error: `Brevo responded with HTTP ${res.status}` };
  } catch (e) {
    console.error("[brevo] network error", e instanceof Error ? e.name : e);
    return { ok: false, retryable: true, error: "Could not reach Brevo" };
  }
}
