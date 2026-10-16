"use client";

import { useActionState, useEffect } from "react";
import { saveCategory } from "@/app/admin/actions/categories";
import { initialFormState } from "@/lib/validation/state";
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

export default function CategoryForm({
  category,
  isModal = false,
  onSuccess,
  onCancel,
  onChange,
}: CategoryFormProps) {
  const [state, action] = useActionState(
    saveCategory.bind(null, category?.id ?? null),
    initialFormState
  );
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
    <form action={action} onChange={onChange} className="space-y-4">
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

      <Field
        id="c-image"
        label={category?.image_public_id ? "Replace image (optional)" : "Category image (optional)"}
      >
        <input
          id="c-image"
          name="image"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="field"
        />
      </Field>

      <Check
        name="is_active"
        label="Active (visible on website)"
        defaultChecked={category?.is_active ?? true}
      />

      <div className="flex items-center gap-3 pt-3 border-t border-steel-200">
        <SubmitButton pendingLabel={category ? "Saving..." : "Creating..."}>
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
