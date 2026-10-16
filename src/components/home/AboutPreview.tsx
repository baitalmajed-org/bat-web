import Link from "next/link";
import { ArrowRight } from "lucide-react";
import CloudImage from "@/components/ui/CloudImage";
import Placeholder from "@/components/ui/Placeholder";
import type { HomepageSection } from "@/types/db";

export default function AboutPreview({ section }: { section: HomepageSection }) {
  return (
    <section className="border-y border-steel-200/60 bg-white">
      <div className="container-page grid items-center gap-10 py-16 lg:grid-cols-2">
        <div className="relative aspect-[4/3] overflow-hidden border border-steel-200 bg-steel-100 shadow-sm">
          {section.image_public_id ? <CloudImage publicId={section.image_public_id} alt={section.image_alt || section.heading || "About Bait Al Majed Metal Works workshop"} preset="about" sizes="(min-width:1024px) 50vw, 100vw" /> : <Placeholder label={section.heading ?? "About Bait Al Majed Metal Works"} />}
        </div>
        <div>
          {section.eyebrow ? <p className="eyebrow mb-3">{section.eyebrow}</p> : null}
          <h2 className="text-3xl sm:text-4xl">{section.heading}</h2>
          {section.body ? <p className="mt-4 text-steel-700">{section.body}</p> : null}
          {section.primary_cta_label && section.primary_cta_href ? (
            <Link href={section.primary_cta_href} className="btn-primary mt-6">{section.primary_cta_label} <ArrowRight className="h-4 w-4" aria-hidden /></Link>
          ) : null}
        </div>
      </div>
    </section>
  );
}
