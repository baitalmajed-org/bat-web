import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/supabase/auth";
import { getAdminService } from "@/lib/data/admin";
import CloudImage from "@/components/ui/CloudImage";
import ServiceIcon from "@/components/ui/ServiceIcon";
import SpecTable from "@/components/ui/SpecTable";
import StatusBadge from "@/components/admin/StatusBadge";

export default async function PreviewService({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const s = await getAdminService(id);
  if (!s) notFound();
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border border-amber-300 bg-amber-50 p-3 text-sm">
        <span>Preview only. <StatusBadge status={s.is_published ? "published" : "draft"} /></span>
        <Link href={`/admin/services/${s.id}/edit`} className="btn-outline">Back to editor</Link>
      </div>
      <div className="grid gap-8 bg-white p-6 lg:grid-cols-2">
        <div><span className="text-brand"><ServiceIcon name={s.icon} className="h-9 w-9" /></span><h1 className="mt-3 text-3xl">{s.title}</h1>
          {s.short_description ? <p className="mt-3 text-lg text-steel-700">{s.short_description}</p> : null}
          {s.description ? <div className="mt-6 whitespace-pre-line text-steel-700">{s.description}</div> : null}
          {s.applications.length ? <ul className="mt-6 flex flex-wrap gap-2">{s.applications.map((a) => <li key={a} className="border border-steel-300 px-3 py-1 text-sm">{a}</li>)}</ul> : null}</div>
        {s.image_public_id ? <div className="relative aspect-[4/3] bg-steel-100"><CloudImage publicId={s.image_public_id} alt={s.image_alt ?? s.title} sizes="50vw" /></div> : null}
        {s.specifications.length ? <div className="lg:col-span-2"><SpecTable specs={s.specifications} /></div> : null}
      </div>
    </div>
  );
}
