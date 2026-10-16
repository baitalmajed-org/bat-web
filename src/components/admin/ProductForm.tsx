"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { saveProduct } from "@/app/admin/actions/products";
import { initialFormState } from "@/lib/validation/state";
import { slugify, specsToText } from "@/lib/utils/text";
import { useToast } from "@/components/admin/ToastProvider";
import type { Category, Product } from "@/types/db";
import Field, { Check } from "./Field";
import FormMessage from "./FormMessage";
import SubmitButton from "./SubmitButton";

interface ProductFormProps {
  product: Product | null;
  categories: Pick<Category, "id" | "name">[];
  isModal?: boolean;
  onSuccess?: (message?: string) => void;
  onCancel?: () => void;
  onChange?: () => void;
}

export default function ProductForm({
  product,
  categories,
  isModal = false,
  onSuccess,
  onCancel,
  onChange,
}: ProductFormProps) {
  const [state, action] = useActionState(saveProduct.bind(null, product?.id ?? null), initialFormState);
  const { toast } = useToast();

  const [name, setName] = useState(product?.name ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [isCustomSlug, setIsCustomSlug] = useState(Boolean(product?.slug));

  // Sync state when product prop changes (e.g. when loaded in modal)
  useEffect(() => {
    setName(product?.name ?? "");
    setSlug(product?.slug ?? "");
    setIsCustomSlug(Boolean(product?.slug));
  }, [product?.id, product?.name, product?.slug]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setName(newName);
    if (!isCustomSlug) {
      setSlug(slugify(newName));
    }
    onChange?.();
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (!val.trim()) {
      setIsCustomSlug(false);
      setSlug(name.trim() ? slugify(name) : "");
    } else {
      setIsCustomSlug(true);
      setSlug(val);
    }
    onChange?.();
  };

  const handleResetSlug = () => {
    setIsCustomSlug(false);
    setSlug(name.trim() ? slugify(name) : "");
    onChange?.();
  };

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
    <form action={action} onChange={onChange} className="space-y-6">
      {isModal ? <input type="hidden" name="modal" value="1" /> : null}
      <FormMessage state={state} />

      {/* Section 1: Basic Information */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-steel-500 border-b border-steel-200 pb-1">
          1. Basic Information
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="name" label="Product Name" error={e.name}>
            <input
              id="name"
              name="name"
              required
              value={name}
              onChange={handleNameChange}
              placeholder="e.g. Heavy Duty Steel Wheelbarrow"
              className={cls("name")}
            />
          </Field>
          <Field
            id="slug"
            label="Slug (URL)"
            error={e.slug}
            hint={
              isCustomSlug
                ? "Custom URL slug. Clear the field to resume automatic generation from the product name."
                : "Generated from the product name. You can edit it to customize the product URL."
            }
          >
            <div className="relative">
              <input
                id="slug"
                name="slug"
                value={slug}
                onChange={handleSlugChange}
                placeholder="e.g. heavy-duty-steel-wheelbarrow"
                className={`${cls("slug")} ${isCustomSlug ? "pr-16" : ""}`}
              />
              {isCustomSlug ? (
                <button
                  type="button"
                  onClick={handleResetSlug}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] text-brand hover:underline font-semibold bg-white px-2 py-0.5 rounded border border-steel-200"
                  title="Reset slug to auto-generate from product name"
                >
                  Auto
                </button>
              ) : null}
            </div>
          </Field>
          <Field id="category_id" label="Category" error={e.category_id}>
            <select
              id="category_id"
              name="category_id"
              defaultValue={product?.category_id ?? ""}
              className={cls("category_id")}
            >
              <option value="">No category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field id="sort_order" label="Display order" error={e.sort_order} hint="Lower numbers appear first.">
            <input
              id="sort_order"
              name="sort_order"
              type="number"
              min={0}
              defaultValue={product?.sort_order ?? 0}
              className={cls("sort_order")}
            />
          </Field>
        </div>
      </div>

      {/* Section 2: Descriptions */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-steel-500 border-b border-steel-200 pb-1">
          2. Descriptions
        </h3>
        <Field id="short_description" label="Short description" error={e.short_description} hint="Shown on cards. Max 300 characters.">
          <textarea
            id="short_description"
            name="short_description"
            rows={2}
            defaultValue={product?.short_description ?? ""}
            placeholder="Brief overview of the product..."
            className={cls("short_description")}
          />
        </Field>
        <Field id="description" label="Detailed description" error={e.description}>
          <textarea
            id="description"
            name="description"
            rows={5}
            defaultValue={product?.description ?? ""}
            placeholder="Comprehensive description of materials, workmanship, and standards..."
            className={cls("description")}
          />
        </Field>
      </div>

      {/* Section 3: Specifications & Applications */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-steel-500 border-b border-steel-200 pb-1">
          3. Specifications & Applications
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            id="specifications"
            label="Specifications"
            hint="One per line as Label: value (e.g. Material: SS 316). Only enter verified data."
          >
            <textarea
              id="specifications"
              name="specifications"
              rows={4}
              defaultValue={specsToText(product?.specifications)}
              placeholder="Grade: SS 304 / 316&#10;Finish: Brushed / Polished&#10;Warranty: 10 Years"
              className="field font-mono text-xs"
            />
          </Field>
          <Field id="applications" label="Industry applications" hint="One per line.">
            <textarea
              id="applications"
              name="applications"
              rows={4}
              defaultValue={(product?.applications ?? []).join("\n")}
              placeholder="Commercial Buildings&#10;Industrial Facilities&#10;Residential Projects"
              className="field text-xs"
            />
          </Field>
        </div>
      </div>

      {/* Section 4: SEO & Visibility */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-steel-500 border-b border-steel-200 pb-1">
          4. SEO & Visibility
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="seo_title" label="SEO title (optional)" error={e.seo_title}>
            <input
              id="seo_title"
              name="seo_title"
              defaultValue={product?.seo_title ?? ""}
              placeholder="Custom browser tab title"
              className={cls("seo_title")}
            />
          </Field>
          <Field id="seo_description" label="SEO description (optional)" error={e.seo_description}>
            <input
              id="seo_description"
              name="seo_description"
              defaultValue={product?.seo_description ?? ""}
              placeholder="Meta description for search results"
              className={cls("seo_description")}
            />
          </Field>
        </div>
        <div className="flex flex-wrap gap-6 pt-1">
          <Check name="is_published" label="Published (visible on website)" defaultChecked={product?.is_published ?? false} />
          <Check name="is_featured" label="Featured on homepage" defaultChecked={product?.is_featured ?? false} />
        </div>
      </div>

      {/* Form Action Buttons */}
      <div className="flex items-center gap-3 pt-3 border-t border-steel-200">
        <SubmitButton pendingLabel="Saving product...">Save product</SubmitButton>
        {isModal ? (
          <button type="button" onClick={onCancel} className="btn-outline">
            Cancel
          </button>
        ) : (
          <Link href="/admin/products" className="btn-outline">
            Back to list
          </Link>
        )}
      </div>
    </form>
  );
}
