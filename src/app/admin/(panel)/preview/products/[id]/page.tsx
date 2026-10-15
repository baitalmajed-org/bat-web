import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/supabase/auth";
import { getAdminProduct } from "@/lib/data/admin";
import ProductGallery from "@/components/products/ProductGallery";
import SpecTable from "@/components/ui/SpecTable";
import StatusBadge from "@/components/admin/StatusBadge";

export default async function PreviewProduct({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const p = await getAdminProduct(id);
  if (!p) notFound();
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border border-amber-300 bg-amber-50 p-3 text-sm">
        <span>Preview only. <StatusBadge status={p.is_published ? "published" : "draft"} /> {p.is_published ? "This is live." : "This is not visible to visitors yet."}</span>
        <Link href={`/admin/products/${p.id}/edit`} className="btn-outline">Back to editor</Link>
      </div>
      <div className="grid gap-8 bg-white p-6 lg:grid-cols-2">
        <ProductGallery images={p.product_images} name={p.name} />
        <div>
          <h1 className="text-3xl">{p.name}</h1>
          {p.short_description ? <p className="mt-3 text-lg text-steel-700">{p.short_description}</p> : null}
          {p.description ? <div className="mt-6 whitespace-pre-line text-steel-700">{p.description}</div> : null}
          {p.applications.length ? <ul className="mt-6 flex flex-wrap gap-2">{p.applications.map((a) => <li key={a} className="border border-steel-300 px-3 py-1 text-sm">{a}</li>)}</ul> : null}
        </div>
        {p.specifications.length ? <div className="lg:col-span-2"><h2 className="mb-3 text-xl">Specifications</h2><SpecTable specs={p.specifications} /></div> : null}
      </div>
    </div>
  );
}
