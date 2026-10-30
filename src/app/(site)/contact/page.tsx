import type { Metadata } from "next";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { getSettings } from "@/lib/data/public";
import { telHref, whatsappHref } from "@/lib/config/site";
import { buildMetadata } from "@/lib/seo/metadata";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import WhatsAppIcon from "@/components/ui/WhatsAppIcon";
import InquiryForm from "@/components/inquiry/InquiryForm";

export const revalidate = 3600;

export const metadata: Metadata = buildMetadata({
  title: "Contact Us",
  description: "Contact Bait Al Majed Metal Works in Ajman, UAE by phone, WhatsApp, email or the inquiry form.",
  path: "/contact",
});

const VALID_TYPES = ["product", "service", "custom_fabrication", "general"] as const;

export default async function ContactPage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const [settings, { type }] = await Promise.all([getSettings(), searchParams]);
  const defaultType = (VALID_TYPES as readonly string[]).includes(type ?? "") ? (type as (typeof VALID_TYPES)[number]) : "general";

  return (
    <>
      <section className="border-b border-steel-200 bg-steel-50">
        <div className="container-page py-10">
          <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Contact" }]} />
          <h1 className="mt-4 text-3xl sm:text-4xl">Contact Us</h1>
          <p className="mt-2 max-w-2xl text-steel-600">Send us an inquiry or reach us directly. Product enquiries, custom fabrication requirements and bulk orders are welcome.</p>
        </div>
      </section>

      <div className="container-page grid gap-10 py-12 lg:grid-cols-5">
        <aside className="space-y-4 lg:col-span-2" aria-label="Contact details">
          <ul className="card divide-y divide-steel-200">
            <li className="flex gap-3 p-4"><Phone className="mt-0.5 h-5 w-5 text-brand" aria-hidden /><div><p className="text-xs uppercase tracking-wider text-steel-500">Telephone</p><a href={telHref(settings.main_phone)} className="font-semibold hover:text-brand">{settings.main_phone}</a>{settings.secondary_phone ? <><br /><a href={telHref(settings.secondary_phone)} className="font-semibold hover:text-brand">{settings.secondary_phone}</a></> : null}</div></li>
            <li className="flex gap-3 p-4"><WhatsAppIcon className="mt-0.5 h-5 w-5 text-brand" /><div><p className="text-xs uppercase tracking-wider text-steel-500">WhatsApp</p><a href={whatsappHref(settings.whatsapp_number)} target="_blank" rel="noopener noreferrer" className="font-semibold hover:text-brand">Chat on WhatsApp</a></div></li>
            <li className="flex gap-3 p-4"><Mail className="mt-0.5 h-5 w-5 text-brand" aria-hidden /><div><p className="text-xs uppercase tracking-wider text-steel-500">Email</p><a href={`mailto:${settings.email}`} className="break-all font-semibold hover:text-brand">{settings.email}</a></div></li>
            {settings.address_text ? <li className="flex gap-3 p-4"><MapPin className="mt-0.5 h-5 w-5 text-brand" aria-hidden /><div><p className="text-xs uppercase tracking-wider text-steel-500">Location</p><p className="font-semibold">{settings.address_text}</p>{settings.google_maps_url ? <a href={settings.google_maps_url} target="_blank" rel="noopener noreferrer" className="text-sm text-brand hover:underline">Open in Google Maps</a> : null}</div></li> : null}
            {settings.business_hours ? <li className="flex gap-3 p-4"><Clock className="mt-0.5 h-5 w-5 text-brand" aria-hidden /><div><p className="text-xs uppercase tracking-wider text-steel-500">Business hours</p><p className="whitespace-pre-line font-semibold">{settings.business_hours}</p></div></li> : null}
          </ul>
          {settings.google_maps_embed_url ? (
            <iframe title="Map showing our location" src={settings.google_maps_embed_url} loading="lazy" referrerPolicy="no-referrer-when-downgrade" className="aspect-video w-full border border-steel-200" />
          ) : null}
        </aside>

        <section className="lg:col-span-3" aria-labelledby="form-heading">
          <h2 id="form-heading" className="mb-5 text-2xl">Send an inquiry</h2>
          <InquiryForm defaultType={defaultType} heading="Contact inquiry" />
        </section>
      </div>
    </>
  );
}
