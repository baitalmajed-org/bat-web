"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Pencil, Plus, ExternalLink } from "lucide-react";
import StatusBadge from "@/components/admin/StatusBadge";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import ProductModal from "@/components/admin/ProductModal";
import { setProductPublished, deleteProduct } from "@/app/admin/actions/products";
import type { Category, Product } from "@/types/db";

interface ProductRow extends Pick<Product, "id" | "name" | "slug" | "is_published" | "is_featured" | "is_sample" | "sort_order"> {
  categories: { name: string } | null;
  product_images: { id: string }[];
}

interface ProductsTableClientProps {
  products: ProductRow[];
  categories: Pick<Category, "id" | "name">[];
}

export default function ProductsTableClient({
  products,
  categories,
}: ProductsTableClientProps) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  const handleOpenCreate = () => {
    setSelectedProductId(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (id: string) => {
    setSelectedProductId(id);
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedProductId(null);
  };

  const handleSuccess = () => {
    router.refresh();
  };

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-steel-600 font-medium">Quick Actions:</p>
        <button
          type="button"
          onClick={handleOpenCreate}
          className="btn-primary inline-flex items-center gap-1.5"
        >
          <Plus className="h-4 w-4" aria-hidden="true" /> New product (Modal)
        </button>
      </div>

      <div className="overflow-x-auto border border-steel-200 bg-white">
        <table className="w-full min-w-[40rem] text-sm">
          <thead className="bg-steel-100 text-left text-xs uppercase tracking-wider text-steel-600">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">Category</th>
              <th className="p-3">Images</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-steel-500">
                  No products found.
                </td>
              </tr>
            ) : (
              products.map((p) => (
                <tr key={p.id} className="border-t border-steel-200 hover:bg-steel-50/50 transition-colors">
                  <td className="p-3">
                    <p className="font-semibold text-steel-900">{p.name}</p>
                    <p className="text-xs text-steel-500">
                      /{p.slug}
                      {p.is_sample ? " · sample" : ""}
                      {p.is_featured ? " · featured" : ""}
                    </p>
                  </td>
                  <td className="p-3 text-steel-700">{p.categories?.name ?? "—"}</td>
                  <td className="p-3 text-steel-700">{p.product_images.length}</td>
                  <td className="p-3">
                    <StatusBadge status={p.is_published ? "published" : "draft"} />
                  </td>
                  <td className="p-3">
                    <div className="flex flex-wrap items-center justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(p.id)}
                        className="inline-flex items-center gap-1 text-brand font-medium hover:underline focus:outline-none focus-visible:ring-1 focus-visible:ring-brand rounded"
                      >
                        <Pencil className="h-4 w-4" aria-hidden="true" /> Edit
                      </button>
                      <Link
                        href={`/admin/products/${p.id}/edit`}
                        title="Open full page editor"
                        className="inline-flex items-center gap-0.5 text-xs text-steel-500 hover:text-steel-800 hover:underline"
                      >
                        <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                        <span className="sr-only sm:not-sr-only">Page</span>
                      </Link>
                      <form action={setProductPublished}>
                        <input type="hidden" name="id" value={p.id} />
                        <input type="hidden" name="publish" value={String(!p.is_published)} />
                        <input type="hidden" name="back" value="/admin/products" />
                        <button
                          type="submit"
                          className="inline-flex items-center gap-1 text-xs text-steel-700 hover:text-brand"
                        >
                          {p.is_published ? (
                            <>
                              <EyeOff className="h-3.5 w-3.5" aria-hidden="true" /> Unpublish
                            </>
                          ) : (
                            <>
                              <Eye className="h-3.5 w-3.5" aria-hidden="true" /> Publish
                            </>
                          )}
                        </button>
                      </form>
                      <ConfirmDialog
                        compact
                        triggerLabel="Delete"
                        title={`Delete ${p.name}?`}
                        description="This permanently deletes the product and its images. This cannot be undone."
                        action={deleteProduct}
                        fields={{ id: p.id }}
                      />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Reusable Product Modal */}
      <ProductModal
        isOpen={modalOpen}
        onClose={handleModalClose}
        productId={selectedProductId}
        categories={categories}
        onSuccess={handleSuccess}
      />
    </>
  );
}
