import { HardHat, Phone, Settings2, ShieldCheck } from "lucide-react";
import CloudImage from "@/components/ui/CloudImage";
import WhatsAppIcon from "@/components/ui/WhatsAppIcon";
import type { HomepageSection, SiteSettings } from "@/types/db";
import Link from "next/link";
import { telHref, whatsappHref } from "@/lib/config/site";

const ICONS = [ShieldCheck, Settings2, HardHat];

export function CtaLink({ href, label, settings, variant }: { href: string | null; label: string | null; settings: SiteSettings; variant: "primary" | "secondary" }) {
  if (!label || !href) return null;
  const cls = variant === "primary" ? "btn-primary" : "btn-light";
  if (href === "whatsapp") return <a href={whatsappHref(settings.whatsapp_number)} target="_blank" rel="noopener noreferrer" className={cls}><WhatsAppIcon className="h-4 w-4" /> {label}</a>;
  if (href === "tel") return <a href={telHref(settings.main_phone)} className={cls}><Phone className="h-4 w-4" aria-hidden /> {label}</a>;
  if (href.startsWith("/")) return <Link href={href} className={cls}>{label}</Link>;
  return <a href={href} className={cls} {...(href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}>{label}</a>;
}

export default function Hero({ section, settings }: { section: HomepageSection; settings: SiteSettings }) {
  const hasTopBar = settings?.top_contact_bar_enabled !== false && settings?.top_bar_enabled !== false;
  const viewportHeightCls = hasTopBar
    ? "min-h-[calc(100svh-5.75rem)] sm:min-h-[calc(100svh-6.5rem)] lg:h-[calc(100svh-7rem)] lg:min-h-[29rem]"
    : "min-h-[calc(100svh-4rem)] sm:min-h-[calc(100svh-4.5rem)] lg:h-[calc(100svh-5rem)] lg:min-h-[29rem]";

  const desktopId = section.image_public_id;
  const mobileId = section.mobile_image_public_id;
  const defaultAlt = section.heading || "Bait Al Majed Metal Works industrial steel fabrication";
  const desktopAlt = section.image_alt || defaultAlt;
  const mobileAlt = section.mobile_image_alt || section.image_alt || defaultAlt;

  return (
    <section
      className={`relative isolate flex items-center overflow-hidden border-b border-steel-800 bg-steel-900 text-white ${viewportHeightCls}`}
    >
      {desktopId && mobileId ? (
        <>
          <div className="absolute inset-0 md:hidden">
            <CloudImage
              publicId={mobileId}
              alt={mobileAlt}
              preset="hero_mobile"
              sizes="100vw"
              priority
              className="object-cover object-center"
            />
          </div>
          <div className="absolute inset-0 hidden md:block">
            <CloudImage
              publicId={desktopId}
              alt={desktopAlt}
              preset="hero"
              sizes="100vw"
              priority
              className="object-cover object-center"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-steel-900/95 via-steel-900/80 to-steel-900/40 md:from-steel-900 md:via-steel-900/85 md:to-steel-900/30" aria-hidden />
        </>
      ) : desktopId ? (
        <>
          <CloudImage
            publicId={desktopId}
            alt={desktopAlt}
            preset="hero"
            sizes="100vw"
            priority
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-steel-900/95 via-steel-900/80 to-steel-900/40 md:from-steel-900 md:via-steel-900/85 md:to-steel-900/30" aria-hidden />
        </>
      ) : mobileId ? (
        <>
          <div className="absolute inset-0 md:hidden">
            <CloudImage
              publicId={mobileId}
              alt={mobileAlt}
              preset="hero_mobile"
              sizes="100vw"
              priority
              className="object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-steel-900/95 via-steel-900/80 to-steel-900/40" aria-hidden />
          </div>
          <div className="steel-pattern absolute inset-0 hidden md:block" aria-hidden />
        </>
      ) : (
        <div className="steel-pattern absolute inset-0" aria-hidden />
      )}
      <div className="container-page relative pt-6 pb-8 sm:py-10 lg:py-10">
        <div className="max-w-2xl motion-safe:animate-[fadeUp_0.6s_ease-out]">
          {section.eyebrow ? <p className="mb-2.5 text-xs font-semibold uppercase tracking-[0.2em] text-steel-300">{section.eyebrow}</p> : null}
          <h1 className="text-3xl !text-white sm:text-4xl lg:text-5xl xl:text-[3.25rem] leading-[1.12]">{section.heading}</h1>
          {section.body ? <p className="mt-3.5 max-w-xl text-base text-steel-200 sm:text-lg leading-relaxed">{section.body}</p> : null}
          <div className="mt-6 flex flex-wrap gap-3">
            <CtaLink href={section.primary_cta_href} label={section.primary_cta_label} settings={settings} variant="primary" />
            <CtaLink href={section.secondary_cta_href} label={section.secondary_cta_label} settings={settings} variant="secondary" />
          </div>
          {(section.items?.length ?? 0) > 0 ? (
            <ul className="mt-6 flex flex-wrap gap-x-8 gap-y-3 text-sm">
              {(section.items || []).map((it, i) => {
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
