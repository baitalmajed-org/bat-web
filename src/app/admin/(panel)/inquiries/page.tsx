import Link from "next/link";
import { Check, RotateCcw } from "lucide-react";
import { requireAdmin } from "@/lib/supabase/auth";
import { ADMIN_PAGE_SIZE, listInquiries } from "@/lib/data/admin";
import { INQUIRY_TYPE_LABELS } from "@/types/db";
import { formatDateTime } from "@/lib/utils/text";
import { markInquiryStatus } from "@/app/admin/actions/inquiries";
import PageHeader from "@/components/admin/PageHeader";
import StatusBadge from "@/components/admin/StatusBadge";
import Pagination from "@/components/ui/Pagination";

type SP = Promise<{ page?: string; status?: string; type?: string; q?: string }>;

export default async function AdminInquiries({ searchParams }: { searchParams: SP }) {
  await requireAdmin();
  const sp = await searchParams;
  const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);
  const { rows, total } = await listInquiries({ page, status: sp.status, type: sp.type, q: sp.q });
  const totalPages = Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE));
  const hrefFor = (p: number) => {
    const params = new URLSearchParams();
    for (const k of ["status", "type", "q"] as const) if (sp[k]) params.set(k, sp[k]!);
    params.set("page", String(p));
    return `/admin/inquiries?${params}`;
  };

  const currentBack = `/admin/inquiries?${new URLSearchParams(
    Object.entries(sp).filter(([, v]) => typeof v === "string") as [string, string][]
  ).toString()}`;

  return (
    <>
      <PageHeader title="Inquiries" description={`${total} total submissions`} />

      <form className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4" role="search">
        <div>
          <label htmlFor="q" className="sr-only">Search</label>
          <input
            id="q"
            name="q"
            defaultValue={sp.q}
            placeholder="Reference, name, email, subject"
            className="field"
          />
        </div>
        <div>
          <label htmlFor="status" className="sr-only">Status</label>
          <select id="status" name="status" defaultValue={sp.status ?? ""} className="field">
            <option value="">All statuses</option>
            <option value="new">New only</option>
            <option value="read">Marked (Read) only</option>
          </select>
        </div>
        <div>
          <label htmlFor="type" className="sr-only">Type</label>
          <select id="type" name="type" defaultValue={sp.type ?? ""} className="field">
            <option value="">All types</option>
            {Object.entries(INQUIRY_TYPE_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </div>
        <div>
          <button className="btn-dark w-full sm:w-auto px-6" type="submit">Filter</button>
        </div>
      </form>

      <div className="overflow-x-auto border border-steel-200 bg-white shadow-sm">
        <table className="w-full min-w-[46rem] text-sm">
          <thead className="bg-steel-100 text-left text-xs uppercase tracking-wider text-steel-600">
            <tr>
              <th className="p-3">Reference</th>
              <th className="p-3">Customer</th>
              <th className="p-3">Subject</th>
              <th className="p-3">Status</th>
              <th className="p-3">Received</th>
              <th className="p-3 text-right">Quick action</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-steel-500">
                  No inquiries found.
                </td>
              </tr>
            ) : (
              rows.map((r) => {
                const isNew = r.status === "new";
                return (
                  <tr
                    key={r.id}
                    className={`border-t border-steel-200 align-top transition-colors ${
                      isNew ? "bg-blue-50/40 hover:bg-blue-50/70" : "hover:bg-steel-50/60"
                    }`}
                  >
                    <td className="p-3 font-mono text-xs">
                      <Link href={`/admin/inquiries/${r.id}`} className="text-brand font-semibold hover:underline">
                        {r.reference}
                      </Link>
                      {isNew && (
                        <span className="ml-2 inline-block h-2 w-2 rounded-full bg-blue-600" title="New unread inquiry" />
                      )}
                    </td>
                    <td className="p-3">
                      <p className="font-semibold text-steel-900">{r.customer_name}</p>
                      <p className="text-xs text-steel-500">{r.customer_email}</p>
                      {r.customer_phone ? (
                        <p className="text-xs text-steel-400">{r.customer_phone}</p>
                      ) : null}
                    </td>
                    <td className="p-3">
                      <p className="font-medium text-steel-800">{r.subject}</p>
                      <p className="text-xs text-steel-500">
                        {INQUIRY_TYPE_LABELS[r.inquiry_type] ?? r.inquiry_type}
                        {r.related_label ? ` · ${r.related_label}` : ""}
                      </p>
                    </td>
                    <td className="p-3">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="whitespace-nowrap p-3 text-xs text-steel-600">
                      {formatDateTime(r.created_at)}
                    </td>
                    <td className="whitespace-nowrap p-3 text-right">
                      {isNew ? (
                        <form action={markInquiryStatus} className="inline">
                          <input type="hidden" name="id" value={r.id} />
                          <input type="hidden" name="status" value="read" />
                          <input type="hidden" name="back" value={currentBack} />
                          <button
                            type="submit"
                            title="Mark this inquiry as read"
                            className="inline-flex items-center gap-1.5 rounded bg-steel-100 px-2.5 py-1 text-xs font-semibold text-steel-700 hover:bg-steel-200 hover:text-steel-900 transition-colors"
                          >
                            <Check className="h-3.5 w-3.5 text-steel-500" aria-hidden="true" />
                            Mark as read
                          </button>
                        </form>
                      ) : (
                        <form action={markInquiryStatus} className="inline">
                          <input type="hidden" name="id" value={r.id} />
                          <input type="hidden" name="status" value="new" />
                          <input type="hidden" name="back" value={currentBack} />
                          <button
                            type="submit"
                            title="Mark back as new"
                            className="inline-flex items-center gap-1.5 text-xs text-steel-400 hover:text-steel-700 transition-colors"
                          >
                            <RotateCcw className="h-3 w-3" aria-hidden="true" />
                            Mark as new
                          </button>
                        </form>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <Pagination page={page} totalPages={totalPages} hrefFor={hrefFor} />
    </>
  );
}
