import { requireAdmin } from "@/lib/supabase/auth";
import { listMedia } from "@/lib/data/admin";
import { isCloudinaryConfigured } from "@/lib/cloudinary/client";
import PageHeader from "@/components/admin/PageHeader";
import Pagination from "@/components/ui/Pagination";
import MediaManager from "@/components/admin/MediaManager";

type SP = Promise<{ page?: string; uploaded?: string; deleted?: string; error?: string }>;

export default async function AdminMedia({ searchParams }: { searchParams: SP }) {
  await requireAdmin();
  const sp = await searchParams;
  const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);
  const { rows, total } = await listMedia(page);
  const totalPages = Math.max(1, Math.ceil(total / 24));

  return (
    <>
      <PageHeader
        title="Media"
        description={`${total} tracked image${total === 1 ? "" : "s"}. Images are assigned inside products, services, homepage sections and settings.`}
      />
      {!isCloudinaryConfigured() ? (
        <p
          role="alert"
          className="mb-4 border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900"
        >
          Cloudinary is not configured. Uploads are disabled.
        </p>
      ) : null}

      <MediaManager rows={rows} total={total} />

      <Pagination page={page} totalPages={totalPages} hrefFor={(p) => `/admin/media?page=${p}`} />
    </>
  );
}
