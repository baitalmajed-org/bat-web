import { Award, Factory, ShieldCheck, Users } from "lucide-react";
import type { HomepageItem } from "@/types/db";

const ICONS = [Factory, Users, ShieldCheck, Award];

export default function TrustBar({ items }: { items: HomepageItem[] }) {
  if (items.length === 0) return null;
  return (
    <section aria-label="Company strengths" className="steel-pattern text-white">
      <ul className="container-page grid gap-6 py-10 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((it, i) => {
          const Icon = ICONS[i % ICONS.length] ?? Factory;
          return (
            <li key={it.title} className="flex items-center gap-4">
              <Icon className="h-9 w-9 shrink-0 text-white/90" aria-hidden />
              <div><p className="font-semibold">{it.title}</p>{it.text ? <p className="text-sm text-steel-300">{it.text}</p> : null}</div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
