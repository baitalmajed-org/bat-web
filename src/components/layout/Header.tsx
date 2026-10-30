import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Phone } from "lucide-react";
import { NAV_LINKS, telHref, whatsappHref } from "@/lib/config/site";
import type { SiteSettings } from "@/types/db";
import CloudImage from "@/components/ui/CloudImage";
import WhatsAppIcon from "@/components/ui/WhatsAppIcon";
import HeaderNav from "./HeaderNav";

export default function Header({ settings }: { settings: SiteSettings }) {
  return (
    <header className="sticky top-0 z-40 border-b border-steel-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85">
      <div className="container-page flex h-16 items-center justify-between gap-4 sm:h-[4.5rem] lg:h-20">
        <Link href="/" className="relative block h-12 w-28 shrink-0 sm:h-14 sm:w-32 lg:h-16 lg:w-40" aria-label={`${settings.company_name} home`}>
          {settings.logo_public_id ? (
            <CloudImage publicId={settings.logo_public_id} alt={settings.company_name} preset="logo" sizes="160px" priority className="object-contain object-left" />
          ) : (
            <Image src="/brand/logo-on-white.png" alt={settings.company_name} fill priority sizes="160px" className="object-contain object-left" />
          )}
        </Link>

        <div className="flex items-center gap-3">
          <HeaderNav
            links={NAV_LINKS}
            telHref={telHref(settings.main_phone)}
            waHref={whatsappHref(settings.whatsapp_number)}
            phoneLabel={settings.main_phone}
            companyName={settings.company_name}
            logoPublicId={settings.logo_public_id}
          />
          <a href={telHref(settings.main_phone)} className="btn-outline hidden xl:inline-flex"><Phone className="h-4 w-4" aria-hidden /> {settings.main_phone}</a>
          <a href={whatsappHref(settings.whatsapp_number)} target="_blank" rel="noopener noreferrer" className="btn-primary hidden sm:inline-flex">
            <WhatsAppIcon className="h-4 w-4" /> WhatsApp
          </a>
        </div>
      </div>
    </header>
  );
}
