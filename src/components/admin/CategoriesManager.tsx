"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus } from "lucide-react";
import StatusBadge from "@/components/admin/StatusBadge";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import CategoryModal from "@/components/admin/CategoryModal";
import { deleteCategory } from "@/app/admin/actions/categories";
import type { Category } from "@/types/db";

interface CategoryWithCount extends Category {
  product_count: number;
}

interface CategoriesManagerProps {
  categories: CategoryWithCount[];
  initialEditId?: string | null;
}

export default function CategoriesManager({
  categories,
  initialEditId,
}: CategoriesManagerProps) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  // Automatically open edit modal if initialEditId query parameter was passed
  useEffect(() => {
    if (initialEditId) {
      const match = categories.find((c) => c.id === initialEditId);
      if (match) {
        setSelectedCategory(match);
        setModalOpen(true);
      }
    }
  }, [initialEditId, categories]);

  const handleOpenCreate = () => {
    setSelectedCategory(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (category: Category) => {
    setSelectedCategory(category);
    setModalOpen(true);
  };

  const handleClose = () => {
    setModalOpen(false);
    setSelectedCategory(null);
  };

  const handleSuccess = () => {
    router.refresh();
  };

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-steel-600 font-medium">
          {categories.length} total categor{categories.length === 1 ? "y" : "ies"}
        </p>
        <button
          type="button"
          onClick={handleOpenCreate}
          className="btn-primary inline-flex items-center gap-1.5"
        >
          <Plus className="h-4 w-4" aria-hidden="true" /> New category
        </button>
      </div>

      <div className="overflow-x-auto border border-steel-200 bg-white">
        <table className="w-full min-w-[32rem] text-sm">
          <thead className="bg-steel-100 text-left text-xs uppercase tracking-wider text-steel-600">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">Products</th>
              <th className="p-3">Order</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-steel-500">
                  No categories found. Click &quot;New category&quot; to add one.
                </td>
              </tr>
            ) : (
              categories.map((c) => (
                <tr
                  key={c.id}
                  className="border-t border-steel-200 hover:bg-steel-50/50 transition-colors"
                >
                  <td className="p-3">
                    <p className="font-semibold text-steel-900">{c.name}</p>
                    <p className="text-xs text-steel-500">/{c.slug}</p>
                  </td>
                  <td className="p-3 text-steel-700">{c.product_count}</td>
                  <td className="p-3 text-steel-700">{c.sort_order}</td>
                  <td className="p-3">
                    <StatusBadge status={c.is_active ? "active" : "inactive"} />
                  </td>
                  <td className="p-3">
                    <div className="flex items-center justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(c)}
                        className="inline-flex items-center gap-1 text-brand font-medium hover:underline focus:outline-none focus-visible:ring-1 focus-visible:ring-brand rounded"
                      >
                        <Pencil className="h-4 w-4" aria-hidden="true" /> Edit
                      </button>
                      <ConfirmDialog
                        compact
                        triggerLabel="Delete"
                        title={`Delete ${c.name}?`}
                        description={
                          c.product_count > 0
                            ? `This category has ${c.product_count} product(s). Choose where to move them.`
                            : "This permanently deletes this category. This cannot be undone."
                        }
                        action={deleteCategory}
                        fields={{ id: c.id }}
                      >
                        {c.product_count > 0 ? (
                          <div className="mt-2">
                            <label htmlFor={`move-${c.id}`} className="label">
                              Move products to
                            </label>
                            <select
                              id={`move-${c.id}`}
                              name="moveTo"
                              required
                              className="field"
                            >
                              <option value="">Choose a category</option>
                              {categories
                                .filter((o) => o.id !== c.id)
                                .map((o) => (
                                  <option key={o.id} value={o.id}>
                                    {o.name}
                                  </option>
                                ))}
                            </select>
                          </div>
                        ) : null}
                      </ConfirmDialog>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Dialog for Category Create and Edit */}
      <CategoryModal
        isOpen={modalOpen}
        onClose={handleClose}
        category={selectedCategory}
        onSuccess={handleSuccess}
      />
    </>
  );
}
