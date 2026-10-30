import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { requireAdmin } from "@/lib/supabase/auth";
import { getAdminBlog } from "@/lib/data/admin";
import { deleteBlog, removeBlogImage } from "@/app/admin/actions/blogs";
import PageHeader from "@/components/admin/PageHeader";
import BlogForm from "@/components/admin/BlogForm";
import ConfirmDialog from "@/components/admin/ConfirmDialog";

export default async function EditBlogPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const blog = await getAdminBlog(id);
  if (!blog) notFound();

  return (
    <>
      <PageHeader
        title={`Edit: ${blog.title}`}
        description={`Published at ${new Date(blog.published_at || blog.created_at).toLocaleDateString()}`}
        actions={
          <div className="flex items-center gap-3">
            {blog.is_published ? (
              <Link
                href={`/blog/${blog.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-outline inline-flex items-center gap-1.5"
              >
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
                View on site
              </Link>
            ) : null}
            <Link href="/admin/blogs" className="btn-outline inline-flex items-center gap-1.5">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Back to articles
            </Link>
          </div>
        }
      />

      <div className="max-w-4xl space-y-6">
        <div className="border border-steel-200 bg-white p-6 shadow-sm">
          <BlogForm blog={blog} />
        </div>

        <section aria-labelledby="danger-zone" className="border border-red-200 bg-red-50/50 p-6">
          <h2 id="danger-zone" className="text-base font-semibold text-red-900">
            Danger zone
          </h2>
          <p className="mt-1 text-sm text-red-700">
            Permanently delete this blog post. Any attached image is removed from Cloudinary if no other content uses it.
          </p>
          <div className="mt-4 flex flex-wrap gap-4">
            {blog.image_public_id ? (
              <ConfirmDialog
                triggerLabel="Remove image from Cloudinary"
                title="Remove image?"
                description="This will clear the image from this post and remove it from Cloudinary if no other item uses it."
                confirmLabel="Remove Image"
                action={removeBlogImage}
                fields={{ id: blog.id }}
              />
            ) : null}
            <ConfirmDialog
              triggerLabel="Delete blog post"
              title="Delete this blog post?"
              description={`Permanently delete "${blog.title}". This action cannot be undone.`}
              confirmLabel="Delete Blog Post"
              action={deleteBlog}
              fields={{ id: blog.id }}
            />
          </div>
        </section>
      </div>
    </>
  );
}

