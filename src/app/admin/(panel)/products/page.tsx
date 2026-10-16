import Link from "next/link";
import { requireAdmin } from "@/lib/supabase/auth";
import { ADMIN_PAGE_SIZE, listAdminProducts, listAllCategories } from "@/lib/data/admin";
import PageHeader from "@/components/admin/PageHeader";
import Pagination from "@/components/ui/Pagination";
import ProductsTableClient from "@/components/admin/ProductsTableClient";

type SP = Promise<{ page?: string; q?: string; status?: string; deleted?: string; error?: string }>;

export default async function AdminProducts({ searchParams }: { searchParams: SP }) {
  await requireAdmin();
  const sp = await searchParams;
  const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);
  const q = sp.q ?? "";
  const status = sp.status ?? "";

  const [{ rows, total }, categories] = await Promise.all([
    listAdminProducts(page, q, status),
    listAllCategories(),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE));
  const hrefFor = (p: number) =>
    `/admin/products?${new URLSearchParams({ ...(q && { q }), ...(status && { status }), page: String(p) })}`;

  return (
    <>
      <PageHeader
        title="Products"
        description={`${total} total`}
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/admin/products/new"
              className="btn-outline !py-2 text-xs"
              title="Open full page product creator"
            >
              Full Page Editor
            </Link>
          </div>
        }
      />

      <form className="mb-4 flex flex-col gap-3 sm:flex-row" role="search">
        <label htmlFor="q" className="sr-only">
          Search
        </label>
        <input
          id="q"
          name="q"
          defaultValue={q}
          placeholder="Search name or slug"
          className="field sm:max-w-xs"
        />
        <label htmlFor="status" className="sr-only">
          Status
        </label>
        <select
          id="status"
          name="status"
          defaultValue={status}
          className="field sm:max-w-[10rem]"
        >
          <option value="">All statuses</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>
        <button className="btn-dark" type="submit">
          Filter
        </button>
      </form>

      <ProductsTableClient products={rows} categories={categories} />

      <Pagination page={page} totalPages={totalPages} hrefFor={hrefFor} />
    </>
  );
}
