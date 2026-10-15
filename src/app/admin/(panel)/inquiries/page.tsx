import Link from "next/link";
import { requireAdmin } from "@/lib/supabase/auth";
import { ADMIN_PAGE_SIZE, listInquiries } from "@/lib/data/admin";
import { INQUIRY_TYPE_LABELS } from "@/lib/brevo/notify";
import { formatDateTime } from "@/lib/utils/text";
import PageHeader from "@/components/admin/PageHeader";
import StatusBadge from "@/components/admin/StatusBadge";
import Pagination from "@/components/ui/Pagination";

type SP = Promise<{ page?: string; status?: string; type?: string; q?: string; failed?: string }>;

export default async function AdminInquiries({ searchParams }: { searchParams: SP }) {
  await requireAdmin();
  const sp = await searchParams;
  const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);
  const { rows, total } = await listInquiries({ page, status: sp.status, type: sp.type, q: sp.q, failedOnly: sp.failed === "1" });
  const totalPages = Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE));
  const hrefFor = (p: number) => {
    const params = new URLSearchParams();
    for (const k of ["status", "type", "q", "failed"] as const) if (sp[k]) params.set(k, sp[k]!);
    params.set("page", String(p));
    return `/admin/inquiries?${params}`;
  };

  return (
    <>
      <PageHeader title="Inquiries" description={`${total} matching`} />
      <form className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5" role="search">
        <div className="lg:col-span-2"><label htmlFor="q" className="sr-only">Search</label><input id="q" name="q" defaultValue={sp.q} placeholder="Reference, name, email, subject" className="field" /></div>
        <div><label htmlFor="status" className="sr-only">Status</label><select id="status" name="status" defaultValue={sp.status ?? ""} className="field"><option value="">All statuses</option><option value="new">New</option><option value="in_progress">In progress</option><option value="replied">Replied</option><option value="closed">Closed</option></select></div>
        <div><label htmlFor="type" className="sr-only">Type</label><select id="type" name="type" defaultValue={sp.type ?? ""} className="field"><option value="">All types</option>{Object.entries(INQUIRY_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
        <div className="flex items-center gap-3"><label className="flex items-center gap-2 text-sm"><input type="checkbox" name="failed" value="1" defaultChecked={sp.failed === "1"} className="h-4 w-4 accent-[#791A30]" /> Failed emails</label><button className="btn-dark" type="submit">Filter</button></div>
      </form>

      <div className="overflow-x-auto border border-steel-200 bg-white">
        <table className="w-full min-w-[44rem] text-sm">
          <thead className="bg-steel-100 text-left text-xs uppercase tracking-wider text-steel-600"><tr><th className="p-3">Reference</th><th className="p-3">Customer</th><th className="p-3">Subject</th><th className="p-3">Status</th><th className="p-3">Email</th><th className="p-3">Received</th></tr></thead>
          <tbody>
            {rows.length === 0 ? <tr><td colSpan={6} className="p-8 text-center text-steel-500">No inquiries found.</td></tr> : rows.map((r) => {
              const failed = r.admin_email_status === "failed" || r.customer_email_status === "failed";
              return (
                <tr key={r.id} className="border-t border-steel-200 align-top">
                  <td className="p-3 font-mono text-xs"><Link href={`/admin/inquiries/${r.id}`} className="text-brand hover:underline">{r.reference}</Link></td>
                  <td className="p-3"><p className="font-semibold">{r.customer_name}</p><p className="text-xs text-steel-500">{r.customer_email}</p></td>
                  <td className="p-3"><p>{r.subject}</p><p className="text-xs text-steel-500">{INQUIRY_TYPE_LABELS[r.inquiry_type]}{r.related_label ? ` · ${r.related_label}` : ""}</p></td>
                  <td className="p-3"><StatusBadge status={r.status} /></td>
                  <td className="p-3">{failed ? <StatusBadge status="failed" label="failed" /> : <StatusBadge status={r.admin_email_status === "sent" && r.customer_email_status === "sent" ? "sent" : "pending"} label={r.admin_email_status === "sent" && r.customer_email_status === "sent" ? "sent" : "pending"} />}</td>
                  <td className="whitespace-nowrap p-3 text-xs text-steel-600">{formatDateTime(r.created_at)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <Pagination page={page} totalPages={totalPages} hrefFor={hrefFor} />
    </>
  );
}
