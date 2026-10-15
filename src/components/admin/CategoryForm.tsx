"use client";

import { useActionState } from "react";
import { saveCategory } from "@/app/admin/actions/categories";
import { initialFormState } from "@/lib/validation/state";
import type { Category } from "@/types/db";
import Field, { Check } from "./Field";
import FormMessage from "./FormMessage";
import SubmitButton from "./SubmitButton";

export default function CategoryForm({ category }: { category: Category | null }) {
  const [state, action] = useActionState(saveCategory.bind(null, category?.id ?? null), initialFormState);
  const e = state.errors ?? {};
  const cls = (k: string) => `field ${e[k] ? "field-error" : ""}`;
  return (
    <form action={action} className="space-y-4">
      <FormMessage state={state} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="c-name" label="Name" error={e.name}><input id="c-name" name="name" required defaultValue={category?.name} className={cls("name")} /></Field>
        <Field id="c-slug" label="Slug" error={e.slug} hint="Blank = generated from name."><input id="c-slug" name="slug" defaultValue={category?.slug} className={cls("slug")} /></Field>
        <Field id="c-order" label="Display order" error={e.sort_order}><input id="c-order" name="sort_order" type="number" min={0} defaultValue={category?.sort_order ?? 0} className={cls("sort_order")} /></Field>
        <Field id="c-alt" label="Image alt text" error={e.image_alt}><input id="c-alt" name="image_alt" defaultValue={category?.image_alt ?? ""} className={cls("image_alt")} /></Field>
      </div>
      <Field id="c-desc" label="Description" error={e.description}><textarea id="c-desc" name="description" rows={3} defaultValue={category?.description ?? ""} className={cls("description")} /></Field>
      <Field id="c-image" label={category?.image_public_id ? "Replace image (optional)" : "Image (optional)"}><input id="c-image" name="image" type="file" accept="image/jpeg,image/png,image/webp" className="field" /></Field>
      <Check name="is_active" label="Active (visible on website)" defaultChecked={category?.is_active ?? true} />
      <SubmitButton>{category ? "Save category" : "Create category"}</SubmitButton>
    </form>
  );
}
