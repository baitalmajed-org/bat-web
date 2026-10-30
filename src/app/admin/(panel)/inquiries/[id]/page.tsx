import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/supabase/auth";
import { getInquiry } from "@/lib/data/admin";
import { updateInquiry } from "@/app/admin/actions/inquiries";
import { INQUIRY_TYPE_LABELS } from "@/types/db";
import { formatDateTime } from "@/lib/utils/text";
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

  return (
    <>
      <PageHeader
        title={i.reference}
        description={`${INQUIRY_TYPE_LABELS[i.inquiry_type] ?? i.inquiry_type} · received ${formatDateTime(i.created_at)}`}
        actions={<Link href="/admin/inquiries" className="btn-outline">Back to inquiries</Link>}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="border border-steel-200 bg-white p-5" aria-labelledby="msg">
            <div className="flex items-center justify-between border-b border-steel-100 pb-3">
              <h2 id="msg" className="text-lg font-semibold text-steel-900">{i.subject}</h2>
              <StatusBadge status={i.status} />
            </div>
            {i.related_label ? (
              <p className="mt-2 text-sm text-steel-600">Regarding: <span className="font-medium text-steel-900">{i.related_label}</span></p>
            ) : null}
            <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-steel-800">{i.message}</p>
          </section>

          <section className="border border-steel-200 bg-white p-5" aria-labelledby="notes">
            <h2 id="notes" className="mb-4 text-lg font-semibold text-steel-900">Internal notes</h2>
            <NoteForm inquiryId={i.id} />
            <ul className="mt-5 space-y-3">
              {notes.length === 0 ? (
                <li className="text-sm text-steel-500">No notes yet.</li>
              ) : (
                notes.map((n) => (
                  <li key={n.id} className="border-l-4 border-steel-300 bg-steel-50 p-3 text-sm">
                    <p className="whitespace-pre-wrap text-steel-800">{n.note}</p>
                    <p className="mt-1 text-xs text-steel-500">{formatDateTime(n.created_at)}</p>
                  </li>
                ))
              )}
            </ul>
          </section>
        </div>

        <div className="space-y-6">
          <section className="border border-steel-200 bg-white p-5" aria-labelledby="cust">
            <h2 id="cust" className="mb-3 text-lg font-semibold text-steel-900">Customer</h2>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-xs uppercase text-steel-500 font-semibold">Name</dt>
                <dd className="mt-0.5 text-steel-900 font-medium">{i.customer_name}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-steel-500 font-semibold">Email</dt>
                <dd className="mt-0.5">
                  <a
                    href={`mailto:${i.customer_email}?subject=${encodeURIComponent(`Re: ${i.subject} (${i.reference})`)}`}
                    className="break-all text-brand font-medium hover:underline"
                  >
                    {i.customer_email}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-steel-500 font-semibold">Phone</dt>
                <dd className="mt-0.5">
                  <a
                    href={`tel:${i.customer_phone.replace(/[^\d+]/g, "")}`}
                    className="text-brand font-medium hover:underline"
                  >
                    {i.customer_phone}
                  </a>
                </dd>
              </div>
              {i.company_name ? (
                <div>
                  <dt className="text-xs uppercase text-steel-500 font-semibold">Company</dt>
                  <dd className="mt-0.5 text-steel-900">{i.company_name}</dd>
                </div>
              ) : null}
            </dl>
          </section>

          <section className="border border-steel-200 bg-white p-5" aria-labelledby="status">
            <h2 id="status" className="mb-3 text-lg font-semibold text-steel-900">Status & Follow-up</h2>
            <form action={updateInquiry} className="space-y-4">
              <input type="hidden" name="id" value={i.id} />
              <div>
                <label htmlFor="s" className="label">Inquiry status</label>
                <select id="s" name="status" defaultValue={i.status === "new" ? "new" : "read"} className="field">
                  <option value="new">New (Unread)</option>
                  <option value="read">Marked as Read</option>
                </select>
              </div>
              <div>
                <label htmlFor="f" className="label">Follow-up date & time</label>
                <input
                  id="f"
                  name="follow_up_at"
                  type="datetime-local"
                  defaultValue={toLocalInput(i.follow_up_at)}
                  className="field"
                />
              </div>
              <SubmitButton>Save changes</SubmitButton>
            </form>
          </section>
        </div>
      </div>
    </>
  );
}
