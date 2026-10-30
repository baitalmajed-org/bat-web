import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/supabase/auth";
import PageHeader from "@/components/admin/PageHeader";
import BlogForm from "@/components/admin/BlogForm";

export default async function NewBlogPage() {
  await requireAdmin();

  return (
    <>
      <PageHeader
        title="Create New Blog Post"
        description="Write and publish an informative article for your website readers."
        actions={
          <Link href="/admin/blogs" className="btn-outline inline-flex items-center gap-1.5">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to articles
          </Link>
        }
      />

      <div className="max-w-4xl border border-steel-200 bg-white p-6 shadow-sm">
        <BlogForm blog={null} />
      </div>
    </>
  );
}

