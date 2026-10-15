import CloudImage from "@/components/ui/CloudImage";
import type { HomepageSection, SiteSettings } from "@/types/db";
import { CtaLink } from "./Hero";

export default function ContactCta({ section, settings }: { section: HomepageSection; settings: SiteSettings }) {
  return (
    <section className="relative isolate overflow-hidden bg-steel-900 text-white">
      {section.image_public_id ? (
        <>
          <CloudImage publicId={section.image_public_id} alt={section.image_alt ?? ""} preset="hero" sizes="100vw" />
          <div className="absolute inset-0 bg-steel-900/80" aria-hidden />
        </>
      ) : <div className="steel-pattern absolute inset-0" aria-hidden />}
      <div className="container-page relative py-16">
        <div className="max-w-2xl">
          {section.eyebrow ? <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-steel-300">{section.eyebrow}</p> : null}
          <h2 className="text-3xl !text-white sm:text-4xl">{section.heading}</h2>
          {section.body ? <p className="mt-4 text-steel-200">{section.body}</p> : null}
          <div className="mt-7 flex flex-wrap gap-3">
            <CtaLink href={section.primary_cta_href} label={section.primary_cta_label} settings={settings} variant="primary" />
            <CtaLink href={section.secondary_cta_href} label={section.secondary_cta_label} settings={settings} variant="secondary" />
          </div>
        </div>
      </div>
    </section>
  );
}
