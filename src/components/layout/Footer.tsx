"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronDown, Clock, Facebook, Instagram, Mail, MapPin, Phone, Youtube } from "lucide-react";
import { NAV_LINKS, isConfiguredYoutubeUrl, isSafeUrl, telHref } from "@/lib/config/site";
import type { Category, ServiceCard } from "@/lib/data/public-types";
import type { SiteSettings } from "@/types/db";
import CloudImage from "@/components/ui/CloudImage";

type Props = {
  settings: SiteSettings;
  services: ServiceCard[];
  categories?: Category[];
};

function XIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

export default function Footer({ settings, services }: Props) {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  const toggleSection = (id: string) => {
    setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const socials = [
    { href: settings.facebook_url, label: `Visit ${settings.company_name} on Facebook`, Icon: Facebook },
    { href: settings.instagram_url, label: `Visit ${settings.company_name} on Instagram`, Icon: Instagram },
    { href: settings.x_url, label: `Visit ${settings.company_name} on X (Twitter)`, Icon: XIcon },
    ...(isConfiguredYoutubeUrl(settings.youtube_url)
      ? [{ href: settings.youtube_url, label: `Visit ${settings.company_name} on YouTube`, Icon: Youtube }]
      : []),
  ].filter((s) => Boolean(s.href && isSafeUrl(s.href)));

  return (
    <footer className="bg-steel-900 text-steel-200">
      <div className="container-page grid gap-8 pt-8 pb-4 md:grid-cols-2 lg:grid-cols-4 md:py-12">
        {/* Company info & socials — always visible without expansion */}
        <div>
          <div className="relative mb-4 inline-block h-14 w-44">
            {settings.logo_public_id ? (
              <CloudImage
                publicId={settings.logo_public_id}
                alt={settings.company_name}
                preset="logo"
                sizes="176px"
                className="object-contain object-left"
              />
            ) : (
              <Image
                src="/brand/logo-dark.png"
                alt={settings.company_name}
                fill
                sizes="176px"
                className="object-contain object-left"
                priority={false}
              />
            )}
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-steel-300">
            {settings.footer_description || settings.tagline || settings.company_name}
          </p>
          {socials.length > 0 ? (
            <div className="mt-5">
              <p className="sr-only">Social media links</p>
              <ul className="flex flex-wrap gap-3" aria-label="Social media">
                {socials.map(({ href, label, Icon }) => (
                  <li key={label}>
                    <a
                      href={href!}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={label}
                      className="inline-flex h-10 w-10 items-center justify-center border border-steel-600 text-steel-200 transition-colors hover:border-white hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
                    >
                      <Icon className="h-4 w-4" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        {/* Services Section */}
        {services.length > 0 ? (
          <div className="border-b border-steel-800 pb-4 md:border-b-0 md:pb-0">
            <h2>
              <button
                type="button"
                id="footer-btn-services"
                aria-expanded={Boolean(openSections.services)}
                aria-controls="footer-section-services"
                onClick={() => toggleSection("services")}
                className="flex w-full items-center justify-between py-2 text-sm font-semibold uppercase tracking-wider text-white md:hidden hover:text-brand-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-500"
              >
                <span>Services</span>
                <ChevronDown
                  className={`h-4 w-4 text-steel-400 transition-transform duration-200 ${
                    openSections.services ? "rotate-180" : ""
                  }`}
                  aria-hidden="true"
                />
              </button>
              <span className="hidden md:block mb-4 text-sm font-semibold uppercase tracking-wider text-white">
                Services
              </span>
            </h2>
            <nav
              id="footer-section-services"
              aria-labelledby="footer-btn-services"
              className={`${openSections.services ? "block pt-2" : "hidden"} md:!block md:!pt-0`}
            >
              <ul className="space-y-2 text-sm">
                {services.slice(0, 6).map((s) => (
                  <li key={s.id}>
                    <Link href={`/services/${s.slug}`} className="hover:text-white transition-colors">
                      {s.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        ) : null}

        {/* Quick Links Section */}
        <div className="border-b border-steel-800 pb-4 md:border-b-0 md:pb-0">
          <h2>
            <button
              type="button"
              id="footer-btn-links"
              aria-expanded={Boolean(openSections.links)}
              aria-controls="footer-section-links"
              onClick={() => toggleSection("links")}
              className="flex w-full items-center justify-between py-2 text-sm font-semibold uppercase tracking-wider text-white md:hidden hover:text-brand-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-500"
            >
              <span>Quick Links</span>
              <ChevronDown
                className={`h-4 w-4 text-steel-400 transition-transform duration-200 ${
                  openSections.links ? "rotate-180" : ""
                }`}
                aria-hidden="true"
              />
            </button>
            <span className="hidden md:block mb-4 text-sm font-semibold uppercase tracking-wider text-white">
              Quick Links
            </span>
          </h2>
          <nav
            id="footer-section-links"
            aria-labelledby="footer-btn-links"
            className={`${openSections.links ? "block pt-2" : "hidden"} md:!block md:!pt-0`}
          >
            <ul className="space-y-2 text-sm">
              {[...NAV_LINKS.filter(l => l.href !== '/contact'), { href: '/blog', label: 'Blog' }, ...NAV_LINKS.filter(l => l.href === '/contact')].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="hover:text-white transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* Contact Section */}
        <div className="pb-1 md:pb-0">
          <h2>
            <button
              type="button"
              id="footer-btn-contact"
              aria-expanded={Boolean(openSections.contact)}
              aria-controls="footer-section-contact"
              onClick={() => toggleSection("contact")}
              className="flex w-full items-center justify-between py-2 text-sm font-semibold uppercase tracking-wider text-white md:hidden hover:text-brand-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-500"
            >
              <span>Contact</span>
              <ChevronDown
                className={`h-4 w-4 text-steel-400 transition-transform duration-200 ${
                  openSections.contact ? "rotate-180" : ""
                }`}
                aria-hidden="true"
              />
            </button>
            <span className="hidden md:block mb-4 text-sm font-semibold uppercase tracking-wider text-white">
              Contact
            </span>
          </h2>
          <div
            id="footer-section-contact"
            role="region"
            aria-labelledby="footer-btn-contact"
            className={`${openSections.contact ? "block pt-2" : "hidden"} md:!block md:!pt-0`}
          >
            <ul className="space-y-3 text-sm">
              <li className="flex gap-2">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-steel-400" aria-hidden="true" />
                <span>
                  <a href={telHref(settings.main_phone)} className="hover:text-white transition-colors">
                    {settings.main_phone}
                  </a>
                  {settings.secondary_phone ? (
                    <>
                      <br />
                      <a href={telHref(settings.secondary_phone)} className="hover:text-white transition-colors">
                        {settings.secondary_phone}
                      </a>
                    </>
                  ) : null}
                </span>
              </li>
              <li className="flex gap-2">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-steel-400" aria-hidden="true" />
                <a href={`mailto:${settings.email}`} className="break-all hover:text-white transition-colors">
                  {settings.email}
                </a>
              </li>
              {settings.address_text ? (
                <li className="flex gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-steel-400" aria-hidden="true" />
                  <span>{settings.address_text}</span>
                </li>
              ) : null}
              {settings.business_hours ? (
                <li className="flex gap-2">
                  <Clock className="mt-0.5 h-4 w-4 shrink-0 text-steel-400" aria-hidden="true" />
                  <span className="whitespace-pre-line">{settings.business_hours}</span>
                </li>
              ) : null}
            </ul>
            {settings.google_maps_url ? (
              <a
                href={settings.google_maps_url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-outline mt-5 !border-steel-600 !bg-transparent !text-white hover:!border-white"
              >
                Open in Google Maps
              </a>
            ) : null}
          </div>
        </div>
      </div>

      {/* Copyright / Legal bar */}
      <div className="border-t border-steel-800">
        <div className="container-page flex flex-col items-center justify-center gap-1.5 py-2.5 text-center text-xs text-steel-500 sm:flex-row sm:justify-between sm:items-center sm:text-left sm:py-3">
          <p>&copy; {new Date().getFullYear()} {settings.company_name}. All rights reserved.</p>
          <p>
            Crafted by{" "}
            <a
              href="https://www.ekodrix.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-steel-400 hover:text-white transition-colors underline-offset-4 hover:underline"
            >
              Ekodrix
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
