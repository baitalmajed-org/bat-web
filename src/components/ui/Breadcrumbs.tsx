import Link from "next/link";
import { ChevronRight } from "lucide-react";

export default function Breadcrumbs({ items }: { items: { name: string; href?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-sm text-steel-600">
      <ol className="flex flex-wrap items-center gap-1">
        {items.map((it, i) => (
          <li key={it.name} className="flex items-center gap-1">
            {i > 0 ? <ChevronRight className="h-3.5 w-3.5" aria-hidden /> : null}
            {it.href ? <Link href={it.href} className="hover:text-brand">{it.name}</Link> : <span aria-current="page" className="font-medium text-steel-900">{it.name}</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}
