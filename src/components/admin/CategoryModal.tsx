"use client";

import { useEffect, useState } from "react";
import Modal from "./Modal";
import CategoryForm from "./CategoryForm";
import type { Category } from "@/types/db";

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: Category | null;
  onSuccess?: () => void;
}

export default function CategoryModal({
  isOpen,
  onClose,
  category,
  onSuccess,
}: CategoryModalProps) {
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsDirty(false);
    }
  }, [isOpen, category]);

  const handleSuccess = () => {
    setIsDirty(false);
    onClose();
    onSuccess?.();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={category ? `Edit Category: ${category.name}` : "New Category"}
      description={
        category
          ? "Update category naming, slug, order, and preview photo."
          : "Organise your products by adding a new product category."
      }
      size="md"
      isDirty={isDirty}
      dirtyConfirmMessage="You have unsaved changes in this category. Are you sure you want to discard them?"
    >
      <CategoryForm
        key={category?.id ?? "new"}
        category={category}
        isModal={true}
        onChange={() => setIsDirty(true)}
        onSuccess={handleSuccess}
        onCancel={onClose}
      />
    </Modal>
  );
}
