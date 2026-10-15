import { escapeHtml, formatDateTime } from "@/lib/utils/text";

export type InquiryEmailData = {
  reference: string;
  name: string;
  email: string;
  phone: string;
  company: string | null;
  typeLabel: string;
  relatedLabel: string | null;
  subject: string;
  message: string;
  createdAt: string;
};

const BRAND = "#791A30";

function layout(title: string, bodyHtml: string, companyName: string): string {
  return `<!doctype html><html><body style="margin:0;background:#f5f5f6;font-family:Segoe UI,Arial,sans-serif;color:#25282c">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border-top:4px solid ${BRAND}">
<tr><td style="padding:20px 28px;border-bottom:1px solid #e5e5e7;font-size:18px;font-weight:700;color:${BRAND}">${escapeHtml(companyName)}</td></tr>
<tr><td style="padding:28px"><h1 style="margin:0 0 16px;font-size:20px">${escapeHtml(title)}</h1>${bodyHtml}</td></tr>
<tr><td style="padding:16px 28px;background:#f5f5f6;font-size:12px;color:#74777c">${escapeHtml(companyName)} &middot; Ajman, United Arab Emirates</td></tr>
</table></td></tr></table></body></html>`;
}

function row(label: string, value: string): string {
  return `<tr><td style="padding:6px 12px 6px 0;color:#74777c;vertical-align:top;white-space:nowrap">${escapeHtml(label)}</td><td style="padding:6px 0">${escapeHtml(value)}</td></tr>`;
}

export function adminInquiryEmail(d: InquiryEmailData, companyName: string) {
  const rows = [
    row("Reference", d.reference),
    row("Name", d.name),
    row("Email", d.email),
    row("Phone", d.phone),
    d.company ? row("Company", d.company) : "",
    row("Inquiry type", d.typeLabel),
    d.relatedLabel ? row("Related item", d.relatedLabel) : "",
    row("Subject", d.subject),
    row("Submitted", formatDateTime(d.createdAt)),
  ].join("");
  const html = layout(
    `New inquiry ${d.reference}`,
    `<table role="presentation" cellpadding="0" cellspacing="0" style="font-size:14px">${rows}</table>
     <p style="margin:20px 0 6px;font-weight:600">Message</p>
     <div style="white-space:pre-wrap;font-size:14px;line-height:1.5;border-left:3px solid ${BRAND};padding-left:12px">${escapeHtml(d.message)}</div>`,
    companyName,
  );
  return { subject: `[${d.reference}] New inquiry: ${d.subject}`.slice(0, 200), html };
}

export function customerConfirmationEmail(d: InquiryEmailData, companyName: string, responseCommitment: string | null) {
  const commitment = responseCommitment ? `<p style="font-size:14px">${escapeHtml(responseCommitment)}</p>` : "";
  const html = layout(
    "We have received your inquiry",
    `<p style="font-size:14px;line-height:1.5">Dear ${escapeHtml(d.name)},</p>
     <p style="font-size:14px;line-height:1.5">Thank you for contacting ${escapeHtml(companyName)}. We have received your inquiry and will review it.</p>
     <p style="font-size:14px">Your reference number is <strong style="color:${BRAND}">${escapeHtml(d.reference)}</strong>. Please quote it in any follow-up.</p>
     ${commitment}
     <p style="margin:20px 0 6px;font-weight:600;font-size:14px">Subject</p>
     <p style="margin:0;font-size:14px">${escapeHtml(d.subject)}</p>`,
    companyName,
  );
  return { subject: `We received your inquiry (${d.reference})`, html };
}
