"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { ExternalLink, Images, Info, Loader2 } from "lucide-react";
import Modal from "./Modal";
import ProductForm from "./ProductForm";
import { AddImageForm, ReplaceImageForm, Thumb } from "./ProductImages";
import StatusBadge from "./StatusBadge";
import ConfirmDialog from "./ConfirmDialog";
import { getProductForEdit, deleteProductImage, makePrimaryImage, updateImageAlt } from "@/app/admin/actions/products";
import type { Category, Product, ProductImage } from "@/types/db";

interface ProductWithImages extends Product {
  product_images: ProductImage[];
}

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string | null;
  categories: Pick<Category, "id" | "name">[];
  onSuccess?: () => void;
}

export default function ProductModal({
  isOpen,
  onClose,
  productId,
  categories,
  onSuccess,
}: ProductModalProps) {
  const [product, setProduct] = useState<ProductWithImages | null>(null);
  const [loading, setLoading] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [activeTab, setActiveTab] = useState<"details" | "images">("details");

  const isEdit = Boolean(productId);

  const loadProductData = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const data = await getProductForEdit(id);
      setProduct(data as ProductWithImages | null);
    } catch (err) {
      console.error("Failed to load product for modal edit", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      setIsDirty(false);
      setActiveTab("details");
      if (productId) {
        loadProductData(productId);
      } else {
        setProduct(null);
        setLoading(false);
      }
    } else {
      setProduct(null);
      setIsDirty(false);
    }
  }, [isOpen, productId, loadProductData]);

  const handleSuccess = () => {
    setIsDirty(false);
    onClose();
    onSuccess?.();
  };

  const title = isEdit
    ? loading
      ? "Edit Product"
      : `Edit: ${product?.name ?? "Product"}`
    : "New Product";

  const description = isEdit
    ? "Update product specifications, catalog details, and gallery images."
    : "Fill in the product details below. You can upload images immediately after creating.";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description={description}
      size="xl"
      isDirty={isDirty}
      dirtyConfirmMessage="You have unsaved changes in this product form. Are you sure you want to discard them?"
    >
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 text-steel-500">
          <Loader2 className="h-8 w-8 animate-spin text-brand mb-3" aria-hidden="true" />
          <p className="text-sm font-medium">Loading product details...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Top navigation tabs when editing an existing product */}
          {isEdit && product ? (
            <div className="flex flex-wrap items-center justify-between border-b border-steel-200 pb-3 gap-3">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab("details")}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded transition-colors ${
                    activeTab === "details"
                      ? "bg-brand text-white"
                      : "bg-steel-100 text-steel-700 hover:bg-steel-200"
                  }`}
                >
                  <Info className="h-3.5 w-3.5" aria-hidden="true" /> Product Details
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("images")}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded transition-colors ${
                    activeTab === "images"
                      ? "bg-brand text-white"
                      : "bg-steel-100 text-steel-700 hover:bg-steel-200"
                  }`}
                >
                  <Images className="h-3.5 w-3.5" aria-hidden="true" /> Images (
                  {product.product_images?.length ?? 0})
                </button>
              </div>

              <div className="flex items-center gap-2">
                <StatusBadge status={product.is_published ? "published" : "draft"} />
                <Link
                  href={`/admin/products/${product.id}/edit`}
                  className="inline-flex items-center gap-1 text-xs text-brand hover:underline"
                >
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" /> Full Editor Page
                </Link>
              </div>
            </div>
          ) : null}

          {/* Tab 1: Product Form Details */}
          {activeTab === "details" ? (
            <ProductForm
              key={product?.id ?? "new"}
              product={product}
              categories={categories}
              isModal={true}
              onChange={() => setIsDirty(true)}
              onSuccess={handleSuccess}
              onCancel={onClose}
            />
          ) : null}

          {/* Tab 2: Product Images & Gallery (when editing) */}
          {activeTab === "images" && product ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-steel-900">Product Image Gallery</h3>
                  <p className="text-xs text-steel-600 mt-0.5">
                    The first image is the main display photo shown on catalog cards and headers.
                  </p>
                </div>
              </div>

              {product.product_images.length === 0 ? (
                <div className="border border-dashed border-steel-300 p-8 text-center text-sm text-steel-500">
                  No images uploaded yet. Use the upload box below to add the first image.
                </div>
              ) : (
                <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {product.product_images.map((img, i) => (
                    <li key={img.id} className="border border-steel-200 bg-white">
                      <Thumb publicId={img.public_id} alt={img.alt_text ?? product.name} />
                      <div className="space-y-3 p-3">
                        {i === 0 ? (
                          <StatusBadge status="published" label="Main image" />
                        ) : (
                          <form action={makePrimaryImage}>
                            <input type="hidden" name="imageId" value={img.id} />
                            <input type="hidden" name="productId" value={product.id} />
                            <button className="text-xs text-brand hover:underline font-semibold" type="submit">
                              Make main image
                            </button>
                          </form>
                        )}
                        <form action={updateImageAlt} className="flex gap-2">
                          <input type="hidden" name="imageId" value={img.id} />
                          <input type="hidden" name="productId" value={product.id} />
                          <label htmlFor={`modal-alt-${img.id}`} className="sr-only">
                            Alt text
                          </label>
                          <input
                            id={`modal-alt-${img.id}`}
                            name="alt_text"
                            defaultValue={img.alt_text ?? ""}
                            placeholder="Alt text"
                            maxLength={200}
                            className="field !py-1 text-xs"
                          />
                          <button className="btn-outline !min-h-8 !px-2.5 !py-0.5 text-xs" type="submit">
                            Save
                          </button>
                        </form>
                        <ReplaceImageForm imageId={img.id} />
                        <ConfirmDialog
                          compact
                          triggerLabel="Remove image"
                          title="Remove this image?"
                          description="The image is removed from this product. It is deleted from Cloudinary only if nothing else uses it."
                          confirmLabel="Remove"
                          action={deleteProductImage}
                          fields={{ imageId: img.id, productId: product.id }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              <div className="border-t border-steel-200 pt-4">
                <h4 className="text-sm font-semibold mb-2 text-steel-900">Upload New Photo</h4>
                <AddImageForm productId={product.id} />
              </div>
            </div>
          ) : null}
        </div>
      )}
    </Modal>
  );
}
