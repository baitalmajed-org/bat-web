import Link from "next/link";
import { ArrowRight } from "lucide-react";
import CloudImage from "@/components/ui/CloudImage";
import Placeholder from "@/components/ui/Placeholder";
import type { ProductCard as ProductCardData } from "@/lib/data/public-types";

export default function ProductCard({ product, sizes = "(min-width:1024px) 25vw, (min-width:640px) 50vw, 45vw" }: { product: ProductCardData; sizes?: string }) {
  const image = [...product.product_images].sort((a, b) => a.sort_order - b.sort_order)[0];
  return (
    <article className="card group flex h-full flex-col transition-shadow hover:shadow-md">
      <Link href={`/products/${product.slug}`} className="relative block aspect-[4/3] overflow-hidden bg-steel-100" tabIndex={-1} aria-hidden>
        {image ? (
          <CloudImage publicId={image.public_id} alt={image.alt_text || product.name} preset="card" sizes={sizes} className="object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <Placeholder label={product.name} />
        )}
        {product.is_featured ? <span className="absolute left-0 top-2 sm:top-3 bg-brand px-2 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-white">Featured</span> : null}
      </Link>
      <div className="flex flex-1 flex-col p-2.5 sm:p-4">
        {product.categories ? <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-steel-500 truncate">{product.categories.name}</p> : null}
        <h3 className="mt-1 text-sm sm:text-lg font-bold line-clamp-2 leading-snug">
          <Link href={`/products/${product.slug}`} className="hover:text-brand">{product.name}</Link>
        </h3>
        {product.short_description ? <p className="hidden sm:block mt-2 line-clamp-3 text-sm text-steel-600">{product.short_description}</p> : null}
        <div className="mt-auto flex items-center justify-between gap-1.5 pt-3 sm:pt-4 text-xs sm:text-sm font-semibold">
          <Link href={`/products/${product.slug}`} className="inline-flex items-center gap-0.5 sm:gap-1 text-brand hover:underline truncate">
            <span>View details</span>
            <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" aria-hidden />
          </Link>
          <Link href={`/products/${product.slug}#enquire`} className="text-steel-700 hover:text-brand shrink-0">Enquire</Link>
        </div>
      </div>
    </article>
  );
}
