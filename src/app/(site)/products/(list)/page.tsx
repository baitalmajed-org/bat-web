import Link from "next/link";
import type { Metadata } from "next";
import { Search } from "lucide-react";
import { PAGE_SIZE, getCategories, getProducts } from "@/lib/data/public";
import { buildMetadata } from "@/lib/seo/metadata";
import { breadcrumbJsonLd, jsonLdString } from "@/lib/seo/jsonld";
import ProductCard from "@/components/products/ProductCard";
import Pagination from "@/components/ui/Pagination";
import CategoryFilterBar from "@/components/products/CategoryFilterBar";
import Breadcrumbs from "@/components/ui/Breadcrumbs";

type SP = Promise<{ category?: string; q?: string; page?: string }>;

const CATEGORY_SEO_MAP: Record<string, { title: string; desc: string; h1: string }> = {
  wheelbarrows: {
    title: "Welded Wheelbarrow Manufacturer UAE | Heavy-Duty Construction Wheelbarrows",
    desc: "Heavy-duty welded steel wheelbarrows manufactured by Bait Al Majed Metal Works in Ajman, UAE. Built for construction sites, masonry contractors, and bulk supply across Dubai, Sharjah and UAE.",
    h1: "Heavy-Duty Welded Wheelbarrow Manufacturer in UAE",
  },
  "gas-trolleys": {
    title: "Gas Cylinder Trolley Manufacturer UAE | Heavy-Duty Oxygen & LPG Trolleys",
    desc: "Single and double gas cylinder trolleys fabricated in Ajman, UAE for industrial welding, oxygen, and LPG bottle transport across UAE job sites.",
    h1: "Industrial Gas Cylinder Trolleys Manufacturer UAE",
  },
  "lifting-cages": {
    title: "Construction Lifting Cage Manufacturer UAE | Crane Hoisting Cages",
    desc: "Heavy-duty steel material lifting cages and crane hoisting baskets manufactured in Ajman, UAE for block, brick, and site material handling.",
    h1: "Construction Material Lifting Cage Manufacturer UAE",
  },
  "concrete-buckets": {
    title: "Steel Concrete Bucket Manufacturer UAE | Crane Pouring Skips",
    desc: "Crane concrete pouring buckets and discharge skips fabricated in Ajman, UAE for controlled concrete placement on commercial construction sites.",
    h1: "Steel Concrete Bucket Manufacturer UAE",
  },
  "pallet-trolleys": {
    title: "Pallet & Platform Trolleys Manufacturer UAE | Material Handling Ajman",
    desc: "Heavy-duty steel platform and pallet trolleys for warehouses, workshops, and construction material handling across the United Arab Emirates.",
    h1: "Industrial Platform & Pallet Trolley Manufacturer UAE",
  },
  "waste-bins": {
    title: "Steel Waste Bins & Scrap Containers Manufacturer UAE | Ajman",
    desc: "Heavy-duty industrial steel waste bins and construction site scrap containers fabricated to standard and custom sizes in Ajman, UAE.",
    h1: "Heavy-Duty Steel Waste Bins Manufacturer UAE",
  },
  "custom-fabrication": {
    title: "Custom Steel Products Manufacturer UAE | Industrial Metal Fabrication",
    desc: "Custom steel fabrication and made-to-order industrial steel products manufactured to client drawings in Ajman, UAE with prompt delivery.",
    h1: "Custom Steel Products & Metal Fabrication UAE",
  },
};

export async function generateMetadata({ searchParams }: { searchParams: SP }): Promise<Metadata> {
  const { category, q, page } = await searchParams;
  const filtered = Boolean(category || q || (page && page !== "1"));

  const matchedCat = category ? CATEGORY_SEO_MAP[category] : null;
  const title = matchedCat
    ? matchedCat.title
    : "Construction Equipment & Steel Products Manufacturer UAE | Bait Al Majed";
  const description = matchedCat
    ? matchedCat.desc
    : "Explore industrial construction equipment manufactured by Bait Al Majed Metal Works in Ajman, UAE: welded wheelbarrows, gas cylinder trolleys, crane lifting cages, concrete buckets, and custom steel products.";

  return {
    ...buildMetadata({
      title,
      description,
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

  const matchedCat = category ? CATEGORY_SEO_MAP[category] : null;
  const displayH1 = matchedCat
    ? matchedCat.h1
    : "Industrial Steel & Construction Equipment Manufacturer UAE";
  const displayIntro = matchedCat
    ? matchedCat.desc
    : "Heavy-duty welded wheelbarrows, gas cylinder trolleys, crane material lifting cages, concrete buckets, and custom steel products manufactured in Ajman for contractors across Dubai, Sharjah, Abu Dhabi, and the UAE.";

  const breadcrumbs = [
    { name: "Home", href: "/" },
    { name: "Products", href: "/products" },
    ...(category && matchedCat ? [{ name: matchedCat.h1 }] : []),
  ];

  const breadcrumbsLd = breadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "Products", path: "/products" },
    ...(category && matchedCat ? [{ name: matchedCat.h1, path: `/products?category=${category}` }] : []),
  ]);

  return (
    <>
      <section className="border-b border-steel-200 bg-steel-50">
        <div className="container-page py-10">
          <Breadcrumbs items={breadcrumbs} />
          <h1 className="mt-4 text-3xl sm:text-4xl">{displayH1}</h1>
          <p className="mt-2 max-w-3xl text-steel-600">{displayIntro}</p>
        </div>
      </section>

      <div className="container-page py-8 sm:py-10">
        <form action="/products" method="get" role="search" className="flex items-center gap-2 max-w-xl">
          {category ? <input type="hidden" name="category" value={category} /> : null}
          <label htmlFor="q" className="sr-only">Search products</label>
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-steel-400 pointer-events-none" aria-hidden="true" />
            <input
              id="q"
              name="q"
              type="search"
              defaultValue={q}
              placeholder="Search products..."
              className="w-full h-11 pl-10 pr-4 text-sm rounded-lg sm:rounded-md border border-steel-300 bg-white placeholder:text-steel-400 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand shadow-xs transition-colors"
            />
          </div>
          <button
            type="submit"
            className="inline-flex h-11 items-center justify-center gap-2 px-5 rounded-lg sm:rounded-md bg-steel-900 text-white text-sm font-semibold hover:bg-steel-800 transition-colors shadow-xs shrink-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-steel-900"
          >
            <span>Search</span>
          </button>
        </form>

        <CategoryFilterBar categories={categories} activeCategory={category} searchQuery={q} />

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
              <ul className="grid grid-cols-2 gap-3 sm:gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {result.items.map((p) => (<li key={p.id} className="h-full"><ProductCard product={p} /></li>))}
              </ul>
              <Pagination page={page} totalPages={totalPages} hrefFor={hrefFor} />
            </>
          )}
        </div>
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(breadcrumbsLd) }} />
    </>
  );
}
