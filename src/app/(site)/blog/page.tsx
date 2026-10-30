import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Calendar, BookOpen } from "lucide-react";
import { listPublicBlogs, getSettings } from "@/lib/data/public";
import { buildMetadata } from "@/lib/seo/metadata";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import CloudImage from "@/components/ui/CloudImage";
import ContactButtons from "@/components/ui/ContactButtons";

export const revalidate = 3600;

export const metadata: Metadata = buildMetadata({
  title: "Blog & Industry Insights",
  description: "Expert articles, technical insights, and company updates on industrial steel fabrication, metal works, and welding standards in UAE.",
  path: "/blog",
});

export default async function BlogListingPage() {
  const [blogs, settings] = await Promise.all([listPublicBlogs(), getSettings()]);

  return (
    <>
      <section className="border-b border-steel-200 bg-steel-50">
        <div className="container-page py-10">
          <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Blog" }]} />
          <h1 className="mt-4 text-3xl sm:text-4xl font-bold text-steel-900">Articles & Insights</h1>
          <p className="mt-2 max-w-2xl text-steel-600">
            Expert fabrication knowledge, metalworking guides, and project updates from Bait Al Majed Metal Works.
          </p>
        </div>
      </section>

      <div className="container-page py-12">
        {blogs.length === 0 ? (
          <div className="border border-dashed border-steel-300 p-12 text-center bg-white rounded-sm">
            <BookOpen className="mx-auto h-12 w-12 text-steel-400 mb-3" aria-hidden="true" />
            <h2 className="text-lg font-semibold text-steel-800">No blog posts published yet</h2>
            <p className="mt-1 text-sm text-steel-500 max-w-md mx-auto">
              We are working on informative guides and articles. Please check back soon or get in touch for custom fabrication inquiries.
            </p>
            <div className="mt-6 flex justify-center">
              <Link href="/contact" className="btn-brand">
                Contact Us
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {blogs.map((b) => (
              <article
                key={b.id}
                className="card flex flex-col overflow-hidden border border-steel-200 bg-white transition-shadow duration-200 hover:shadow-md"
              >
                {b.image_public_id ? (
                  <Link href={`/blog/${b.slug}`} className="block relative aspect-[16/9] overflow-hidden bg-steel-100 group">
                    <CloudImage
                      publicId={b.image_public_id}
                      alt={b.image_alt || b.title}
                      preset="card"
                      sizes="(min-width:1024px) 33vw, (min-width:768px) 50vw, 100vw"
                      className="transition-transform duration-300 group-hover:scale-105"
                    />
                  </Link>
                ) : (
                  <div className="aspect-[16/9] bg-steel-100 flex items-center justify-center text-steel-400">
                    <BookOpen className="h-10 w-10 opacity-40" aria-hidden="true" />
                  </div>
                )}

                <div className="flex flex-1 flex-col p-6">
                  <div className="flex items-center gap-2 text-xs text-steel-500 mb-2">
                    <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                    <time dateTime={b.published_at || b.created_at}>
                      {new Date(b.published_at || b.created_at).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </time>
                  </div>

                  <h2 className="text-xl font-bold text-steel-900 line-clamp-2 hover:text-brand transition-colors">
                    <Link href={`/blog/${b.slug}`}>{b.title}</Link>
                  </h2>

                  {b.excerpt ? (
                    <p className="mt-3 text-sm text-steel-600 line-clamp-3 leading-relaxed flex-1">
                      {b.excerpt}
                    </p>
                  ) : null}

                  <div className="mt-6 pt-4 border-t border-steel-100 flex items-center justify-between">
                    <Link
                      href={`/blog/${b.slug}`}
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:text-brand-700 transition-colors"
                    >
                      Read full article
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Bottom CTA */}
        <div className="mt-16 border-t border-steel-200 pt-10">
          <div className="rounded-sm bg-steel-900 p-8 text-white sm:p-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Need custom fabrication services?</h2>
              <p className="mt-2 text-sm text-steel-300 max-w-xl">
                Contact Bait Al Majed Metal Works for precision welding, laser cutting, and custom steel structures in the UAE.
              </p>
            </div>
            <ContactButtons
              phone={settings.main_phone}
              whatsapp={settings.whatsapp_number}
              waMessage="Hello, I have an inquiry about custom metal fabrication."
            />
          </div>
        </div>
      </div>
    </>
  );
}
