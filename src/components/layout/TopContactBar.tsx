import React from "react";
import { Facebook, Instagram, Phone, Youtube } from "lucide-react";
import { isConfiguredYoutubeUrl, isSafeUrl, telHref } from "@/lib/config/site";
import type { SiteSettings } from "@/types/db";

export type TopContactBarProps = {
  settings: SiteSettings;
};

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
    ...(isConfiguredYoutubeUrl(settings.youtube_url)
      ? [{ href: settings.youtube_url, label: `Visit ${settings.company_name} on YouTube`, Icon: Youtube }]
      : []),
  ].filter((s) => Boolean(s.href && isSafeUrl(s.href)));

  return (
    <aside
      aria-label="Top contact and social links"
      className="relative z-50 w-full border-b border-brand-800 bg-brand text-steel-100 text-[11px] sm:text-xs py-1.5 sm:py-2"
    >
      <div className="container-page flex items-center justify-between gap-2 sm:gap-4 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {/* Left: Contact telephone numbers from admin site settings */}
        <div className="flex items-center gap-2.5 sm:gap-6 font-medium whitespace-nowrap shrink-0">
          {settings.main_phone ? (
            <a
              href={telHref(settings.main_phone)}
              className="inline-flex items-center gap-1 sm:gap-1.5 hover:text-white transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-white shrink-0"
              aria-label={`Call main telephone ${settings.main_phone}`}
            >
              <Phone className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0 text-steel-200" aria-hidden="true" />
              <span>{settings.main_phone}</span>
            </a>
          ) : null}

          {settings.secondary_phone ? (
            <a
              href={telHref(settings.secondary_phone)}
              className="inline-flex items-center gap-1 sm:gap-1.5 hover:text-white transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-white shrink-0"
              aria-label={`Call secondary telephone ${settings.secondary_phone}`}
            >
              <Phone className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0 text-steel-200" aria-hidden="true" />
              <span>{settings.secondary_phone}</span>
            </a>
          ) : null}
        </div>

        {/* Right: Configured social media icons */}
        {socials.length > 0 ? (
          <div className="flex items-center gap-2 sm:gap-3 shrink-0 ml-auto" aria-label="Social media">
            {socials.map(({ href, label, Icon }) => (
              <a
                key={label}
                href={href!}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="text-steel-200 hover:text-white transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-white p-0.5 shrink-0"
              >
                <Icon className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              </a>
            ))}
          </div>
        ) : null}
      </div>
    </aside>
  );
}
