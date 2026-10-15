import Link from "next/link";
import type { Metadata } from "next";
import { Search } from "lucide-react";
import { PAGE_SIZE, getCategories, getProducts } from "@/lib/data/public";
import { buildMetadata } from "@/lib/seo/metadata";
import ProductCard from "@/components/products/ProductCard";
import Pagination from "@/components/ui/Pagination";
import Breadcrumbs from "@/components/ui/Breadcrumbs";

type SP = Promise<{ category?: string; q?: string; page?: string }>;

export async function generateMetadata({ searchParams }: { searchParams: SP }): Promise<Metadata> {
  const { category, q, page } = await searchParams;
  const filtered = Boolean(category || q || (page && page !== "1"));
  return {
    ...buildMetadata({
      title: "Industrial Steel Products",
      description: "Wheelbarrows, gas trolleys, pallet trolleys, lifting cages, concrete buckets, waste bins and custom steel fabrication from Ajman, UAE.",
      path: "/products",
    }),
    robots: filtered ? { index: false, follow: true } : undefined,
  };
}

export default async function ProductsPage({ searchParams }: { searchParams: SP }) {
  const { category, q, page: pageParam } = await searchParams;
  const page = Math.max(1, Number.parseInt(pageParam ?? "1", 10) || 1);
  const [categories, result] = await Promise.all([getCategories(), getProducts({ category, q, page })]);
  const totalPages = Math.max(1, Math.ceil(result.total / PAGE_SIZE));
  const hrefFor = (p: number) => {
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (q) params.set("q", q);
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return qs ? `/products?${qs}` : "/products";
  };
  const chip = (active: boolean) => `inline-flex min-h-10 items-center border px-4 text-sm font-medium transition-colors ${active ? "border-brand bg-brand text-white" : "border-steel-300 bg-white text-steel-800 hover:border-brand hover:text-brand"}`;

  return (
    <>
      <section className="border-b border-steel-200 bg-steel-50">
        <div className="container-page py-10">
          <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Products" }]} />
          <h1 className="mt-4 text-3xl sm:text-4xl">Industrial Steel Products</h1>
          <p className="mt-2 max-w-2xl text-steel-600">Browse our steel products. Need something specific? Send an inquiry and we will get back to you.</p>
        </div>
      </section>

      <div className="container-page py-10">
        <form action="/products" method="get" role="search" className="flex flex-col gap-3 sm:flex-row">
          {category ? <input type="hidden" name="category" value={category} /> : null}
          <label htmlFor="q" className="sr-only">Search products</label>
          <input id="q" name="q" type="search" defaultValue={q} placeholder="Search products" className="field sm:max-w-md" />
          <button type="submit" className="btn-dark"><Search className="h-4 w-4" aria-hidden /> Search</button>
        </form>

        <nav aria-label="Product categories" className="mt-5 flex flex-wrap gap-2">
          <Link href={q ? `/products?q=${encodeURIComponent(q)}` : "/products"} className={chip(!category)} aria-current={!category ? "page" : undefined}>All</Link>
          {categories.map((c) => (
            <Link key={c.id} href={`/products?category=${c.slug}${q ? `&q=${encodeURIComponent(q)}` : ""}`} className={chip(category === c.slug)} aria-current={category === c.slug ? "page" : undefined}>{c.name}</Link>
          ))}
        </nav>

        <div className="mt-8" aria-live="polite">
          {result.failed ? (
            <div className="border border-red-300 bg-red-50 p-6 text-sm text-red-800" role="alert">We could not load the products right now. Please refresh, or contact us directly.</div>
          ) : result.items.length === 0 ? (
            <div className="border border-dashed border-steel-300 p-10 text-center">
              <p className="text-lg font-semibold">No products found</p>
              <p className="mt-1 text-sm text-steel-600">{q || category ? "Try a different search or category." : "Products will appear here once they are published."}</p>
              {q || category ? <Link href="/products" className="btn-outline mt-5">Clear filters</Link> : null}
            </div>
          ) : (
            <>
              <p className="mb-4 text-sm text-steel-600">{result.total} product{result.total === 1 ? "" : "s"}</p>
              <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {result.items.map((p) => (<li key={p.id}><ProductCard product={p} /></li>))}
              </ul>
              <Pagination page={page} totalPages={totalPages} hrefFor={hrefFor} />
            </>
          )}
        </div>
      </div>
    </>
  );
}
