import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { MessageCircle } from "lucide-react";
import { getServiceBySlug, getServices, getSettings } from "@/lib/data/public";
import { cloudinaryUrl } from "@/lib/cloudinary/urls";
import { whatsappHref } from "@/lib/config/site";
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

  return (
    <>
      <div className="container-page py-8">
        <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Services", href: "/services" }, { name: service.title }]} />
        <div className="mt-6 grid gap-10 lg:grid-cols-2">
          <div>
            <span className="text-brand"><ServiceIcon name={service.icon} className="h-9 w-9" /></span>
            <h1 className="mt-3 text-3xl sm:text-4xl">{service.title}</h1>
            {service.short_description ? <p className="mt-3 text-lg text-steel-700">{service.short_description}</p> : null}
            {service.is_sample ? <p className="mt-4 border-l-4 border-steel-400 bg-steel-50 p-3 text-sm text-steel-700">Sample description: capabilities have not been verified yet. Contact us to discuss your requirement.</p> : null}
            {service.description ? <div className="mt-6 whitespace-pre-line leading-relaxed text-steel-700">{service.description}</div> : null}
            <div className="mt-7 flex flex-wrap gap-3">
              <a href={whatsappHref(settings.whatsapp_number, `Hello, I would like to enquire about: ${service.title}`)} target="_blank" rel="noopener noreferrer" className="btn-primary"><MessageCircle className="h-4 w-4" aria-hidden /> Enquire on WhatsApp</a>
              <a href="#enquire" className="btn-outline">Send an inquiry</a>
            </div>
          </div>
          {service.image_public_id ? (
            <div className="relative aspect-[4/3] overflow-hidden bg-steel-100"><CloudImage publicId={service.image_public_id} alt={service.image_alt ?? service.title} preset="card" sizes="(min-width:1024px) 50vw, 100vw" priority /></div>
          ) : null}
        </div>

        {service.applications.length > 0 ? (
          <section className="mt-12" aria-labelledby="apps"><h2 id="apps" className="mb-4 text-2xl">Applications</h2>
            <ul className="flex flex-wrap gap-2">{service.applications.map((a) => (<li key={a} className="border border-steel-300 px-3 py-1.5 text-sm">{a}</li>))}</ul></section>
        ) : null}
        {service.specifications.length > 0 ? (
          <section className="mt-12" aria-labelledby="specs"><h2 id="specs" className="mb-4 text-2xl">Specifications</h2><SpecTable specs={service.specifications} /></section>
        ) : null}

        <section id="enquire" className="mt-14 scroll-mt-24 border border-steel-200 bg-steel-50 p-6 sm:p-8" aria-labelledby="enquire-heading">
          <h2 id="enquire-heading" className="text-2xl">Enquire about {service.title}</h2>
          <div className="mt-6 max-w-3xl"><InquiryForm defaultType="service" serviceId={service.id} relatedLabel={service.title} defaultSubject={`Inquiry: ${service.title}`} heading={`Inquiry about ${service.title}`} /></div>
        </section>

        {related.length > 0 ? (
          <section className="mt-14" aria-labelledby="related"><h2 id="related" className="mb-6 text-2xl">Other services</h2>
            <ul className="grid gap-4 sm:grid-cols-3">{related.map((s) => (
              <li key={s.id}><Link href={`/services/${s.slug}`} className="card flex h-full items-center gap-3 p-4 hover:border-brand"><span className="text-brand"><ServiceIcon name={s.icon} /></span><span className="font-semibold">{s.title}</span></Link></li>
            ))}</ul></section>
        ) : null}
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Services", path: "/services" }, { name: service.title, path: `/services/${service.slug}` }])) }} />
    </>
  );
}
