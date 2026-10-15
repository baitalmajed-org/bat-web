import Image from "next/image";
import Link from "next/link";
import { MessageCircle, Phone } from "lucide-react";
import { NAV_LINKS, telHref, whatsappHref } from "@/lib/config/site";
import type { SiteSettings } from "@/types/db";
import CloudImage from "@/components/ui/CloudImage";
import HeaderNav from "./HeaderNav";

export default function Header({ settings }: { settings: SiteSettings }) {
  return (
    <header className="sticky top-0 z-40 border-b border-steel-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85">
      <div className="container-page flex h-16 items-center justify-between gap-4 lg:h-[5.25rem]">
        <Link href="/" className="relative block h-11 w-[5.25rem] shrink-0 sm:h-12 sm:w-24 lg:h-14 lg:w-28" aria-label={`${settings.company_name} home`}>
          {settings.logo_public_id ? (
            <CloudImage publicId={settings.logo_public_id} alt={settings.company_name} preset="logo" sizes="130px" priority className="object-contain object-left" />
          ) : (
            <Image src="/brand/logo-on-white.png" alt={settings.company_name} fill priority sizes="130px" className="object-contain object-left" />
          )}
        </Link>

        <div className="flex items-center gap-3">
          <HeaderNav links={NAV_LINKS} telHref={telHref(settings.main_phone)} waHref={whatsappHref(settings.whatsapp_number)} phoneLabel={settings.main_phone} />
          <a href={telHref(settings.main_phone)} className="btn-outline hidden xl:inline-flex"><Phone className="h-4 w-4" aria-hidden /> {settings.main_phone}</a>
          <a href={whatsappHref(settings.whatsapp_number)} target="_blank" rel="noopener noreferrer" className="btn-primary hidden sm:inline-flex">
            <MessageCircle className="h-4 w-4" aria-hidden /> WhatsApp
          </a>
        </div>
      </div>
    </header>
  );
}
