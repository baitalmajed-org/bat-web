import type { Metadata } from "next";
import { CheckCircle2, Compass, Target } from "lucide-react";
import { DEFAULT_ABOUT, getAboutPage, getFeaturedProducts, getHomepageSections, getProducts, getSettings } from "@/lib/data/public";
import { buildMetadata } from "@/lib/seo/metadata";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import CloudImage from "@/components/ui/CloudImage";
import Placeholder from "@/components/ui/Placeholder";
import ContactCta from "@/components/home/ContactCta";
import ProductCarousel from "@/components/home/ProductCarousel";
import ProductCard from "@/components/products/ProductCard";
import type { HomepageSection } from "@/types/db";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const page = await getAboutPage();
  return buildMetadata({
    title: page?.title ?? "About Us",
    description: page?.meta_description || "About Bait Al Majed Metal Works, a steel fabrication and metal works company in Ajman, UAE.",
    path: "/about",
  });
}

const defaultCtaSection: HomepageSection = {
  id: "contact_cta",
  key: "contact_cta",
  eyebrow: "GET IN TOUCH",
  heading: "Need a Custom Steel Solution?",
  body: "Contact us for product enquiries, custom fabrication requirements or bulk orders.",
  image_public_id: null,
  image_alt: null,
  primary_cta_label: "WhatsApp Now",
  primary_cta_href: null,
  secondary_cta_label: "Contact Us",
  
  secondary_cta_href: "/contact",
  items: [],
  is_visible: true,
  sort_order: 6,
};

const CAPABILITIES = [
  "Welding and fabrication",
  "Custom steel products made to requirement",
];

const INDUSTRIES = [
  "Construction",
  "Industrial",
  "Commercial",
];

const STRENGTHS = [
  "Custom fabrication to your requirement",
  "Based in Ajman, UAE",
];

export default async function AboutPage() {
  const [page, settings, sections, featuredProducts] = await Promise.all([
    getAboutPage(),
    getSettings(),
    getHomepageSections(),
    getFeaturedProducts(),
  ]);
  const c = page?.content ?? DEFAULT_ABOUT;
  const ctaSection = sections.contact_cta || defaultCtaSection;

  const missionText = c.mission?.trim() ?? "";
  const visionText = c.vision?.trim() ?? "";
  const hasMission = Boolean(missionText);
  const hasVision = Boolean(visionText);

  let products = featuredProducts;
  if (products.length === 0) {
    const fallback = await getProducts({ page: 1 });
    products = fallback.items;
  }

  return (
    <>
      <section className="border-b border-steel-200 bg-steel-50">
        <div className="container-page py-10">
          <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "About" }]} />
          <h1 className="mt-4 text-3xl sm:text-4xl font-bold text-steel-900">{page?.title ?? "About Us"}</h1>
        </div>
      </section>

      <div className="container-page py-12 lg:py-16 space-y-12">
        {/* Company Overview & Image */}
        <div className="grid gap-10 lg:grid-cols-2 items-center">
          {c.overview ? (
            <div className="space-y-4">
              <p className="whitespace-pre-line text-lg leading-relaxed text-steel-700">{c.overview}</p>
            </div>
          ) : null}

          <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-steel-100 shadow-sm border border-steel-200">
            {page?.hero_image_public_id ? (
              <CloudImage
                publicId={page.hero_image_public_id}
                alt={page?.title ? `${page.title} workshop` : "About Bait Al Majed Metal Works workshop"}
                preset="about"
                sizes="(min-width:1024px) 50vw, 100vw"
                priority
              />
            ) : (
              <Placeholder label={page?.title ?? "About Bait Al Majed Metal Works"} />
            )}
          </div>
        </div>

        {/* Mission & Vision: Only displayed when data exists in backend */}
        {hasMission || hasVision ? (
          <div className={`grid gap-6 pt-2 ${hasMission && hasVision ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"}`}>
            {hasMission ? (
              <section
                aria-labelledby="about-mission"
                className="relative flex flex-col justify-between overflow-hidden rounded-lg border border-steel-200 bg-white p-7 shadow-xs transition-shadow hover:shadow-md"
              >
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand to-brand-soft" />
                <div>
                  <div className="flex items-center gap-3.5 mb-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand border border-brand-100 shadow-xs">
                      <Target className="h-6 w-6" aria-hidden="true" />
                    </div>
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-brand">Purpose & Direction</span>
                      <h2 id="about-mission" className="text-xl sm:text-2xl font-bold text-steel-900">Our Mission</h2>
                    </div>
                  </div>
                  <p className="whitespace-pre-line text-base text-steel-700 leading-relaxed">{missionText}</p>
                </div>
              </section>
            ) : null}

            {hasVision ? (
              <section
                aria-labelledby="about-vision"
                className="relative flex flex-col justify-between overflow-hidden rounded-lg border border-steel-200 bg-white p-7 shadow-xs transition-shadow hover:shadow-md"
              >
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-soft to-steel-600" />
                <div>
                  <div className="flex items-center gap-3.5 mb-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand border border-brand-100 shadow-xs">
                      <Compass className="h-6 w-6" aria-hidden="true" />
                    </div>
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-brand">Long-Term Goal</span>
                      <h2 id="about-vision" className="text-xl sm:text-2xl font-bold text-steel-900">Our Vision</h2>
                    </div>
                  </div>
                  <p className="whitespace-pre-line text-base text-steel-700 leading-relaxed">{visionText}</p>
                </div>
              </section>
            ) : null}
          </div>
        ) : null}

        {/* Capabilities, Industry Applications & Company Strengths (Clean & Minimal) */}
        <div className="border-t border-steel-200 pt-8 sm:pt-10">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <h3 className="text-lg font-bold text-steel-900 mb-3">Capabilities</h3>
              <ul className="space-y-2 text-sm sm:text-base text-steel-700">
                {CAPABILITIES.map((it) => (
                  <li key={it} className="flex items-start gap-2.5">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand" aria-hidden="true" />
                    <span>{it}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-bold text-steel-900 mb-3">Industry applications</h3>
              <ul className="space-y-2 text-sm sm:text-base text-steel-700">
                {INDUSTRIES.map((it) => (
                  <li key={it} className="flex items-start gap-2.5">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand" aria-hidden="true" />
                    <span>{it}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-bold text-steel-900 mb-3">Company strengths</h3>
              <ul className="space-y-2 text-sm sm:text-base text-steel-700">
                {STRENGTHS.map((it) => (
                  <li key={it} className="flex items-start gap-2.5">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand" aria-hidden="true" />
                    <span>{it}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {products.length > 0 ? (
        <section className="border-t border-steel-200/80 bg-steel-50/50 py-12 sm:py-16" aria-labelledby="about-products-heading">
          <div className="container-page">
            <div className="mb-8">
              <h2 id="about-products-heading" className="section-heading text-2xl sm:text-3xl md:text-4xl font-bold text-steel-900">
                <span>Our Manufacturing </span>
                <span className="section-heading__highlight">Products</span>
              </h2>
            </div>
            <ProductCarousel label="Our Manufacturing Products">
              {products.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  sizes="(min-width:1024px) 296px, (min-width:640px) 272px, 78vw"
                />
              ))}
            </ProductCarousel>
          </div>
        </section>
      ) : null}

      <ContactCta section={ctaSection} settings={settings} />
    </>
  );
}
