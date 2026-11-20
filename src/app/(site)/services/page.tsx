import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { getServices, getSettings } from "@/lib/data/public";
import { whatsappHref } from "@/lib/config/site";
import { buildMetadata } from "@/lib/seo/metadata";
import { breadcrumbJsonLd, jsonLdString } from "@/lib/seo/jsonld";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import CloudImage from "@/components/ui/CloudImage";
import ServiceIcon from "@/components/ui/ServiceIcon";
import WhatsAppIcon from "@/components/ui/WhatsAppIcon";

export const revalidate = 3600;

export const metadata: Metadata = buildMetadata({
  title: "Steel Fabrication Company UAE | Metal Works & Welding Workshop Ajman",
  description:
    "Professional steel fabrication company in Ajman, UAE. Comprehensive welding, custom metal works, construction equipment manufacturing, and industrial steel solutions across Dubai, Sharjah and UAE.",
  path: "/services",
});

export default async function ServicesPage() {
  const [services, settings] = await Promise.all([getServices(), getSettings()]);
  const breadcrumbsLd = breadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "Services", path: "/services" },
  ]);

  return (
    <>
      <section className="border-b border-steel-200 bg-steel-50">
        <div className="container-page py-10">
          <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Services" }]} />
          <h1 className="mt-4 text-3xl sm:text-4xl font-extrabold text-steel-900">
            Steel Fabrication Company & Metal Works Solutions UAE
          </h1>
          <p className="mt-2 max-w-3xl text-steel-600">
            Precision welding, custom steel fabrication, structural metal works, and construction equipment
            manufacturing at our facility in Al Jurf Industrial Area, Ajman. Supplying contractors across Dubai,
            Sharjah, Abu Dhabi, and the UAE.
          </p>
        </div>
      </section>
      <div className="container-page py-12">
        {services.length === 0 ? (
          <div className="border border-dashed border-steel-300 p-10 text-center">
            <p className="font-semibold">Services will appear here once they are published.</p>
          </div>
        ) : (
          <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {services.map((s) => (
              <li key={s.id} className="card flex flex-col">
                {s.image_public_id ? (
                  <div className="relative aspect-[16/9] overflow-hidden bg-steel-100">
                    <CloudImage
                      publicId={s.image_public_id}
                      alt={s.image_alt || `${s.title} steel fabrication Bait Al Majed Metal Works Ajman UAE`}
                      preset="card"
                      sizes="(min-width:1024px) 33vw, (min-width:768px) 50vw, 100vw"
                    />
                  </div>
                ) : null}
                <div className="flex flex-1 flex-col gap-3 p-6">
                  <span className="text-brand">
                    <ServiceIcon name={s.icon} />
                  </span>
                  <h2 className="text-xl font-bold">
                    <Link href={`/services/${s.slug}`} className="hover:text-brand">
                      {s.title}
                    </Link>
                  </h2>
                  {s.short_description ? (
                    <p className="text-sm text-steel-600 leading-relaxed">{s.short_description}</p>
                  ) : null}
                  <div className="mt-auto flex flex-wrap items-center gap-4 pt-3 text-sm font-semibold">
                    <Link
                      href={`/services/${s.slug}`}
                      className="inline-flex items-center gap-1 text-brand hover:underline"
                    >
                      Details <ArrowRight className="h-4 w-4" aria-hidden />
                    </Link>
                    <Link href={`/services/${s.slug}#enquire`} className="text-steel-700 hover:text-brand">
                      Enquire
                    </Link>
                    <a
                      href={whatsappHref(
                        settings.whatsapp_number,
                        `Hello, I would like to enquire about: ${s.title}`
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-steel-700 hover:text-brand"
                    >
                      <WhatsAppIcon className="h-4 w-4" /> WhatsApp
                    </a>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(breadcrumbsLd) }} />
    </>
  );
}
