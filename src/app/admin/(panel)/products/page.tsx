import Link from "next/link";
import { Eye, EyeOff, Pencil, Plus } from "lucide-react";
import { requireAdmin } from "@/lib/supabase/auth";
import { ADMIN_PAGE_SIZE, listAdminProducts } from "@/lib/data/admin";
import { deleteProduct, setProductPublished } from "@/app/admin/actions/products";
import PageHeader from "@/components/admin/PageHeader";
import StatusBadge from "@/components/admin/StatusBadge";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import Pagination from "@/components/ui/Pagination";

type SP = Promise<{ page?: string; q?: string; status?: string; deleted?: string; error?: string }>;

export default async function AdminProducts({ searchParams }: { searchParams: SP }) {
  await requireAdmin();
  const sp = await searchParams;
  const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);
  const q = sp.q ?? "";
  const status = sp.status ?? "";
  const { rows, total } = await listAdminProducts(page, q, status);
  const totalPages = Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE));
  const hrefFor = (p: number) => `/admin/products?${new URLSearchParams({ ...(q && { q }), ...(status && { status }), page: String(p) })}`;

  return (
    <>
      <PageHeader title="Products" description={`${total} total`} actions={<Link href="/admin/products/new" className="btn-primary"><Plus className="h-4 w-4" aria-hidden /> New product</Link>} />

      <form className="mb-4 flex flex-col gap-3 sm:flex-row" role="search">
        <label htmlFor="q" className="sr-only">Search</label>
        <input id="q" name="q" defaultValue={q} placeholder="Search name or slug" className="field sm:max-w-xs" />
        <label htmlFor="status" className="sr-only">Status</label>
        <select id="status" name="status" defaultValue={status} className="field sm:max-w-[10rem]"><option value="">All statuses</option><option value="published">Published</option><option value="draft">Draft</option></select>
        <button className="btn-dark" type="submit">Filter</button>
      </form>

      <div className="overflow-x-auto border border-steel-200 bg-white">
        <table className="w-full min-w-[40rem] text-sm">
          <thead className="bg-steel-100 text-left text-xs uppercase tracking-wider text-steel-600"><tr><th className="p-3">Name</th><th className="p-3">Category</th><th className="p-3">Images</th><th className="p-3">Status</th><th className="p-3 text-right">Actions</th></tr></thead>
          <tbody>
            {rows.length === 0 ? <tr><td colSpan={5} className="p-8 text-center text-steel-500">No products found.</td></tr> : rows.map((p) => (
              <tr key={p.id} className="border-t border-steel-200">
                <td className="p-3"><p className="font-semibold">{p.name}</p><p className="text-xs text-steel-500">/{p.slug}{p.is_sample ? " · sample" : ""}{p.is_featured ? " · featured" : ""}</p></td>
                <td className="p-3">{p.categories?.name ?? "—"}</td>
                <td className="p-3">{p.product_images.length}</td>
                <td className="p-3"><StatusBadge status={p.is_published ? "published" : "draft"} /></td>
                <td className="p-3">
                  <div className="flex flex-wrap items-center justify-end gap-3">
                    <Link href={`/admin/products/${p.id}/edit`} className="inline-flex items-center gap-1 text-brand hover:underline"><Pencil className="h-4 w-4" aria-hidden /> Edit</Link>
                    <form action={setProductPublished}>
                      <input type="hidden" name="id" value={p.id} /><input type="hidden" name="publish" value={String(!p.is_published)} /><input type="hidden" name="back" value="/admin/products" />
                      <button type="submit" className="inline-flex items-center gap-1 hover:text-brand">{p.is_published ? <><EyeOff className="h-4 w-4" aria-hidden /> Unpublish</> : <><Eye className="h-4 w-4" aria-hidden /> Publish</>}</button>
                    </form>
                    <ConfirmDialog compact triggerLabel="Delete" title={`Delete ${p.name}?`} description="This permanently deletes the product and its images. This cannot be undone." action={deleteProduct} fields={{ id: p.id }} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={page} totalPages={totalPages} hrefFor={hrefFor} />
    </>
  );
}
