import Link from "next/link";
import { ArrowRight } from "lucide-react";
import ServiceIcon from "@/components/ui/ServiceIcon";
import type { ServiceCard } from "@/lib/data/public-types";

export default function ServicesGrid({ services }: { services: ServiceCard[] }) {
  if (services.length === 0) return null;
  return (
    <ul className="grid gap-px border border-steel-200 bg-steel-200 sm:grid-cols-2 lg:grid-cols-3">
      {services.map((s) => (
        <li key={s.id} className="bg-white">
          <Link href={`/services/${s.slug}`} className="group flex h-full flex-col gap-3 p-6 transition-colors hover:bg-brand-50">
            <span className="text-brand"><ServiceIcon name={s.icon} /></span>
            <h3 className="text-lg group-hover:text-brand">{s.title}</h3>
            {s.short_description ? <p className="text-sm text-steel-600">{s.short_description}</p> : null}
            <span className="mt-auto inline-flex items-center gap-1 pt-2 text-sm font-semibold text-brand">Learn more <ArrowRight className="h-4 w-4" aria-hidden /></span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
