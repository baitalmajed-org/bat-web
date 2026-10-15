import { Award, Factory, ShieldCheck, Users } from "lucide-react";
import type { HomepageItem } from "@/types/db";

const ICONS = [Factory, Users, ShieldCheck, Award];

export default function TrustBar({ items }: { items: HomepageItem[] }) {
  if (items.length === 0) return null;
  return (
    <section aria-label="Company strengths" className="steel-pattern border-y border-steel-800 text-white">
      <ul className="container-page grid gap-6 py-10 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((it, i) => {
          const Icon = ICONS[i % ICONS.length] ?? Factory;
          return (
            <li key={it.title} className="flex items-center gap-4 border-steel-800/80 py-2 sm:border-r sm:last:border-r-0 sm:pr-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center border border-white/10 bg-white/5">
                <Icon className="h-6 w-6 text-brand-soft" aria-hidden />
              </div>
              <div><p className="font-semibold text-white">{it.title}</p>{it.text ? <p className="text-sm text-steel-300">{it.text}</p> : null}</div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
