import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/supabase/auth";
import { getAdminService } from "@/lib/data/admin";
import { deleteService, removeServiceImage, setServicePublished } from "@/app/admin/actions/services";
import PageHeader from "@/components/admin/PageHeader";
import ServiceForm from "@/components/admin/ServiceForm";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import StatusBadge from "@/components/admin/StatusBadge";
import { Thumb } from "@/components/admin/ProductImages";

export default async function EditService({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string; imageError?: string }> }) {
  await requireAdmin();
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const service = await getAdminService(id);
  if (!service) notFound();
  return (
    <>
      <PageHeader title={service.title} description={service.is_sample ? "Sample service: replace the placeholder text with verified information." : undefined}
        actions={<>
          <StatusBadge status={service.is_published ? "published" : "draft"} />
          <Link href={`/admin/preview/services/${service.id}`} className="btn-outline">Preview</Link>
          <form action={setServicePublished}><input type="hidden" name="id" value={service.id} /><input type="hidden" name="publish" value={String(!service.is_published)} /><input type="hidden" name="back" value={`/admin/services/${service.id}/edit`} /><button type="submit" className="btn-dark">{service.is_published ? "Unpublish" : "Publish"}</button></form>
        </>} />
      {sp.created ? <p role="status" className="mb-4 border border-green-300 bg-green-50 p-3 text-sm text-green-800">Service created.</p> : null}
      {sp.imageError ? <p role="alert" className="mb-4 border border-red-300 bg-red-50 p-3 text-sm text-red-800">The service was created but its image could not be uploaded. Try again below.</p> : null}
      <div className="space-y-8">
        <section className="border border-steel-200 bg-white p-5"><ServiceForm service={service} /></section>
        {service.image_public_id ? (
          <section className="border border-steel-200 bg-white p-5" aria-labelledby="img">
            <h2 id="img" className="mb-3 text-lg">Current image</h2>
            <div className="max-w-xs"><Thumb publicId={service.image_public_id} alt={service.image_alt ?? service.title} /></div>
            <div className="mt-3"><ConfirmDialog compact triggerLabel="Remove image" confirmLabel="Remove" title="Remove this image?" description="Deleted from Cloudinary only if no other content uses it." action={removeServiceImage} fields={{ id: service.id }} /></div>
          </section>
        ) : null}
        <section className="border border-red-200 bg-white p-5"><h2 className="mb-2 text-lg text-red-800">Delete service</h2><ConfirmDialog triggerLabel="Delete service" title={`Delete ${service.title}?`} description="This cannot be undone." action={deleteService} fields={{ id: service.id }} /></section>
      </div>
    </>
  );
}
