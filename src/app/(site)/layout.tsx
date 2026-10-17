import { getCategories, getServices, getSettings } from "@/lib/data/public";
import { jsonLdString, organizationJsonLd } from "@/lib/seo/jsonld";
import TopContactBar from "@/components/layout/TopContactBar";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [settings, categories, services] = await Promise.all([getSettings(), getCategories(), getServices()]);
  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[60] focus:bg-white focus:px-4 focus:py-2">Skip to content</a>
      <TopContactBar settings={settings} />
      <Header settings={settings} />
      <main id="main">{children}</main>
      <Footer settings={settings} categories={categories} services={services} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(organizationJsonLd(settings)) }} />
    </>
  );
}
