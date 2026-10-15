import { requireAdmin } from "@/lib/supabase/auth";
import { listMedia } from "@/lib/data/admin";
import { deleteMedia } from "@/app/admin/actions/content";
import { isCloudinaryConfigured } from "@/lib/cloudinary/client";
import PageHeader from "@/components/admin/PageHeader";
import LibraryUpload from "@/components/admin/LibraryUpload";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import StatusBadge from "@/components/admin/StatusBadge";
import Pagination from "@/components/ui/Pagination";
import { Thumb } from "@/components/admin/ProductImages";

type SP = Promise<{ page?: string; uploaded?: string; deleted?: string; error?: string }>;

export default async function AdminMedia({ searchParams }: { searchParams: SP }) {
  await requireAdmin();
  const sp = await searchParams;
  const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);
  const { rows, total } = await listMedia(page);
  const totalPages = Math.max(1, Math.ceil(total / 24));
  const errors: Record<string, string> = {
    in_use: "That image is still used by website content and was not deleted. Replace it where it is used first.",
    check: "Could not verify whether the image is in use, so it was kept.",
    cloudinary: "Cloudinary could not delete the file. It is marked for retry: press Delete again later.",
  };
  return (
    <>
      <PageHeader title="Media" description={`${total} tracked image${total === 1 ? "" : "s"}. Images are assigned inside products, services, homepage sections and settings.`} />
      {!isCloudinaryConfigured() ? <p role="alert" className="mb-4 border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">Cloudinary is not configured. Uploads are disabled.</p> : null}
      {sp.uploaded ? <p role="status" className="mb-4 border border-green-300 bg-green-50 p-3 text-sm text-green-800">Image uploaded.</p> : null}
      {sp.deleted ? <p role="status" className="mb-4 border border-green-300 bg-green-50 p-3 text-sm text-green-800">Image deleted.</p> : null}
      {sp.error ? <p role="alert" className="mb-4 border border-red-300 bg-red-50 p-3 text-sm text-red-800">{errors[sp.error] ?? "Something went wrong."}</p> : null}

      <section className="mb-8 border border-steel-200 bg-white p-5" aria-labelledby="up"><h2 id="up" className="mb-3 text-lg">Upload to library</h2><LibraryUpload /></section>

      {rows.length === 0 ? <p className="border border-dashed border-steel-300 p-8 text-center text-steel-500">No images yet.</p> : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {rows.map((m) => (
            <li key={m.id} className="border border-steel-200 bg-white">
              <Thumb publicId={m.public_id} alt={m.alt_text ?? ""} />
              <div className="space-y-2 p-3 text-xs">
                <p className="break-all font-mono text-steel-500">{m.public_id}</p>
                <p>{m.width}×{m.height} · {m.bytes ? `${Math.round(m.bytes / 1024)} KB` : ""} · {m.purpose}</p>
                <div className="flex flex-wrap gap-2">
                  <StatusBadge status={m.refs > 0 ? "active" : "pending"} label={m.refs > 0 ? `In use (${m.refs})` : "Unused"} />
                  {m.cleanup_status === "delete_failed" ? <StatusBadge status="failed" label="Delete failed" /> : null}
                </div>
                {m.cleanup_error ? <p className="text-red-700">{m.cleanup_error}</p> : null}
                {m.refs === 0 ? <ConfirmDialog compact triggerLabel={m.cleanup_status === "delete_failed" ? "Retry delete" : "Delete"} title="Delete this image?" description="It is not used anywhere. It will be permanently removed from Cloudinary." action={deleteMedia} fields={{ publicId: m.public_id }} /> : null}
              </div>
            </li>
          ))}
        </ul>
      )}
      <Pagination page={page} totalPages={totalPages} hrefFor={(p) => `/admin/media?page=${p}`} />
    </>
  );
}
