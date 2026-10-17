import React from "react";
import { Facebook, Instagram, Linkedin, Mail, Phone, Youtube } from "lucide-react";
import { telHref } from "@/lib/config/site";
import type { SiteSettings } from "@/types/db";

export type TopContactBarProps = {
  settings: SiteSettings;
};

function isSafeUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  const trimmed = url.trim();
  if (/^javascript:/i.test(trimmed)) return false;
  return /^https?:\/\//i.test(trimmed);
}

function XIcon({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

export default function TopContactBar({ settings }: TopContactBarProps) {
  const isEnabled = settings?.top_contact_bar_enabled !== false && settings?.top_bar_enabled !== false;
  if (!isEnabled) {
    return null;
  }

  const socials = [
    { href: settings.facebook_url, label: `Visit ${settings.company_name} on Facebook`, Icon: Facebook },
    { href: settings.instagram_url, label: `Visit ${settings.company_name} on Instagram`, Icon: Instagram },
    { href: settings.x_url, label: `Visit ${settings.company_name} on X (Twitter)`, Icon: XIcon },
    { href: settings.youtube_url, label: `Visit ${settings.company_name} on YouTube`, Icon: Youtube },
    { href: settings.linkedin_url, label: `Visit ${settings.company_name} on LinkedIn`, Icon: Linkedin },
  ].filter((s) => Boolean(s.href && isSafeUrl(s.href)));

  return (
    <aside
      aria-label="Top contact and social links"
      className="relative z-50 w-full border-b border-brand-800 bg-brand text-steel-100 text-xs py-1.5 sm:py-2 px-3 sm:px-4"
    >
      <div className="container-page flex flex-wrap items-center justify-between gap-y-1.5 gap-x-4">
        {/* Left: Contact details */}
        <div className="flex flex-wrap items-center gap-x-4 sm:gap-x-6 gap-y-1 font-medium">
          {settings.email ? (
            <a
              href={`mailto:${settings.email}`}
              className="inline-flex items-center gap-1.5 hover:text-white transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
              aria-label={`Email us at ${settings.email}`}
            >
              <Mail className="h-3.5 w-3.5 shrink-0 text-steel-200" aria-hidden="true" />
              <span>{settings.email}</span>
            </a>
          ) : null}

          {settings.main_phone ? (
            <a
              href={telHref(settings.main_phone)}
              className="inline-flex items-center gap-1.5 hover:text-white transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
              aria-label={`Call main telephone ${settings.main_phone}`}
            >
              <Phone className="h-3.5 w-3.5 shrink-0 text-steel-200" aria-hidden="true" />
              <span>{settings.main_phone}</span>
            </a>
          ) : null}

          {settings.secondary_phone ? (
            <a
              href={telHref(settings.secondary_phone)}
              className="hidden sm:inline-flex items-center gap-1.5 hover:text-white transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
              aria-label={`Call secondary telephone ${settings.secondary_phone}`}
            >
              <Phone className="h-3.5 w-3.5 shrink-0 text-steel-200" aria-hidden="true" />
              <span>{settings.secondary_phone}</span>
            </a>
          ) : null}
        </div>

        {/* Right: Configured social media icons */}
        {socials.length > 0 ? (
          <div className="flex items-center gap-3 ml-auto sm:ml-0" aria-label="Social media">
            {socials.map(({ href, label, Icon }) => (
              <a
                key={label}
                href={href!}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="text-steel-200 hover:text-white transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-white p-0.5"
              >
                <Icon className="h-3.5 w-3.5" />
              </a>
            ))}
          </div>
        ) : null}
      </div>
    </aside>
  );
}
