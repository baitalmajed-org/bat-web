import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { MessageCircle } from "lucide-react";
import { getProductBySlug, getRelatedProducts, getSettings } from "@/lib/data/public";
import { cloudinaryUrl } from "@/lib/cloudinary/urls";
import { whatsappHref } from "@/lib/config/site";
import { buildMetadata } from "@/lib/seo/metadata";
import { breadcrumbJsonLd, jsonLdString, productJsonLd } from "@/lib/seo/jsonld";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import ProductGallery from "@/components/products/ProductGallery";
import ProductCard from "@/components/products/ProductCard";
import SpecTable from "@/components/ui/SpecTable";
import InquiryForm from "@/components/inquiry/InquiryForm";

export const revalidate = 600;
type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product not found", robots: { index: false } };
  const first = [...product.product_images].sort((a, b) => a.sort_order - b.sort_order)[0];
  return buildMetadata({
    title: product.seo_title || product.name,
    description: product.seo_description || product.short_description || `${product.name} from Bait Al Majed Metal Works, Ajman, UAE.`,
    path: `/products/${product.slug}`,
    image: first ? cloudinaryUrl(first.public_id, 1200, "card") || null : null,
  });
}

export default async function ProductPage({ params }: { params: Params }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const [settings, related] = await Promise.all([getSettings(), getRelatedProducts(product.category_id, product.id)]);
  const images = [...product.product_images].sort((a, b) => a.sort_order - b.sort_order);
  const first = images[0];
  const ld = [
    productJsonLd({ name: product.name, description: product.short_description, slug: product.slug, image: first ? cloudinaryUrl(first.public_id, 1200, "card") || null : null, category: product.categories?.name }),
    breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Products", path: "/products" }, { name: product.name, path: `/products/${product.slug}` }]),
  ];

  return (
    <>
      <div className="container-page py-8">
        <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Products", href: "/products" }, ...(product.categories ? [{ name: product.categories.name, href: `/products?category=${product.categories.slug}` }] : []), { name: product.name }]} />

        <div className="mt-6 grid gap-10 lg:grid-cols-2">
          <ProductGallery images={images} name={product.name} />
          <div>
            {product.categories ? <p className="text-xs font-semibold uppercase tracking-wider text-brand">{product.categories.name}</p> : null}
            <h1 className="mt-2 text-3xl sm:text-4xl">{product.name}</h1>
            {product.short_description ? <p className="mt-3 text-lg text-steel-700">{product.short_description}</p> : null}
            {product.is_sample ? <p className="mt-4 border-l-4 border-steel-400 bg-steel-50 p-3 text-sm text-steel-700">Sample listing: details have not been verified yet. Contact us to confirm availability and specifications.</p> : null}
            <div className="mt-6 flex flex-wrap gap-3">
              <a href={whatsappHref(settings.whatsapp_number, `Hello, I would like to enquire about: ${product.name}`)} target="_blank" rel="noopener noreferrer" className="btn-primary"><MessageCircle className="h-4 w-4" aria-hidden /> Enquire on WhatsApp</a>
              <a href="#enquire" className="btn-outline">Send an inquiry</a>
            </div>
            {product.description ? <div className="mt-8 whitespace-pre-line leading-relaxed text-steel-700">{product.description}</div> : null}
          </div>
        </div>

        {product.specifications.length > 0 ? (
          <section className="mt-12" aria-labelledby="specs"><h2 id="specs" className="mb-4 text-2xl">Specifications</h2><SpecTable specs={product.specifications} /></section>
        ) : null}
        {product.applications.length > 0 ? (
          <section className="mt-12" aria-labelledby="apps">
            <h2 id="apps" className="mb-4 text-2xl">Applications</h2>
            <ul className="flex flex-wrap gap-2">{product.applications.map((a) => (<li key={a} className="border border-steel-300 px-3 py-1.5 text-sm">{a}</li>))}</ul>
          </section>
        ) : null}

        <section id="enquire" className="mt-14 scroll-mt-24 border border-steel-200 bg-steel-50 p-6 sm:p-8" aria-labelledby="enquire-heading">
          <h2 id="enquire-heading" className="text-2xl">Enquire about {product.name}</h2>
          <div className="mt-6 max-w-3xl">
            <InquiryForm defaultType="product" productId={product.id} relatedLabel={product.name} defaultSubject={`Inquiry: ${product.name}`} heading={`Inquiry about ${product.name}`} />
          </div>
        </section>

        {related.length > 0 ? (
          <section className="mt-14" aria-labelledby="related">
            <h2 id="related" className="mb-6 text-2xl">Related products</h2>
            <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{related.map((p) => (<li key={p.id}><ProductCard product={p} /></li>))}</ul>
          </section>
        ) : null}
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(ld) }} />
    </>
  );
}
