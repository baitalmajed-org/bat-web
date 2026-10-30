import Image from "next/image";
import Link from "next/link";
import CloudImage from "@/components/ui/CloudImage";
import WhatsAppIcon from "@/components/ui/WhatsAppIcon";
import { telHref, whatsappHref } from "@/lib/config/site";
import type { HomepageSection, SiteSettings } from "@/types/db";

export default function ContactCta({ section, settings }: { section: HomepageSection; settings: SiteSettings }) {
  const hasCloudImage = Boolean(section.image_public_id);
  const secondaryHref = section.secondary_cta_href || "/contact";
  const isSecondaryTel = secondaryHref === "tel";
  const isSecondaryExternal = secondaryHref.startsWith("http");

  return (
    <section
      className="relative isolate overflow-hidden border-t-2 border-brand border-b border-steel-800 bg-[#3D0C18] text-white"
      aria-labelledby="contact-cta-heading"
    >
      {/* Background rich dark burgundy gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#2c0812] via-[#3D0C18] to-[#1e2023] pointer-events-none" aria-hidden="true" />

      {/* Desktop / Tablet: Right-aligned image with angled cut and atmospheric blend (UNTOUCHED) */}
      <div
        className="hidden md:block absolute inset-y-0 right-0 w-[46%] lg:w-[48%] [clip-path:polygon(56px_0,100%_0,100%_100%,0_100%)] lg:[clip-path:polygon(72px_0,100%_0,100%_100%,0_100%)] pointer-events-none overflow-hidden"
        aria-hidden="true"
      >
        {hasCloudImage ? (
          <CloudImage
            publicId={section.image_public_id!}
            alt={section.image_alt || section.heading || "Welder fabricating metal with sparks and smoke"}
            preset="hero"
            sizes="(min-width: 1024px) 50vw, 46vw"
            className="object-cover object-center"
          />
        ) : (
          <Image
            src="/Cinematic Welder Amid Sparks and Smoke.png"
            alt={section.image_alt || section.heading || "Welder fabricating metal with sparks and smoke"}
            fill
            sizes="(min-width: 1024px) 50vw, 46vw"
            className="object-cover object-center"
          />
        )}
        {/* Soft edge blend connecting the angled cut into the dark burgundy background */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#3D0C18] via-[#3D0C18]/30 to-transparent" />
      </div>

      {/* Mobile: Image on top with smooth bottom transition */}
      <div className="relative h-56 sm:h-64 w-full md:hidden overflow-hidden" aria-hidden="true">
        {hasCloudImage ? (
          <CloudImage
            publicId={section.image_public_id!}
            alt={section.image_alt || section.heading || "Welder fabricating metal with sparks and smoke"}
            preset="hero"
            sizes="100vw"
            className="object-cover object-center"
          />
        ) : (
          <Image
            src="/Cinematic Welder Amid Sparks and Smoke.png"
            alt={section.image_alt || section.heading || "Welder fabricating metal with sparks and smoke"}
            fill
            sizes="100vw"
            className="object-cover object-center"
          />
        )}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#3D0C18] to-transparent pointer-events-none" />
      </div>

      {/* Content side */}
      <div className="container-page relative z-10 py-8 pb-12 sm:py-12 md:py-20 lg:py-24">
        <div className="max-w-xl lg:max-w-2xl">
          {/* Eyebrow */}
          <p className="mb-2.5 sm:mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-steel-300">
            {section.eyebrow || "GET IN TOUCH"}
          </p>

          {/* Heading */}
          <h2
            id="contact-cta-heading"
            className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold !text-white tracking-tight leading-tight"
          >
            {section.heading || "Need a Custom Steel Solution?"}
          </h2>

          {/* Description */}
          <p className="mt-3 sm:mt-4 text-sm sm:text-base md:text-lg text-steel-200 leading-relaxed max-w-xl">
            {section.body || "Contact us for product enquiries, custom fabrication requirements or bulk orders."}
          </p>

          {/* Action buttons */}
          <div className="mt-6 sm:mt-8 flex flex-wrap items-center gap-3">
            <a
              href={whatsappHref(settings.whatsapp_number)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary"
            >
              <WhatsAppIcon className="h-4 w-4" />
              <span>{section.primary_cta_label || "WhatsApp Now"}</span>
            </a>

            {isSecondaryTel ? (
              <a href={telHref(settings.main_phone)} className="btn-light">
                <span>{section.secondary_cta_label || `Call: ${settings.main_phone}`}</span>
              </a>
            ) : isSecondaryExternal ? (
              <a href={secondaryHref} target="_blank" rel="noopener noreferrer" className="btn-light">
                <span>{section.secondary_cta_label || "Contact us"}</span>
              </a>
            ) : (
              <Link href={secondaryHref} className="btn-light">
                <span>{section.secondary_cta_label || "Contact us"}</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
