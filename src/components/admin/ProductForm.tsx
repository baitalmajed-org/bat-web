"use client";

import { useActionState } from "react";
import Link from "next/link";
import { saveProduct } from "@/app/admin/actions/products";
import { initialFormState } from "@/lib/validation/state";
import { specsToText } from "@/lib/utils/text";
import type { Category, Product } from "@/types/db";
import Field, { Check } from "./Field";
import FormMessage from "./FormMessage";
import SubmitButton from "./SubmitButton";

export default function ProductForm({ product, categories }: { product: Product | null; categories: Pick<Category, "id" | "name">[] }) {
  const [state, action] = useActionState(saveProduct.bind(null, product?.id ?? null), initialFormState);
  const e = state.errors ?? {};
  const cls = (k: string) => `field ${e[k] ? "field-error" : ""}`;
  return (
    <form action={action} className="space-y-5">
      <FormMessage state={state} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="name" label="Name" error={e.name}><input id="name" name="name" required defaultValue={product?.name} className={cls("name")} /></Field>
        <Field id="slug" label="Slug (URL)" error={e.slug} hint="Leave blank to generate from the name."><input id="slug" name="slug" defaultValue={product?.slug} className={cls("slug")} /></Field>
        <Field id="category_id" label="Category" error={e.category_id}>
          <select id="category_id" name="category_id" defaultValue={product?.category_id ?? ""} className={cls("category_id")}>
            <option value="">No category</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Field>
        <Field id="sort_order" label="Display order" error={e.sort_order} hint="Lower numbers appear first."><input id="sort_order" name="sort_order" type="number" min={0} defaultValue={product?.sort_order ?? 0} className={cls("sort_order")} /></Field>
      </div>
      <Field id="short_description" label="Short description" error={e.short_description} hint="Shown on cards. Max 300 characters."><textarea id="short_description" name="short_description" rows={2} defaultValue={product?.short_description ?? ""} className={cls("short_description")} /></Field>
      <Field id="description" label="Detailed description" error={e.description}><textarea id="description" name="description" rows={7} defaultValue={product?.description ?? ""} className={cls("description")} /></Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="specifications" label="Specifications" hint="One per line as Label: value (e.g. Capacity: 90 L). Only enter verified data."><textarea id="specifications" name="specifications" rows={5} defaultValue={specsToText(product?.specifications)} className="field font-mono" /></Field>
        <Field id="applications" label="Industry applications" hint="One per line."><textarea id="applications" name="applications" rows={5} defaultValue={(product?.applications ?? []).join("\n")} className="field" /></Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="seo_title" label="SEO title (optional)" error={e.seo_title}><input id="seo_title" name="seo_title" defaultValue={product?.seo_title ?? ""} className={cls("seo_title")} /></Field>
        <Field id="seo_description" label="SEO description (optional)" error={e.seo_description}><input id="seo_description" name="seo_description" defaultValue={product?.seo_description ?? ""} className={cls("seo_description")} /></Field>
      </div>
      <div className="flex flex-wrap gap-6">
        <Check name="is_published" label="Published (visible on website)" defaultChecked={product?.is_published} />
        <Check name="is_featured" label="Featured on homepage" defaultChecked={product?.is_featured} />
      </div>
      <div className="flex gap-3">
        <SubmitButton>Save product</SubmitButton>
        <Link href="/admin/products" className="btn-outline">Back to list</Link>
      </div>
    </form>
  );
}
