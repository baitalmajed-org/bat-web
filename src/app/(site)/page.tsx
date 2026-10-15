import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { getFeaturedProducts, getHomepageSections, getServices, getSettings } from "@/lib/data/public";
import { buildMetadata } from "@/lib/seo/metadata";
import Hero from "@/components/home/Hero";
import ProductCarousel from "@/components/home/ProductCarousel";
import ProductCard from "@/components/products/ProductCard";
import ServicesGrid from "@/components/home/ServicesGrid";
import AboutPreview from "@/components/home/AboutPreview";
import TrustBar from "@/components/home/TrustBar";
import ContactCta from "@/components/home/ContactCta";
import type { HomepageSection } from "@/types/db";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  return buildMetadata({
    title: s.seo_default_title ?? s.company_name,
    description: s.seo_default_description ?? "Steel fabrication and metal works in Ajman, UAE.",
    path: "/",
  });
}

const FALLBACK_HERO: HomepageSection = {
  id: "fallback", key: "hero", eyebrow: "Steel fabrication & metal works",
  heading: "Reliable Steel Solutions for Construction & Industrial Applications",
  body: "Welding, fabrication and customized metal solutions from Ajman, UAE.",
  image_public_id: null, image_alt: null, primary_cta_label: "Enquire on WhatsApp", primary_cta_href: "whatsapp",
  secondary_cta_label: "Call Now", secondary_cta_href: "tel", items: [], is_visible: true, sort_order: 1,
};

export default async function HomePage() {
  const [settings, sections, featured, services] = await Promise.all([getSettings(), getHomepageSections(), getFeaturedProducts(), getServices()]);
  const hero = sections.hero ?? FALLBACK_HERO;
  const homeServices = services.filter((s) => s.show_on_home).slice(0, 6);
  const products = sections.featured_products;
  const servicesSection = sections.services;

  const blocks: { key: string; order: number; node: React.ReactNode }[] = [];

  if (products && featured.length > 0) {
    blocks.push({
      key: "featured_products", order: products.sort_order, node: (
        <section key="featured_products" className="container-page py-16" aria-labelledby="products-heading">
          <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div className="max-w-2xl">
              {products.eyebrow ? <p className="eyebrow mb-3">{products.eyebrow}</p> : null}
              <h2 id="products-heading" className="text-3xl sm:text-4xl">{products.heading}</h2>
              {products.body ? <p className="mt-3 text-steel-600">{products.body}</p> : null}
            </div>
            <Link href={products.primary_cta_href ?? "/products"} className="btn-outline self-start sm:self-auto">{products.primary_cta_label ?? "View all products"} <ArrowRight className="h-4 w-4" aria-hidden /></Link>
          </div>
          <ProductCarousel label="Featured products">
            {featured.map((p) => (<li key={p.id}><ProductCard product={p} sizes="(min-width:1024px) 24vw, (min-width:640px) 44vw, 72vw" /></li>))}
          </ProductCarousel>
        </section>
      ),
    });
  }
  if (servicesSection && homeServices.length > 0) {
    blocks.push({
      key: "services", order: servicesSection.sort_order, node: (
        <section key="services" className="bg-steel-50 py-16" aria-labelledby="services-heading">
          <div className="container-page">
            <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div className="max-w-2xl">
                {servicesSection.eyebrow ? <p className="eyebrow mb-3">{servicesSection.eyebrow}</p> : null}
                <h2 id="services-heading" className="text-3xl sm:text-4xl">{servicesSection.heading}</h2>
                {servicesSection.body ? <p className="mt-3 text-steel-600">{servicesSection.body}</p> : null}
              </div>
              <Link href={servicesSection.primary_cta_href ?? "/services"} className="btn-outline self-start sm:self-auto">{servicesSection.primary_cta_label ?? "All services"} <ArrowRight className="h-4 w-4" aria-hidden /></Link>
            </div>
            <ServicesGrid services={homeServices} />
          </div>
        </section>
      ),
    });
  }
  if (sections.about) blocks.push({ key: "about", order: sections.about.sort_order, node: <AboutPreview key="about" section={sections.about} /> });
  if (sections.trust) blocks.push({ key: "trust", order: sections.trust.sort_order, node: <TrustBar key="trust" items={sections.trust.items} /> });
  if (sections.contact_cta) blocks.push({ key: "contact_cta", order: sections.contact_cta.sort_order, node: <ContactCta key="contact_cta" section={sections.contact_cta} settings={settings} /> });
  blocks.sort((a, b) => a.order - b.order);

  return (
    <>
      <Hero section={hero} settings={settings} />
      {blocks.map((b) => b.node)}
    </>
  );
}
