"use client";

import { useEffect } from "react";
import { saveCategory } from "@/app/admin/actions/categories";
import { useToast } from "@/components/admin/ToastProvider";
import type { Category } from "@/types/db";
import Field, { Check } from "./Field";
import FormMessage from "./FormMessage";
import SubmitButton from "./SubmitButton";

interface CategoryFormProps {
  category: Category | null;
  isModal?: boolean;
  onSuccess?: (message?: string) => void;
  onCancel?: () => void;
  onChange?: () => void;
}

import { ImageUploadField, useDirectImageUpload } from "./ImageUploadField";

export default function CategoryForm({
  category,
  isModal = false,
  onSuccess,
  onCancel,
  onChange,
}: CategoryFormProps) {
  const { state, handleSubmit, isSubmitting, isUploading, progress, clientError, setClientError } =
    useDirectImageUpload("category", saveCategory.bind(null, category?.id ?? null));
  const { toast } = useToast();

  useEffect(() => {
    if (state.message) {
      if (state.ok) {
        toast.success(state.message);
        onSuccess?.(state.message);
      } else {
        toast.error(state.message);
      }
    }
  }, [state, toast, onSuccess]);

  const e = state.errors ?? {};
  const cls = (k: string) => `field ${e[k] ? "field-error" : ""}`;

  return (
    <form action={handleSubmit} onChange={onChange} className="space-y-4">
      {isModal ? <input type="hidden" name="modal" value="1" /> : null}
      <FormMessage state={state} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="c-name" label="Name" error={e.name}>
          <input
            id="c-name"
            name="name"
            required
            defaultValue={category?.name ?? ""}
            placeholder="e.g. Stainless Steel"
            className={cls("name")}
          />
        </Field>
        <Field id="c-slug" label="Slug (URL)" error={e.slug} hint="Blank = generated from name.">
          <input
            id="c-slug"
            name="slug"
            defaultValue={category?.slug ?? ""}
            placeholder="e.g. stainless-steel"
            className={cls("slug")}
          />
        </Field>
        <Field id="c-order" label="Display order" error={e.sort_order} hint="Lower numbers appear first.">
          <input
            id="c-order"
            name="sort_order"
            type="number"
            min={0}
            defaultValue={category?.sort_order ?? 0}
            className={cls("sort_order")}
          />
        </Field>
        <Field id="c-alt" label="Image alt text" error={e.image_alt}>
          <input
            id="c-alt"
            name="image_alt"
            defaultValue={category?.image_alt ?? ""}
            placeholder="Describe the image"
            className={cls("image_alt")}
          />
        </Field>
      </div>

      <Field id="c-desc" label="Description" error={e.description}>
        <textarea
          id="c-desc"
          name="description"
          rows={3}
          defaultValue={category?.description ?? ""}
          placeholder="Brief description of this product category..."
          className={cls("description")}
        />
      </Field>

      <ImageUploadField
        id="c-image"
        name="image"
        purpose="category"
        label={category?.image_public_id ? "Replace image (optional)" : "Category image (optional)"}
        error={clientError}
        isUploading={isUploading}
        progress={progress}
        onError={setClientError}
        hint="Upload category showcase image up to 5 MB."
      />

      <Check
        name="is_active"
        label="Active (visible on website)"
        defaultChecked={category?.is_active ?? true}
      />

      <div className="flex items-center gap-3 pt-3 border-t border-steel-200">
        <SubmitButton
          disabled={isSubmitting}
          pendingLabel={isUploading ? `Uploading image (${progress ?? 0}%)...` : (category ? "Saving..." : "Creating...")}
        >
          {category ? "Save category" : "Create category"}
        </SubmitButton>
        {isModal ? (
          <button type="button" onClick={onCancel} className="btn-outline">
            Cancel
          </button>
        ) : null}
      </div>
    </form>
  );
}
