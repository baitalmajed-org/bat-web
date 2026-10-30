import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, Calendar, Clock } from "lucide-react";
import { getPublicBlogBySlug, getSettings } from "@/lib/data/public";
import { buildMetadata } from "@/lib/seo/metadata";
import { cloudinaryUrl } from "@/lib/cloudinary/urls";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import CloudImage from "@/components/ui/CloudImage";
import ContactButtons from "@/components/ui/ContactButtons";

type Props = { params: Promise<{ slug: string }> };

export const revalidate = 3600;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const blog = await getPublicBlogBySlug(slug);
  if (!blog) return buildMetadata({ title: "Article Not Found", description: "Article not found", path: `/blog/${slug}` });

  const title = blog.seo_title || `${blog.title} | Bait Al Majed Metal Works`;
  const description =
    blog.seo_description || blog.excerpt || blog.content.slice(0, 160).replace(/\s+/g, " ").trim();
  const image = blog.image_public_id ? cloudinaryUrl(blog.image_public_id, 1200, "card") || null : null;

  return buildMetadata({
    title,
    description,
    path: `/blog/${blog.slug}`,
    image,
  });
}

function renderContent(content: string) {
  const paragraphs = content.split(/\n\s*\n/);
  return paragraphs.map((block, idx) => {
    const trimmed = block.trim();
    if (!trimmed) return null;

    if (trimmed.startsWith("### ")) {
      return (
        <h3 key={idx} className="mt-8 mb-3 text-xl font-bold text-steel-900">
          {trimmed.replace(/^###\s+/, "")}
        </h3>
      );
    }
    if (trimmed.startsWith("## ")) {
      return (
        <h2 key={idx} className="mt-10 mb-4 text-2xl font-bold text-steel-900 border-b border-steel-200 pb-2">
          {trimmed.replace(/^##\s+/, "")}
        </h2>
      );
    }
    if (trimmed.startsWith("# ")) {
      return (
        <h2 key={idx} className="mt-10 mb-4 text-2xl font-bold text-steel-900 border-b border-steel-200 pb-2">
          {trimmed.replace(/^#\s+/, "")}
        </h2>
      );
    }
    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      const items = trimmed.split("\n").filter((l) => l.trim().length > 0);
      return (
        <ul key={idx} className="my-4 list-disc pl-6 space-y-1.5 text-steel-700 leading-relaxed">
          {items.map((item, itemIdx) => (
            <li key={itemIdx}>{item.replace(/^[-*]\s+/, "")}</li>
          ))}
        </ul>
      );
    }

    return (
      <p key={idx} className="my-4 text-steel-700 leading-relaxed text-base sm:text-lg whitespace-pre-line">
        {trimmed}
      </p>
    );
  });
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const [blog, settings] = await Promise.all([getPublicBlogBySlug(slug), getSettings()]);
  if (!blog) notFound();

  // Approximate reading time
  const wordCount = blog.content.split(/\s+/).length;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  return (
    <>
      <section className="border-b border-steel-200 bg-steel-50">
        <div className="container-page py-8">
          <Breadcrumbs
            items={[
              { name: "Home", href: "/" },
              { name: "Blog", href: "/blog" },
              { name: blog.title },
            ]}
          />

          <div className="mt-6 max-w-4xl">
            <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-steel-500 uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" aria-hidden="true" />
                {new Date(blog.published_at || blog.created_at).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" aria-hidden="true" />
                {readingTime} min read
              </span>
              <span>•</span>
              <span>Bait Al Majed Metal Works</span>
            </div>

            <h1 className="mt-3 text-3xl font-bold tracking-tight text-steel-900 sm:text-4xl lg:text-5xl leading-tight">
              {blog.title}
            </h1>

            {blog.excerpt ? (
              <p className="mt-4 text-lg text-steel-600 leading-relaxed">
                {blog.excerpt}
              </p>
            ) : null}
          </div>
        </div>
      </section>

      <article className="container-page py-10 max-w-4xl">
        {blog.image_public_id ? (
          <div className="mb-10 overflow-hidden rounded border border-steel-200 bg-steel-100 shadow-sm aspect-[16/9] relative">
            <CloudImage
              publicId={blog.image_public_id}
              alt={blog.image_alt || blog.title}
              preset="hero"
              sizes="(min-width:1024px) 896px, 100vw"
              priority
              className="object-cover"
            />
          </div>
        ) : null}

        <div className="prose prose-steel max-w-none">
          {renderContent(blog.content)}
        </div>

        {/* Article footer */}
        <div className="mt-12 pt-6 border-t border-steel-200 flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-sm font-semibold text-brand hover:underline"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to all articles
          </Link>
        </div>

        {/* Contact CTA */}
        <div className="mt-12 rounded-sm bg-steel-900 p-8 text-white sm:p-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-xl font-bold">Have a custom metal fabrication requirement?</h2>
            <p className="mt-1 text-sm text-steel-300">
              Speak directly with our fabrication engineers for custom specifications and quotations.
            </p>
          </div>
          <ContactButtons
            phone={settings.main_phone}
            whatsapp={settings.whatsapp_number}
            waMessage={`Inquiry following article: ${blog.title}`}
          />
        </div>
      </article>
    </>
  );
}