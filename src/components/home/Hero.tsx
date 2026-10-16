import { HardHat, MessageCircle, Phone, Settings2, ShieldCheck } from "lucide-react";
import CloudImage from "@/components/ui/CloudImage";
import type { HomepageSection, SiteSettings } from "@/types/db";
import Link from "next/link";
import { telHref, whatsappHref } from "@/lib/config/site";

const ICONS = [ShieldCheck, Settings2, HardHat];

export function CtaLink({ href, label, settings, variant }: { href: string | null; label: string | null; settings: SiteSettings; variant: "primary" | "secondary" }) {
  if (!label || !href) return null;
  const cls = variant === "primary" ? "btn-primary" : "btn-light";
  if (href === "whatsapp") return <a href={whatsappHref(settings.whatsapp_number)} target="_blank" rel="noopener noreferrer" className={cls}><MessageCircle className="h-4 w-4" aria-hidden /> {label}</a>;
  if (href === "tel") return <a href={telHref(settings.main_phone)} className={cls}><Phone className="h-4 w-4" aria-hidden /> {label}</a>;
  if (href.startsWith("/")) return <Link href={href} className={cls}>{label}</Link>;
  return <a href={href} className={cls} {...(href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}>{label}</a>;
}

export default function Hero({ section, settings }: { section: HomepageSection; settings: SiteSettings }) {
  return (
    <section className="relative isolate overflow-hidden border-b border-steel-800 bg-steel-900 text-white">
      {section.image_public_id ? (
        <>
          <CloudImage publicId={section.image_public_id} alt={section.image_alt || section.heading || "Bait Al Majed Metal Works industrial steel fabrication"} preset="hero" sizes="100vw" priority />
          <div className="absolute inset-0 bg-gradient-to-r from-steel-900 via-steel-900/85 to-steel-900/30" aria-hidden />
        </>
      ) : (
        <div className="steel-pattern absolute inset-0" aria-hidden />
      )}
      <div className="container-page relative py-16 sm:py-24 lg:py-32">
        <div className="max-w-2xl motion-safe:animate-[fadeUp_0.6s_ease-out]">
          {section.eyebrow ? <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-steel-300">{section.eyebrow}</p> : null}
          <h1 className="text-4xl !text-white sm:text-5xl lg:text-6xl">{section.heading}</h1>
          {section.body ? <p className="mt-5 max-w-xl text-base text-steel-200 sm:text-lg">{section.body}</p> : null}
          <div className="mt-8 flex flex-wrap gap-3">
            <CtaLink href={section.primary_cta_href} label={section.primary_cta_label} settings={settings} variant="primary" />
            <CtaLink href={section.secondary_cta_href} label={section.secondary_cta_label} settings={settings} variant="secondary" />
          </div>
          {section.items.length > 0 ? (
            <ul className="mt-10 flex flex-wrap gap-x-8 gap-y-4 text-sm">
              {section.items.map((it, i) => {
                const Icon = ICONS[i % ICONS.length] ?? ShieldCheck;
                return <li key={it.title} className="flex items-center gap-2 text-steel-200"><Icon className="h-5 w-5 text-white" aria-hidden />{it.title}</li>;
              })}
            </ul>
          ) : null}
        </div>
      </div>
    </section>
  );
}
