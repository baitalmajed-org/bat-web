import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, CheckCircle2, Factory, HelpCircle, MapPin, ShieldCheck, Truck } from "lucide-react";
import { getProductBySlug, getRelatedProducts, getSettings } from "@/lib/data/public";
import { cloudinaryUrl } from "@/lib/cloudinary/urls";
import { whatsappHref } from "@/lib/config/site";
import { buildMetadata } from "@/lib/seo/metadata";
import { breadcrumbJsonLd, jsonLdString, productJsonLd } from "@/lib/seo/jsonld";
import { PRODUCT_SEO_DATA } from "@/lib/seo/product-seo";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import ProductGallery from "@/components/products/ProductGallery";
import ProductCard from "@/components/products/ProductCard";
import SpecTable from "@/components/ui/SpecTable";
import WhatsAppIcon from "@/components/ui/WhatsAppIcon";
import InquiryForm from "@/components/inquiry/InquiryForm";

export const revalidate = 600;
type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product not found", robots: { index: false } };

  const seoData = PRODUCT_SEO_DATA[product.slug];
  const first = [...product.product_images].sort((a, b) => a.sort_order - b.sort_order)[0];

  const title = product.seo_title || (seoData ? seoData.title : `${product.name} Manufacturer UAE`);
  const description =
    product.seo_description ||
    (seoData
      ? seoData.metaDescription
      : product.short_description || `${product.name} manufactured by Bait Al Majed Metal Works, Ajman, UAE.`);

  return buildMetadata({
    title,
    description,
    path: `/products/${product.slug}`,
    image: first ? cloudinaryUrl(first.public_id, 1200, "card") || null : null,
  });
}

export default async function ProductPage({ params }: { params: Params }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const seoData = PRODUCT_SEO_DATA[product.slug];
  const [settings, related] = await Promise.all([
    getSettings(),
    getRelatedProducts(product.category_id, product.id),
  ]);
  const images = [...product.product_images].sort((a, b) => a.sort_order - b.sort_order);
  const first = images[0];

  const displayH1 = seoData?.h1 || product.name;
  const displayShort =
    product.short_description ||
    seoData?.shortDescription ||
    `${product.name} manufactured by Bait Al Majed Metal Works in Ajman, UAE.`;
  const displayIntro = seoData?.introText;
  const displayApplications =
    product.applications.length > 0 ? product.applications : (seoData?.applications ?? []);
  const faqs = seoData?.faqs ?? [];

  const ld: unknown[] = [
    productJsonLd({
      name: displayH1,
      description: displayShort,
      slug: product.slug,
      image: first ? cloudinaryUrl(first.public_id, 1200, "card") || null : null,
      category: product.categories?.name,
    }),
    breadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: "Products", path: "/products" },
      ...(product.categories
        ? [{ name: product.categories.name, path: `/products?category=${product.categories.slug}` }]
        : []),
      { name: product.name, path: `/products/${product.slug}` },
    ]),
  ];

  return (
    <>
      <div className="container-page py-8">
        <Breadcrumbs
          items={[
            { name: "Home", href: "/" },
            { name: "Products", href: "/products" },
            ...(product.categories
              ? [{ name: product.categories.name, href: `/products?category=${product.categories.slug}` }]
              : []),
            { name: product.name },
          ]}
        />

        <div className="mt-6 grid gap-10 lg:grid-cols-2">
          <ProductGallery images={images} name={product.name} />
          <div>
            {product.categories ? (
              <p className="text-xs font-semibold uppercase tracking-wider text-brand">
                {product.categories.name}
              </p>
            ) : null}
            <h1 className="mt-2 text-2xl sm:text-3xl lg:text-4xl font-extrabold text-steel-900 leading-tight">
              {displayH1}
            </h1>
            {displayShort ? <p className="mt-3 text-lg text-steel-700">{displayShort}</p> : null}

            {product.is_sample && !seoData ? (
              <p className="mt-4 border-l-4 border-steel-400 bg-steel-50 p-3 text-sm text-steel-700">
                Sample listing: details have not been verified yet. Contact us to confirm availability and
                specifications.
              </p>
            ) : null}

            {/* B2B Trust Points */}
            <div className="mt-5 grid grid-cols-2 gap-2 text-xs sm:text-sm text-steel-600">
              <span className="flex items-center gap-1.5 rounded-md bg-steel-50 border border-steel-200 px-2.5 py-1.5 font-medium">
                <Factory className="h-4 w-4 text-brand shrink-0" /> Ajman In-House Factory
              </span>
              <span className="flex items-center gap-1.5 rounded-md bg-steel-50 border border-steel-200 px-2.5 py-1.5 font-medium">
                <Truck className="h-4 w-4 text-brand shrink-0" /> UAE Direct Site Delivery
              </span>
              <span className="flex items-center gap-1.5 rounded-md bg-steel-50 border border-steel-200 px-2.5 py-1.5 font-medium">
                <ShieldCheck className="h-4 w-4 text-brand shrink-0" /> Heavy-Duty Steel Build
              </span>
              <span className="flex items-center gap-1.5 rounded-md bg-steel-50 border border-steel-200 px-2.5 py-1.5 font-medium">
                <MapPin className="h-4 w-4 text-brand shrink-0" /> Wholesale Supply Available
              </span>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href={whatsappHref(
                  settings.whatsapp_number,
                  `Hello Bait Al Majed, I would like to request a quotation for: ${product.name}`
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary"
              >
                <WhatsAppIcon className="h-4 w-4" /> Enquire on WhatsApp
              </a>
              <a href="#enquire" className="btn-outline">
                Request a Quotation
              </a>
            </div>

            {displayIntro ? (
              <div className="mt-8 border-t border-steel-200 pt-6 text-steel-700 leading-relaxed">
                <h2 className="text-base font-bold uppercase tracking-wider text-steel-900 mb-2">
                  Product Overview
                </h2>
                <p className="text-base leading-relaxed">{displayIntro}</p>
              </div>
            ) : product.description ? (
              <div className="mt-8 whitespace-pre-line leading-relaxed text-steel-700">
                {product.description}
              </div>
            ) : null}

            {/* Related Service Cross-Link */}
            {seoData?.relatedServiceSlug ? (
              <div className="mt-6 rounded-lg border border-brand/20 bg-brand-50/40 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-brand">
                  Manufacturing Service
                </p>
                <p className="text-sm text-steel-700 mt-1">
                  Need custom dimensions or modifications for this product? Explore our{" "}
                  <Link
                    href={`/services/${seoData.relatedServiceSlug}`}
                    className="font-bold text-brand hover:underline inline-flex items-center gap-1"
                  >
                    {seoData.relatedServiceTitle}
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </Link>
                </p>
              </div>
            ) : null}
          </div>
        </div>

        {/* Specifications & Materials */}
        {product.specifications.length > 0 ? (
          <section className="mt-12" aria-labelledby="specs">
            <h2 id="specs" className="mb-4 text-2xl font-bold text-steel-900">
              Technical Specifications
            </h2>
            <SpecTable specs={product.specifications} />
          </section>
        ) : seoData?.materialsAndSpecs && seoData.materialsAndSpecs.length > 0 ? (
          <section className="mt-12" aria-labelledby="specs">
            <h2 id="specs" className="mb-4 text-2xl font-bold text-steel-900">
              Technical Materials & Build Standards
            </h2>
            <div className="overflow-hidden rounded-lg border border-steel-200 bg-white">
              <dl className="divide-y divide-steel-200">
                {seoData.materialsAndSpecs.map((item) => (
                  <div key={item.label} className="grid grid-cols-1 sm:grid-cols-3 px-4 py-3 text-sm">
                    <dt className="font-semibold text-steel-800">{item.label}</dt>
                    <dd className="sm:col-span-2 text-steel-600 mt-0.5 sm:mt-0">{item.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </section>
        ) : null}

        {/* Applications */}
        {displayApplications.length > 0 ? (
          <section className="mt-12" aria-labelledby="apps">
            <h2 id="apps" className="mb-4 text-2xl font-bold text-steel-900">
              Industrial & Construction Applications
            </h2>
            <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {displayApplications.map((a) => (
                <li
                  key={a}
                  className="flex items-center gap-2 rounded-md border border-steel-200 bg-white p-3 text-sm font-medium text-steel-800 shadow-2xs"
                >
                  <CheckCircle2 className="h-4 w-4 text-brand shrink-0" aria-hidden="true" />
                  <span>{a}</span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {/* UAE Market & Supply Section */}
        {seoData?.uaeMarketInfo ? (
          <section className="mt-12 rounded-xl border border-steel-200 bg-steel-50 p-6 sm:p-8" aria-labelledby="uae-supply">
            <div className="flex items-start gap-3">
              <MapPin className="h-6 w-6 text-brand shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <h2 id="uae-supply" className="text-xl font-bold text-steel-900">
                  UAE Supply & Delivery Coverage
                </h2>
                <p className="mt-2 text-sm sm:text-base text-steel-700 leading-relaxed">
                  {seoData.uaeMarketInfo}
                </p>
                <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-steel-600">
                  <span className="rounded-full bg-white border border-steel-200 px-3 py-1">Ajman (Primary Workshop)</span>
                  <span className="rounded-full bg-white border border-steel-200 px-3 py-1">Dubai (All Industrial Zones)</span>
                  <span className="rounded-full bg-white border border-steel-200 px-3 py-1">Sharjah (Al Sajaa & Industrial Areas)</span>
                  <span className="rounded-full bg-white border border-steel-200 px-3 py-1">Abu Dhabi & Al Ain</span>
                  <span className="rounded-full bg-white border border-steel-200 px-3 py-1">Northern Emirates</span>
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {/* FAQs Section */}
        {faqs.length > 0 ? (
          <section className="mt-12" aria-labelledby="faqs-heading">
            <h2 id="faqs-heading" className="text-2xl font-bold text-steel-900 mb-6 flex items-center gap-2">
              <HelpCircle className="h-6 w-6 text-brand" aria-hidden="true" />
              Frequently Asked Questions
            </h2>
            <div className="space-y-4">
              {faqs.map((faq, idx) => (
                <div
                  key={idx}
                  className="rounded-lg border border-steel-200 bg-white p-5 shadow-2xs"
                >
                  <h3 className="text-base font-bold text-steel-900">
                    {faq.question}
                  </h3>
                  <p className="mt-2 text-sm text-steel-700 leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {/* Quotation Request Form */}
        <section
          id="enquire"
          className="mt-14 scroll-mt-24 border border-steel-200 bg-steel-50 p-6 sm:p-8"
          aria-labelledby="enquire-heading"
        >
          <h2 id="enquire-heading" className="text-2xl font-bold text-steel-900">
            Request a Factory Quotation for {product.name}
          </h2>
          <p className="mt-1 text-sm text-steel-600">
            Contact our Ajman manufacturing facility for wholesale quantity discounts, custom sizing, and site delivery terms.
          </p>
          <div className="mt-6 max-w-3xl">
            <InquiryForm
              defaultType="product"
              productId={product.id}
              relatedLabel={product.name}
              defaultSubject={`Quotation Request: ${product.name}`}
              heading={`Inquiry about ${product.name}`}
            />
          </div>
        </section>

        {related.length > 0 ? (
          <section className="mt-14" aria-labelledby="related">
            <h2 id="related" className="mb-6 text-2xl font-bold text-steel-900">
              Related Equipment & Steel Products
            </h2>
            <ul className="grid grid-cols-2 gap-3 sm:gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {related.map((p) => (
                <li key={p.id} className="h-full">
                  <ProductCard product={p} />
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(ld) }} />
    </>
  );
}
