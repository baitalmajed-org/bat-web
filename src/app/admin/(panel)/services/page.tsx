import Link from "next/link";
import { Eye, EyeOff, Pencil, Plus } from "lucide-react";
import { requireAdmin } from "@/lib/supabase/auth";
import { listAdminServices } from "@/lib/data/admin";
import { deleteService, setServicePublished } from "@/app/admin/actions/services";
import PageHeader from "@/components/admin/PageHeader";
import StatusBadge from "@/components/admin/StatusBadge";
import ConfirmDialog from "@/components/admin/ConfirmDialog";

export default async function AdminServices({ searchParams }: { searchParams: Promise<{ deleted?: string; error?: string }> }) {
  await requireAdmin();
  const [services, sp] = await Promise.all([listAdminServices(), searchParams]);
  return (
    <>
      <PageHeader title="Services" description={`${services.length} total`} actions={<Link href="/admin/services/new" className="btn-primary"><Plus className="h-4 w-4" aria-hidden /> New service</Link>} />
      {sp.deleted ? <p role="status" className="mb-4 border border-green-300 bg-green-50 p-3 text-sm text-green-800">Service deleted.</p> : null}
      {sp.error ? <p role="alert" className="mb-4 border border-red-300 bg-red-50 p-3 text-sm text-red-800">The service could not be deleted.</p> : null}
      <div className="overflow-x-auto border border-steel-200 bg-white">
        <table className="w-full min-w-[36rem] text-sm">
          <thead className="bg-steel-100 text-left text-xs uppercase tracking-wider text-steel-600"><tr><th className="p-3">Service</th><th className="p-3">Homepage</th><th className="p-3">Status</th><th className="p-3 text-right">Actions</th></tr></thead>
          <tbody>
            {services.length === 0 ? <tr><td colSpan={4} className="p-8 text-center text-steel-500">No services yet.</td></tr> : services.map((s) => (
              <tr key={s.id} className="border-t border-steel-200">
                <td className="p-3"><p className="font-semibold">{s.title}</p><p className="text-xs text-steel-500">/{s.slug}{s.is_sample ? " · sample" : ""}</p></td>
                <td className="p-3">{s.show_on_home ? "Shown" : "Hidden"}</td>
                <td className="p-3"><StatusBadge status={s.is_published ? "published" : "draft"} /></td>
                <td className="p-3"><div className="flex flex-wrap items-center justify-end gap-3">
                  <Link href={`/admin/services/${s.id}/edit`} className="inline-flex items-center gap-1 text-brand hover:underline"><Pencil className="h-4 w-4" aria-hidden /> Edit</Link>
                  <form action={setServicePublished}><input type="hidden" name="id" value={s.id} /><input type="hidden" name="publish" value={String(!s.is_published)} />
                    <button type="submit" className="inline-flex items-center gap-1 hover:text-brand">{s.is_published ? <><EyeOff className="h-4 w-4" aria-hidden /> Unpublish</> : <><Eye className="h-4 w-4" aria-hidden /> Publish</>}</button></form>
                  <ConfirmDialog compact triggerLabel="Delete" title={`Delete ${s.title}?`} description="This permanently deletes the service. This cannot be undone." action={deleteService} fields={{ id: s.id }} />
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
