import Link from "next/link";
import { requireAdmin } from "@/lib/supabase/auth";
import { listAllCategories } from "@/lib/data/admin";
import { deleteCategory } from "@/app/admin/actions/categories";
import PageHeader from "@/components/admin/PageHeader";
import CategoryForm from "@/components/admin/CategoryForm";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import StatusBadge from "@/components/admin/StatusBadge";

type SP = Promise<{ edit?: string; created?: string; deleted?: string; error?: string; n?: string }>;

export default async function AdminCategories({ searchParams }: { searchParams: SP }) {
  await requireAdmin();
  const sp = await searchParams;
  const categories = await listAllCategories();
  const editing = sp.edit ? categories.find((c) => c.id === sp.edit) ?? null : null;
  const errorText: Record<string, string> = {
    in_use: `That category still has ${sp.n ?? "some"} product(s). Choose another category to move them to, then delete.`,
    move: "The products could not be moved, so nothing was deleted.",
    delete: "The category could not be deleted.",
  };

  return (
    <>
      <PageHeader title="Categories" description="Organise products for the catalog filters." />
      {sp.created ? <p role="status" className="mb-4 border border-green-300 bg-green-50 p-3 text-sm text-green-800">Category created.</p> : null}
      {sp.deleted ? <p role="status" className="mb-4 border border-green-300 bg-green-50 p-3 text-sm text-green-800">Category deleted.</p> : null}
      {sp.error ? <p role="alert" className="mb-4 border border-red-300 bg-red-50 p-3 text-sm text-red-800">{errorText[sp.error] ?? "Something went wrong."}</p> : null}

      <div className="grid gap-8 lg:grid-cols-5">
        <div className="overflow-x-auto border border-steel-200 bg-white lg:col-span-3">
          <table className="w-full min-w-[28rem] text-sm">
            <thead className="bg-steel-100 text-left text-xs uppercase tracking-wider text-steel-600"><tr><th className="p-3">Name</th><th className="p-3">Products</th><th className="p-3">Status</th><th className="p-3 text-right">Actions</th></tr></thead>
            <tbody>
              {categories.map((c) => (
                <tr key={c.id} className="border-t border-steel-200">
                  <td className="p-3"><p className="font-semibold">{c.name}</p><p className="text-xs text-steel-500">/{c.slug} · order {c.sort_order}</p></td>
                  <td className="p-3">{c.product_count}</td>
                  <td className="p-3"><StatusBadge status={c.is_active ? "active" : "inactive"} /></td>
                  <td className="p-3"><div className="flex items-center justify-end gap-3">
                    <Link href={`/admin/categories?edit=${c.id}`} className="text-brand hover:underline">Edit</Link>
                    <ConfirmDialog compact triggerLabel="Delete" title={`Delete ${c.name}?`} description={c.product_count > 0 ? `This category has ${c.product_count} product(s). Choose where to move them.` : "This cannot be undone."} action={deleteCategory} fields={{ id: c.id }}>
                      {c.product_count > 0 ? (
                        <div><label htmlFor={`move-${c.id}`} className="label">Move products to</label>
                          <select id={`move-${c.id}`} name="moveTo" required className="field"><option value="">Choose a category</option>{categories.filter((o) => o.id !== c.id).map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}</select></div>
                      ) : null}
                    </ConfirmDialog>
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <section className="border border-steel-200 bg-white p-5 lg:col-span-2" aria-labelledby="cat-form">
          <h2 id="cat-form" className="mb-4 text-lg">{editing ? `Edit ${editing.name}` : "New category"}</h2>
          <CategoryForm key={editing?.id ?? "new"} category={editing} />
          {editing ? <Link href="/admin/categories" className="mt-4 inline-block text-sm text-brand hover:underline">Cancel editing</Link> : null}
        </section>
      </div>
    </>
  );
}
