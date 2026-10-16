import Link from "next/link";
import { notFound } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { requireAdmin } from "@/lib/supabase/auth";
import { getInquiry } from "@/lib/data/admin";
import { retryNotifications, updateInquiry } from "@/app/admin/actions/inquiries";
import { INQUIRY_TYPE_LABELS } from "@/lib/brevo/notify";
import { formatDateTime } from "@/lib/utils/text";
import { isBrevoConfigured } from "@/lib/brevo/client";
import PageHeader from "@/components/admin/PageHeader";
import StatusBadge from "@/components/admin/StatusBadge";
import NoteForm from "@/components/admin/NoteForm";
import SubmitButton from "@/components/admin/SubmitButton";


function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default async function InquiryDetail({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const found = await getInquiry(id);
  if (!found) notFound();
  const { inquiry: i, notes } = found;
  const needsRetry = i.admin_email_status !== "sent" || i.customer_email_status !== "sent";

  return (
    <>
      <PageHeader title={i.reference} description={`${INQUIRY_TYPE_LABELS[i.inquiry_type]} · received ${formatDateTime(i.created_at)}`} actions={<Link href="/admin/inquiries" className="btn-outline">Back to inquiries</Link>} />


      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="border border-steel-200 bg-white p-5" aria-labelledby="msg">
            <h2 id="msg" className="text-lg">{i.subject}</h2>
            {i.related_label ? <p className="mt-1 text-sm text-steel-600">Regarding: {i.related_label}</p> : null}
            <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed">{i.message}</p>
          </section>
          <section className="border border-steel-200 bg-white p-5" aria-labelledby="notes">
            <h2 id="notes" className="mb-4 text-lg">Internal notes</h2>
            <NoteForm inquiryId={i.id} />
            <ul className="mt-5 space-y-3">
              {notes.length === 0 ? <li className="text-sm text-steel-500">No notes yet.</li> : notes.map((n) => (
                <li key={n.id} className="border-l-4 border-steel-300 bg-steel-50 p-3 text-sm"><p className="whitespace-pre-wrap">{n.note}</p><p className="mt-1 text-xs text-steel-500">{formatDateTime(n.created_at)}</p></li>
              ))}
            </ul>
          </section>
        </div>

        <div className="space-y-6">
          <section className="border border-steel-200 bg-white p-5" aria-labelledby="cust">
            <h2 id="cust" className="mb-3 text-lg">Customer</h2>
            <dl className="space-y-2 text-sm">
              <div><dt className="text-xs uppercase text-steel-500">Name</dt><dd>{i.customer_name}</dd></div>
              <div><dt className="text-xs uppercase text-steel-500">Email</dt><dd><a href={`mailto:${i.customer_email}?subject=${encodeURIComponent(`Re: ${i.subject} (${i.reference})`)}`} className="break-all text-brand hover:underline">{i.customer_email}</a></dd></div>
              <div><dt className="text-xs uppercase text-steel-500">Phone</dt><dd><a href={`tel:${i.customer_phone.replace(/[^\d+]/g, "")}`} className="text-brand hover:underline">{i.customer_phone}</a></dd></div>
              {i.company_name ? <div><dt className="text-xs uppercase text-steel-500">Company</dt><dd>{i.company_name}</dd></div> : null}
            </dl>
          </section>

          <section className="border border-steel-200 bg-white p-5" aria-labelledby="status">
            <h2 id="status" className="mb-3 text-lg">Status and follow-up</h2>
            <form action={updateInquiry} className="space-y-3">
              <input type="hidden" name="id" value={i.id} />
              <div><label htmlFor="s" className="label">Status</label><select id="s" name="status" defaultValue={i.status} className="field"><option value="new">New</option><option value="in_progress">In progress</option><option value="replied">Replied</option><option value="closed">Closed</option></select></div>
              <div><label htmlFor="f" className="label">Follow up on</label><input id="f" name="follow_up_at" type="datetime-local" defaultValue={toLocalInput(i.follow_up_at)} className="field" /></div>
              <SubmitButton>Save</SubmitButton>
            </form>
          </section>

          <section className="border border-steel-200 bg-white p-5" aria-labelledby="mail">
            <h2 id="mail" className="mb-3 text-lg">Email notifications</h2>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center justify-between">Admin notification <StatusBadge status={i.admin_email_status} /></li>
              {i.admin_email_error ? <li className="text-xs text-red-700">{i.admin_email_error}</li> : null}
              <li className="flex items-center justify-between">Customer confirmation <StatusBadge status={i.customer_email_status} /></li>
              {i.customer_email_error ? <li className="text-xs text-red-700">{i.customer_email_error}</li> : null}
              <li className="text-xs text-steel-500">Attempts: {i.email_attempts}{i.last_email_attempt_at ? ` · last ${formatDateTime(i.last_email_attempt_at)}` : ""}</li>
            </ul>
            {!isBrevoConfigured() ? <p className="mt-3 border border-amber-300 bg-amber-50 p-2 text-xs text-amber-900">Brevo is not configured on this server.</p> : null}
            {needsRetry ? (
              <form action={retryNotifications} className="mt-4"><input type="hidden" name="id" value={i.id} /><SubmitButton className="btn-outline" pendingLabel="Sending..."><RefreshCw className="h-4 w-4" aria-hidden /> Retry failed emails</SubmitButton></form>
            ) : null}
          </section>
        </div>
      </div>
    </>
  );
}
