import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  ArrowDown,
  ArrowRight,
  CheckCircle2,
  Clock,
  Factory,
  FileCheck2,
  MapPin,
  MessageCircle,
  Phone,
  ShieldCheck,
} from "lucide-react";
import { getServiceBySlug, getServices, getSettings } from "@/lib/data/public";
import { cloudinaryUrl } from "@/lib/cloudinary/urls";
import { telHref, whatsappHref } from "@/lib/config/site";
import { buildMetadata } from "@/lib/seo/metadata";
import { breadcrumbJsonLd, jsonLdString } from "@/lib/seo/jsonld";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import CloudImage from "@/components/ui/CloudImage";
import ServiceIcon from "@/components/ui/ServiceIcon";
import SpecTable from "@/components/ui/SpecTable";
import InquiryForm from "@/components/inquiry/InquiryForm";

export const revalidate = 600;
type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const s = await getServiceBySlug(slug);
  if (!s) return { title: "Service not found", robots: { index: false } };
  return buildMetadata({
    title: s.seo_title || s.title,
    description: s.seo_description || s.short_description || `${s.title} from Bait Al Majed Metal Works, Ajman, UAE.`,
    path: `/services/${s.slug}`,
    image: s.image_public_id ? cloudinaryUrl(s.image_public_id, 1200, "card") || null : null,
  });
}

export default async function ServicePage({ params }: { params: Params }) {
  const { slug } = await params;
  const service = await getServiceBySlug(slug);
  if (!service) notFound();
  const [settings, all] = await Promise.all([getSettings(), getServices()]);
  const related = all.filter((s) => s.id !== service.id).slice(0, 3);

  const whatsappLink = whatsappHref(
    settings.whatsapp_number,
    `Hello, I would like to enquire about: ${service.title}`
  );

  return (
    <>
      <div className="container-page py-6 sm:py-8 lg:py-10">
        <Breadcrumbs
          items={[
            { name: "Home", href: "/" },
            { name: "Services", href: "/services" },
            { name: service.title },
          ]}
        />

        {/* Hero Header Section */}
        <div className="mt-6 rounded-2xl border border-steel-200/80 bg-gradient-to-br from-white via-steel-50/50 to-steel-100/30 p-6 sm:p-8 lg:p-10 shadow-xs">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="max-w-3xl">
              <div className="flex items-center gap-3.5">
                <span className="flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand ring-1 ring-brand/20 shadow-2xs">
                  <ServiceIcon name={service.icon} className="h-6 w-6 sm:h-7 sm:w-7" />
                </span>
                <div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-brand">
                    Fabrication Capability
                  </span>
                  <h1 className="mt-1 text-2xl sm:text-3xl lg:text-4xl font-extrabold text-steel-900 tracking-tight">
                    {service.title}
                  </h1>
                </div>
              </div>

              {service.short_description ? (
                <p className="mt-4 text-base sm:text-lg text-steel-600 leading-relaxed">
                  {service.short_description}
                </p>
              ) : null}

              {/* Quick Feature Badges */}
              <div className="mt-5 flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm text-steel-600">
                <span className="inline-flex items-center gap-1.5 rounded-md bg-white border border-steel-200 px-2.5 py-1 font-medium shadow-2xs">
                  <ShieldCheck className="h-4 w-4 text-brand" /> Certified Steel Quality
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-md bg-white border border-steel-200 px-2.5 py-1 font-medium shadow-2xs">
                  <Factory className="h-4 w-4 text-brand" /> Ajman In-House Production
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-md bg-white border border-steel-200 px-2.5 py-1 font-medium shadow-2xs">
                  <Clock className="h-4 w-4 text-brand" /> Fast Quote Turnaround
                </span>
              </div>
            </div>

            {/* Header Action Buttons */}
            <div className="flex flex-wrap lg:flex-col items-stretch gap-3 shrink-0 lg:min-w-[220px]">
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary justify-center shadow-xs hover:shadow-sm"
              >
                <MessageCircle className="h-4 w-4" aria-hidden />
                Enquire on WhatsApp
              </a>
              <a
                href="#enquire"
                className="btn-outline justify-center hover:bg-steel-50"
              >
                <ArrowDown className="h-4 w-4" aria-hidden />
                Send an Inquiry
              </a>
            </div>
          </div>
        </div>

        {/* Main 2-Column Content Layout on Desktop */}
        <div className="mt-8 grid gap-8 lg:grid-cols-12 lg:gap-10 items-start">
          {/* Main Left Details (col-span-8) */}
          <div className="lg:col-span-8 space-y-8">
            {/* Featured Image if present */}
            {service.image_public_id ? (
              <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-steel-200 bg-steel-100 shadow-sm">
                <CloudImage
                  publicId={service.image_public_id}
                  alt={service.image_alt ?? service.title}
                  preset="card"
                  sizes="(min-width:1024px) 65vw, 100vw"
                  priority
                />
              </div>
            ) : null}

            {/* Service Description Card */}
            {service.description ? (
              <section className="rounded-2xl border border-steel-200 bg-white p-6 sm:p-8 shadow-xs">
                <h2 className="text-xl sm:text-2xl font-bold text-steel-900 flex items-center gap-2">
                  <FileCheck2 className="h-5 w-5 text-brand" />
                  Service Overview & Capabilities
                </h2>
                <div className="mt-4 whitespace-pre-line leading-relaxed text-steel-700 space-y-3">
                  {service.description}
                </div>
              </section>
            ) : null}

            {/* Applications Section */}
            {service.applications.length > 0 ? (
              <section className="rounded-2xl border border-steel-200 bg-white p-6 sm:p-8 shadow-xs" aria-labelledby="apps">
                <div>
                  <h2 id="apps" className="text-xl sm:text-2xl font-bold text-steel-900">
                    Applications & Industrial Sectors
                  </h2>
                  <p className="mt-1 text-sm text-steel-500">
                    Typical project environments and deployment areas for this equipment.
                  </p>
                </div>
                <ul className="mt-5 flex flex-wrap gap-2.5">
                  {service.applications.map((a) => (
                    <li
                      key={a}
                      className="inline-flex items-center gap-2 rounded-lg border border-steel-200 bg-steel-50/80 px-4 py-2 text-sm font-semibold text-steel-800 shadow-2xs"
                    >
                      <CheckCircle2 className="h-4 w-4 text-brand shrink-0" aria-hidden />
                      {a}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {/* Specifications Section */}
            {service.specifications.length > 0 ? (
              <section className="rounded-2xl border border-steel-200 bg-white p-6 sm:p-8 shadow-xs" aria-labelledby="specs">
                <h2 id="specs" className="text-xl sm:text-2xl font-bold text-steel-900 mb-4">
                  Technical Specifications
                </h2>
                <SpecTable specs={service.specifications} />
              </section>
            ) : null}
          </div>

          {/* Right Sidebar on Desktop (col-span-4) */}
          <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
            {/* Quick Contact & Quotation Card */}
            <div className="rounded-2xl border border-steel-200 bg-white p-6 shadow-xs relative overflow-hidden">
              <div className="h-1.5 w-full bg-brand absolute top-0 left-0" />
              <h3 className="text-lg font-bold text-steel-900">Direct Consultation</h3>
              <p className="mt-1.5 text-xs sm:text-sm text-steel-600 leading-relaxed">
                Need custom dimensions, blue-print estimation, or bulk fabrication rates? Speak directly with our technical team.
              </p>

              <div className="mt-5 space-y-3.5 pt-4 border-t border-steel-100 text-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-steel-100 text-steel-700">
                    <Phone className="h-4 w-4 text-brand" />
                  </div>
                  <div>
                    <p className="text-xs text-steel-500 font-medium">Main Hotline</p>
                    <a href={telHref(settings.main_phone)} className="font-semibold text-steel-900 hover:text-brand transition-colors">
                      {settings.main_phone}
                    </a>
                  </div>
                </div>

                {settings.secondary_phone ? (
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-steel-100 text-steel-700">
                      <Phone className="h-4 w-4 text-brand" />
                    </div>
                    <div>
                      <p className="text-xs text-steel-500 font-medium">Alternative Contact</p>
                      <a href={telHref(settings.secondary_phone)} className="font-semibold text-steel-900 hover:text-brand transition-colors">
                        {settings.secondary_phone}
                      </a>
                    </div>
                  </div>
                ) : null}

                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-steel-100 text-steel-700">
                    <MapPin className="h-4 w-4 text-brand" />
                  </div>
                  <div>
                    <p className="text-xs text-steel-500 font-medium">Fabrication Facility</p>
                    <p className="font-semibold text-steel-800 text-xs sm:text-sm">{settings.address_text || "Industrial Area, Ajman, UAE"}</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-steel-100 space-y-2">
                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary w-full justify-center text-sm"
                >
                  <MessageCircle className="h-4 w-4" aria-hidden />
                  WhatsApp Direct Inquiry
                </a>
              </div>
            </div>

            {/* Manufacturing Highlights Card */}
            <div className="rounded-2xl border border-steel-200 bg-steel-50/70 p-6 shadow-2xs">
              <h4 className="text-xs font-bold uppercase tracking-wider text-steel-500">Fabrication Standards</h4>
              <ul className="mt-3.5 space-y-2.5 text-xs sm:text-sm text-steel-700">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-brand shrink-0 mt-0.5" />
                  <span>Custom engineering to client specification</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-brand shrink-0 mt-0.5" />
                  <span>Certified welding & structural steel grades</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-brand shrink-0 mt-0.5" />
                  <span>Prompt site delivery across UAE</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Structured Inquiry Section with 2-Column Split */}
        <section
          id="enquire"
          className="mt-14 scroll-mt-24 rounded-2xl border border-steel-200 bg-white shadow-sm overflow-hidden"
          aria-labelledby="enquire-heading"
        >
          <div className="grid lg:grid-cols-12">
            {/* Left Briefing Card */}
            <div className="lg:col-span-4 bg-steel-900 text-white p-6 sm:p-8 lg:p-10 flex flex-col justify-between">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-brand/30 border border-brand/50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-brand-soft">
                  Get a Quote
                </span>
                <h2 id="enquire-heading" className="mt-4 text-2xl sm:text-3xl font-extrabold text-white">
                  Enquire about {service.title}
                </h2>
                <p className="mt-3 text-sm text-steel-300 leading-relaxed">
                  Provide your project dimensions, required quantities, or site specifications. Our engineering team in Ajman will review and respond promptly.
                </p>

                <div className="mt-6 space-y-3 text-xs sm:text-sm text-steel-300 border-t border-steel-800 pt-5">
                  <p className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-brand-soft" /> Response within 24 business hours
                  </p>
                  <p className="flex items-center gap-2">
                    <Factory className="h-4 w-4 text-brand-soft" /> Factory direct quotation
                  </p>
                  <p className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-brand-soft" /> Custom specifications supported
                  </p>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-steel-800">
                <p className="text-xs text-steel-400">Prefer to speak directly?</p>
                <a href={telHref(settings.main_phone)} className="mt-1 text-sm font-semibold text-white hover:text-brand-soft transition-colors flex items-center gap-2">
                  <Phone className="h-4 w-4" /> {settings.main_phone}
                </a>
              </div>
            </div>

            {/* Right Form Card */}
            <div className="lg:col-span-8 p-6 sm:p-8 lg:p-10 bg-white">
              <h3 className="text-lg font-bold text-steel-900 mb-6">
                Requirement Details
              </h3>
              <InquiryForm
                defaultType="service"
                serviceId={service.id}
                relatedLabel={service.title}
                defaultSubject={`Inquiry: ${service.title}`}
                heading={`Inquiry about ${service.title}`}
              />
            </div>
          </div>
        </section>

        {/* Other Services Section */}
        {related.length > 0 ? (
          <section className="mt-16" aria-labelledby="related">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 id="related" className="text-2xl font-bold text-steel-900">
                  Explore Other Services
                </h2>
                <p className="text-sm text-steel-500 mt-1">
                  Additional metal fabrication and industrial solutions from our workshop.
                </p>
              </div>
              <Link href="/services" className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:underline">
                View all services <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((s) => (
                <li key={s.id}>
                  <Link
                    href={`/services/${s.slug}`}
                    className="card group flex h-full flex-col justify-between p-6 rounded-xl border border-steel-200 hover:border-brand hover:shadow-md transition-all duration-200"
                  >
                    <div>
                      <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-steel-50 text-brand ring-1 ring-steel-200 group-hover:bg-brand group-hover:text-white transition-colors">
                        <ServiceIcon name={s.icon} className="h-5 w-5" />
                      </div>
                      <h3 className="mt-4 text-base font-bold text-steel-900 group-hover:text-brand transition-colors">
                        {s.title}
                      </h3>
                      {s.short_description ? (
                        <p className="mt-2 text-xs sm:text-sm text-steel-600 line-clamp-2">
                          {s.short_description}
                        </p>
                      ) : null}
                    </div>
                    <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-brand group-hover:translate-x-0.5 transition-transform">
                      Learn more <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdString(
            breadcrumbJsonLd([
              { name: "Home", path: "/" },
              { name: "Services", path: "/services" },
              { name: service.title, path: `/services/${service.slug}` },
            ])
          ),
        }}
      />
    </>
  );
}
