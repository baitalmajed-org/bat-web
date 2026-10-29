import Link from "next/link";
import { ArrowRight } from "lucide-react";
import ProductCarousel from "@/components/home/ProductCarousel";
import CloudImage from "@/components/ui/CloudImage";
import ServiceIcon from "@/components/ui/ServiceIcon";
import type { ServiceCard } from "@/lib/data/public-types";

export default function ServicesGrid({
  services,
  sizes = "(min-width:1024px) 296px, (min-width:640px) 272px, 78vw",
}: {
  services: ServiceCard[];
  sizes?: string;
}) {
  if (services.length === 0) return null;

  return (
    <ProductCarousel label="Our services">
      {services.map((s) => {
        const hasImage = Boolean(s.image_public_id);

        return (
          <article
            key={s.id}
            className="card group flex h-full flex-col transition-shadow hover:shadow-md"
          >
            {/* Card Image Header matching ProductCard aspect ratio and size */}
            <Link
              href={`/services/${s.slug}`}
              className="relative block aspect-[4/3] overflow-hidden bg-steel-100"
              tabIndex={-1}
              aria-hidden
            >
              {hasImage ? (
                <CloudImage
                  publicId={s.image_public_id!}
                  alt={s.image_alt || s.title}
                  preset="card"
                  sizes={sizes}
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  fallback={
                    <div className="steel-pattern flex h-full w-full flex-col items-center justify-center gap-2 text-steel-300">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-50/10 border border-brand-500/30 text-brand-soft">
                        <ServiceIcon name={s.icon} className="h-6 w-6" />
                      </div>
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-steel-400">
                        BAM Metal Works
                      </span>
                    </div>
                  }
                />
              ) : (
                <div className="steel-pattern relative flex h-full w-full flex-col items-center justify-center overflow-hidden border-b border-steel-200 text-steel-300">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-50/10 border border-brand-500/30 text-brand-soft shadow-sm transition-transform duration-300 group-hover:scale-110 motion-reduce:transform-none">
                    <ServiceIcon name={s.icon} className="h-7 w-7 text-brand-soft" />
                  </div>
                  <span className="mt-2 text-[11px] font-semibold uppercase tracking-wider text-steel-400">
                    BAM Metal Works
                  </span>
                </div>
              )}
            </Link>

            {/* Card Body matching ProductCard spacing and typography */}
            <div className="flex flex-1 flex-col p-2.5 sm:p-4">
              <h3 className="mt-1 text-sm sm:text-lg font-bold line-clamp-2 leading-snug">
                <Link href={`/services/${s.slug}`} className="hover:text-brand">
                  {s.title}
                </Link>
              </h3>
              {s.short_description ? (
                <p className="hidden sm:block mt-2 line-clamp-3 text-sm text-steel-600">
                  {s.short_description}
                </p>
              ) : null}
              <div className="mt-auto flex items-center justify-between gap-1.5 pt-3 sm:pt-4 text-xs sm:text-sm font-semibold">
                <Link
                  href={`/services/${s.slug}`}
                  className="inline-flex items-center gap-0.5 sm:gap-1 text-brand hover:underline truncate"
                >
                  <span>Learn more</span>
                  <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" aria-hidden />
                </Link>
                <Link
                  href={`/services/${s.slug}#enquire`}
                  className="text-steel-700 hover:text-brand shrink-0"
                >
                  Enquire
                </Link>
              </div>
            </div>
          </article>
        );
      })}
    </ProductCarousel>
  );
}
