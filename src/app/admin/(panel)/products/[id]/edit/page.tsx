import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { requireAdmin } from "@/lib/supabase/auth";
import { getAdminProduct, listAllCategories } from "@/lib/data/admin";
import { deleteProduct, deleteProductImage, makePrimaryImage, setProductPublished, updateImageAlt } from "@/app/admin/actions/products";
import PageHeader from "@/components/admin/PageHeader";
import ProductForm from "@/components/admin/ProductForm";
import { AddImageForm, ReplaceImageForm, Thumb } from "@/components/admin/ProductImages";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import StatusBadge from "@/components/admin/StatusBadge";

export default async function EditProduct({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string }> }) {
  await requireAdmin();
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const [product, categories] = await Promise.all([getAdminProduct(id), listAllCategories()]);
  if (!product) notFound();

  return (
    <>
      <PageHeader
        title={product.name}
        description={product.is_sample ? "Sample product: replace the placeholder details with verified information." : undefined}
        actions={
          <>
            <StatusBadge status={product.is_published ? "published" : "draft"} />
            <Link href={`/admin/preview/products/${product.id}`} className="btn-outline"><ExternalLink className="h-4 w-4" aria-hidden /> Preview</Link>
            <form action={setProductPublished}>
              <input type="hidden" name="id" value={product.id} /><input type="hidden" name="publish" value={String(!product.is_published)} /><input type="hidden" name="back" value={`/admin/products/${product.id}/edit`} />
              <button type="submit" className="btn-dark">{product.is_published ? "Unpublish" : "Publish"}</button>
            </form>
          </>
        }
      />
      {sp.created ? <p role="status" className="mb-4 border border-green-300 bg-green-50 p-3 text-sm text-green-800">Product created. You can now add images.</p> : null}

      <div className="space-y-8">
        <section className="border border-steel-200 bg-white p-5" aria-labelledby="details"><h2 id="details" className="mb-4 text-lg">Details</h2><ProductForm product={product} categories={categories} /></section>

        <section className="border border-steel-200 bg-white p-5" aria-labelledby="images">
          <h2 id="images" className="mb-4 text-lg">Images</h2>
          {product.product_images.length === 0 ? <p className="mb-4 text-sm text-steel-600">No images yet. The first image becomes the main photo.</p> : (
            <ul className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {product.product_images.map((img, i) => (
                <li key={img.id} className="border border-steel-200">
                  <Thumb publicId={img.public_id} alt={img.alt_text ?? product.name} />
                  <div className="space-y-3 p-3">
                    {i === 0 ? <StatusBadge status="published" label="Main image" /> : (
                      <form action={makePrimaryImage}><input type="hidden" name="imageId" value={img.id} /><input type="hidden" name="productId" value={product.id} /><button className="text-sm text-brand hover:underline" type="submit">Make main image</button></form>
                    )}
                    <form action={updateImageAlt} className="flex gap-2">
                      <input type="hidden" name="imageId" value={img.id} /><input type="hidden" name="productId" value={product.id} />
                      <label htmlFor={`alt-${img.id}`} className="sr-only">Alt text</label>
                      <input id={`alt-${img.id}`} name="alt_text" defaultValue={img.alt_text ?? ""} placeholder="Alt text" maxLength={200} className="field !py-1.5 text-xs" />
                      <button className="btn-outline !min-h-9 !px-3 !py-1 text-xs" type="submit">Save</button>
                    </form>
                    <ReplaceImageForm imageId={img.id} />
                    <ConfirmDialog compact triggerLabel="Remove image" title="Remove this image?" description="The image is removed from this product. It is deleted from Cloudinary only if nothing else uses it." confirmLabel="Remove" action={deleteProductImage} fields={{ imageId: img.id, productId: product.id }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
          <AddImageForm productId={product.id} />
        </section>

        <section className="border border-red-200 bg-white p-5" aria-labelledby="danger">
          <h2 id="danger" className="mb-2 text-lg text-red-800">Delete product</h2>
          <p className="mb-4 text-sm text-steel-600">Permanently removes this product and its images.</p>
          <ConfirmDialog triggerLabel="Delete product" title={`Delete ${product.name}?`} description="This cannot be undone." action={deleteProduct} fields={{ id: product.id }} />
        </section>
      </div>
    </>
  );
}
