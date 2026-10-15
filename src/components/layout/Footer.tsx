import Image from "next/image";
import Link from "next/link";
import { Clock, Facebook, Instagram, Linkedin, Mail, MapPin, Phone, Youtube } from "lucide-react";
import { NAV_LINKS, telHref } from "@/lib/config/site";
import type { Category, ServiceCard } from "@/lib/data/public-types";
import type { SiteSettings } from "@/types/db";
import CloudImage from "@/components/ui/CloudImage";

type Props = { settings: SiteSettings; categories: Category[]; services: ServiceCard[] };

export default function Footer({ settings, categories, services }: Props) {
  const socials = [
    { href: settings.facebook_url, label: "Facebook", Icon: Facebook },
    { href: settings.instagram_url, label: "Instagram", Icon: Instagram },
    { href: settings.linkedin_url, label: "LinkedIn", Icon: Linkedin },
    { href: settings.youtube_url, label: "YouTube", Icon: Youtube },
  ].filter((s): s is { href: string; label: string; Icon: typeof Facebook } => Boolean(s.href));

  return (
    <footer className="bg-steel-900 text-steel-200">
      <div className="container-page grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <div className="relative mb-4 inline-block h-14 w-44">
            {settings.logo_public_id ? (
              <CloudImage publicId={settings.logo_public_id} alt={settings.company_name} preset="logo" sizes="176px" className="object-contain object-left" />
            ) : (
              <Image src="/brand/logo-dark.png" alt={settings.company_name} fill sizes="176px" className="object-contain object-left" priority={false} />
            )}
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-steel-300">
            {settings.footer_description || settings.tagline || settings.company_name}
          </p>
          {socials.length > 0 ? (
            <ul className="mt-5 flex gap-3">
              {socials.map(({ href, label, Icon }) => (
                <li key={label}>
                  <a href={href} target="_blank" rel="noopener noreferrer" aria-label={label} className="inline-flex h-10 w-10 items-center justify-center border border-steel-600 hover:border-white hover:text-white">
                    <Icon className="h-4 w-4" aria-hidden />
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <nav aria-label="Quick links">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">Quick Links</h2>
          <ul className="space-y-2 text-sm">
            {NAV_LINKS.map((l) => (<li key={l.href}><Link href={l.href} className="hover:text-white">{l.label}</Link></li>))}
          </ul>
        </nav>

        {categories.length > 0 || services.length > 0 ? (
          <nav aria-label="Products and services">
            {categories.length > 0 ? (
              <>
                <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">Products</h2>
                <ul className="space-y-2 text-sm">
                  {categories.slice(0, 7).map((c) => (<li key={c.id}><Link href={`/products?category=${c.slug}`} className="hover:text-white">{c.name}</Link></li>))}
                </ul>
              </>
            ) : null}
            {services.length > 0 ? (
              <>
                <h2 className={`mb-4 text-sm font-semibold uppercase tracking-wider text-white ${categories.length > 0 ? "mt-6" : ""}`}>Services</h2>
                <ul className="space-y-2 text-sm">
                  {services.slice(0, 6).map((s) => (<li key={s.id}><Link href={`/services/${s.slug}`} className="hover:text-white">{s.title}</Link></li>))}
                </ul>
              </>
            ) : null}
          </nav>
        ) : null}

        <div>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">Contact</h2>
          <ul className="space-y-3 text-sm">
            <li className="flex gap-2"><Phone className="mt-0.5 h-4 w-4 shrink-0" aria-hidden /><span><a href={telHref(settings.main_phone)} className="hover:text-white">{settings.main_phone}</a>{settings.secondary_phone ? <><br /><a href={telHref(settings.secondary_phone)} className="hover:text-white">{settings.secondary_phone}</a></> : null}</span></li>
            <li className="flex gap-2"><Mail className="mt-0.5 h-4 w-4 shrink-0" aria-hidden /><a href={`mailto:${settings.email}`} className="break-all hover:text-white">{settings.email}</a></li>
            {settings.address_text ? <li className="flex gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden /><span>{settings.address_text}</span></li> : null}
            {settings.business_hours ? <li className="flex gap-2"><Clock className="mt-0.5 h-4 w-4 shrink-0" aria-hidden /><span className="whitespace-pre-line">{settings.business_hours}</span></li> : null}
          </ul>
          {settings.google_maps_url ? (
            <a href={settings.google_maps_url} target="_blank" rel="noopener noreferrer" className="btn-outline mt-5 !border-steel-600 !bg-transparent !text-white hover:!border-white">Open in Google Maps</a>
          ) : null}
        </div>
      </div>
      <div className="border-t border-steel-800">
        <div className="container-page flex flex-col gap-2 py-5 text-xs text-steel-500 sm:flex-row sm:justify-between">
          <p>&copy; {new Date().getFullYear()} {settings.company_name}. All rights reserved.</p>
          <p>Steel fabrication &amp; metal works &middot; Ajman, UAE</p>
        </div>
      </div>
    </footer>
  );
}
