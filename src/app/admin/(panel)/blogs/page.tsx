import Link from "next/link";
import { ExternalLink, Plus, Edit } from "lucide-react";
import { requireAdmin } from "@/lib/supabase/auth";
import { ADMIN_PAGE_SIZE, listAdminBlogs } from "@/lib/data/admin";
import { setBlogPublished, deleteBlog } from "@/app/admin/actions/blogs";
import { formatDateTime } from "@/lib/utils/text";
import PageHeader from "@/components/admin/PageHeader";
import StatusBadge from "@/components/admin/StatusBadge";
import Pagination from "@/components/ui/Pagination";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import { Thumb } from "@/components/admin/ProductImages";

type SP = Promise<{ page?: string; q?: string; status?: string }>;

export default async function AdminBlogs({ searchParams }: { searchParams: SP }) {
  await requireAdmin();
  const sp = await searchParams;
  const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);
  const q = sp.q ?? "";
  const status = sp.status ?? "";

  const { rows, total } = await listAdminBlogs({ page, q, status });
  const totalPages = Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE));

  const hrefFor = (p: number) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (status) params.set("status", status);
    params.set("page", String(p));
    return `/admin/blogs?${params}`;
  };

  return (
    <>
      <PageHeader
        title="Blog Articles"
        description={`${total} total articles.`}
        actions={
          <Link href="/admin/blogs/new" className="btn-brand inline-flex items-center gap-1.5">
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add New Blog Post
          </Link>
        }
      />

      <form className="mb-5 flex flex-col gap-3 sm:flex-row" role="search">
        <label htmlFor="q" className="sr-only">Search</label>
        <input
          id="q"
          name="q"
          defaultValue={q}
          placeholder="Search by title or slug..."
          className="field sm:max-w-xs"
        />

        <label htmlFor="status" className="sr-only">Status</label>
        <select id="status" name="status" defaultValue={status} className="field sm:max-w-[10rem]">
          <option value="">All statuses</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>

        <button className="btn-dark px-5" type="submit">Filter</button>
      </form>

      <div className="overflow-x-auto border border-steel-200 bg-white shadow-sm">
        <table className="w-full min-w-[44rem] text-sm">
          <thead className="bg-steel-100 text-left text-xs uppercase tracking-wider text-steel-600">
            <tr>
              <th className="p-3 w-16">Image</th>
              <th className="p-3">Title & Slug</th>
              <th className="p-3">Status</th>
              <th className="p-3">Published Date</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-steel-500">
                  No blog articles found.{" "}
                  <Link href="/admin/blogs/new" className="text-brand font-semibold hover:underline">
                    Create the first article
                  </Link>
                </td>
              </tr>
            ) : (
              rows.map((b) => (
                <tr key={b.id} className="border-t border-steel-200 align-middle hover:bg-steel-50/60 transition-colors">
                  <td className="p-3">
                    {b.image_public_id ? (
                      <Thumb publicId={b.image_public_id} alt={b.image_alt ?? b.title} />
                    ) : (
                      <div className="h-12 w-12 rounded bg-steel-100 flex items-center justify-center text-xs text-steel-400 font-mono">
                        No img
                      </div>
                    )}
                  </td>
                  <td className="p-3">
                    <p className="font-semibold text-steel-900">
                      <Link href={`/admin/blogs/${b.id}/edit`} className="hover:text-brand hover:underline">
                        {b.title}
                      </Link>
                    </p>
                    <p className="text-xs text-steel-500 font-mono mt-0.5">/blog/{b.slug}</p>
                    {b.excerpt ? (
                      <p className="text-xs text-steel-600 line-clamp-1 mt-1">{b.excerpt}</p>
                    ) : null}
                  </td>
                  <td className="p-3 whitespace-nowrap">
                    <StatusBadge status={b.is_published ? "published" : "draft"} />
                  </td>
                  <td className="p-3 whitespace-nowrap text-xs text-steel-600">
                    {formatDateTime(b.published_at || b.created_at)}
                  </td>
                  <td className="p-3 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-2">
                      {b.is_published ? (
                        <Link
                          href={`/blog/${b.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 text-steel-500 hover:text-steel-900"
                          title="View on public website"
                        >
                          <ExternalLink className="h-4 w-4" aria-hidden="true" />
                        </Link>
                      ) : null}

                      <form action={setBlogPublished} className="inline">
                        <input type="hidden" name="id" value={b.id} />
                        <input type="hidden" name="publish" value={b.is_published ? "false" : "true"} />
                        <button
                          type="submit"
                          className="rounded border border-steel-300 px-2.5 py-1 text-xs font-semibold text-steel-700 hover:bg-steel-100 transition-colors"
                        >
                          {b.is_published ? "Unpublish" : "Publish"}
                        </button>
                      </form>

                      <Link
                        href={`/admin/blogs/${b.id}/edit`}
                        className="inline-flex items-center gap-1 rounded border border-steel-300 bg-white px-2.5 py-1 text-xs font-semibold text-steel-700 hover:bg-steel-100 transition-colors"
                      >
                        <Edit className="h-3.5 w-3.5 text-steel-500" aria-hidden="true" />
                        Edit
                      </Link>

                      <ConfirmDialog
                        compact
                        triggerLabel=""
                        title="Delete this blog post?"
                        description="This will permanently delete this article. If an image was uploaded, it is automatically removed from Cloudinary if no other item uses it."
                        confirmLabel="Delete"
                        action={deleteBlog}
                        fields={{ id: b.id }}
                      />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Pagination page={page} totalPages={totalPages} hrefFor={hrefFor} />
    </>
  );
}

