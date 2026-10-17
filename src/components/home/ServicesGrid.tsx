import Link from "next/link";
import { ArrowRight } from "lucide-react";
import CloudImage from "@/components/ui/CloudImage";
import ServiceIcon from "@/components/ui/ServiceIcon";
import type { ServiceCard } from "@/lib/data/public-types";

export default function ServicesGrid({ services }: { services: ServiceCard[] }) {
  if (services.length === 0) return null;

  return (
    <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {services.map((s) => {
        const hasImage = Boolean(s.image_public_id);

        return (
          <li
            key={s.id}
            className="card flex flex-col overflow-hidden transition-all duration-300 hover:border-brand/40 hover:shadow-md"
          >
            <Link
              href={`/services/${s.slug}`}
              className="group flex h-full flex-col focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-2"
              aria-label={`${s.title} - Learn more`}
            >
              {/* Card Image Header with consistent aspect ratio */}
              <div className="relative aspect-[16/10] w-full overflow-hidden bg-steel-100">
                {hasImage ? (
                  <>
                    <CloudImage
                      publicId={s.image_public_id!}
                      alt={s.image_alt || s.title}
                      preset="card"
                      sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                      className="object-cover transition-transform duration-500 ease-out group-hover:scale-105 motion-reduce:transform-none"
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
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-steel-950/60 via-transparent to-transparent" />
                  </>
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
              </div>

              {/* Card Body */}
              <div className="flex flex-1 flex-col justify-between p-6 bg-white">
                <div>
                  <h3 className="text-xl font-bold tracking-tight text-steel-900 transition-colors group-hover:text-brand line-clamp-2">
                    {s.title}
                  </h3>
                  {s.short_description ? (
                    <p className="mt-2.5 text-sm leading-relaxed text-steel-600 line-clamp-3">
                      {s.short_description}
                    </p>
                  ) : null}
                </div>

                <div className="mt-6 pt-4 border-t border-steel-100 flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand transition-colors group-hover:text-brand-deep">
                    Learn more
                    <ArrowRight
                      className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1 motion-reduce:transform-none"
                      aria-hidden="true"
                    />
                  </span>
                </div>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

