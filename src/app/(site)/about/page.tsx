import type { Metadata } from "next";
import { DEFAULT_ABOUT, getAboutPage, getHomepageSections, getSettings } from "@/lib/data/public";
import { buildMetadata } from "@/lib/seo/metadata";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import CloudImage from "@/components/ui/CloudImage";
import Placeholder from "@/components/ui/Placeholder";
import ContactCta from "@/components/home/ContactCta";
import type { HomepageSection } from "@/types/db";

export const revalidate = 3600;

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

export default async function AboutPage() {
  const [page, settings, sections] = await Promise.all([
    getAboutPage(),
    getSettings(),
    getHomepageSections(),
  ]);
  const c = page?.content ?? DEFAULT_ABOUT;
  const ctaSection = sections.contact_cta || defaultCtaSection;

  return (
    <>
      <section className="border-b border-steel-200 bg-steel-50">
        <div className="container-page py-10">
          <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "About" }]} />
          <h1 className="mt-4 text-3xl sm:text-4xl font-bold text-steel-900">{page?.title ?? "About Us"}</h1>
        </div>
      </section>

      <div className="container-page grid gap-12 py-12 lg:grid-cols-2 items-start">
        <div className="space-y-8">
          {c.overview ? (
            <p className="whitespace-pre-line text-lg leading-relaxed text-steel-700">{c.overview}</p>
          ) : null}
          {c.mission ? (
            <section>
              <h2 className="text-2xl font-bold text-steel-900">Our mission</h2>
              <p className="mt-3 whitespace-pre-line text-steel-700 leading-relaxed">{c.mission}</p>
            </section>
          ) : null}
          {c.vision ? (
            <section>
              <h2 className="text-2xl font-bold text-steel-900">Our vision</h2>
              <p className="mt-3 whitespace-pre-line text-steel-700 leading-relaxed">{c.vision}</p>
            </section>
          ) : null}
        </div>

        <div className="space-y-6">
          <div className="relative aspect-[4/3] overflow-hidden rounded bg-steel-100 shadow-sm border border-steel-200">
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
      </div>

      <ContactCta section={ctaSection} settings={settings} />
    </>
  );
}
