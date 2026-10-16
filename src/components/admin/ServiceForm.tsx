"use client";

import { useEffect } from "react";
import Link from "next/link";
import { saveService } from "@/app/admin/actions/services";
import { specsToText } from "@/lib/utils/text";
import { SERVICE_ICON_KEYS } from "@/components/ui/ServiceIcon";
import { useToast } from "@/components/admin/ToastProvider";
import type { Service } from "@/types/db";
import Field, { Check } from "./Field";
import FormMessage from "./FormMessage";
import SubmitButton from "./SubmitButton";

import { ImageUploadField, useDirectImageUpload } from "./ImageUploadField";

interface ServiceFormProps {
  service: Service | null;
  isModal?: boolean;
  onSuccess?: (message?: string) => void;
  onCancel?: () => void;
  onChange?: () => void;
}

export default function ServiceForm({
  service,
  isModal = false,
  onSuccess,
  onCancel,
  onChange,
}: ServiceFormProps) {
  const { state, handleSubmit, isSubmitting, isUploading, progress, clientError, setClientError } =
    useDirectImageUpload("service", saveService.bind(null, service?.id ?? null));
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
    <form action={handleSubmit} onChange={onChange} className="space-y-6">
      {isModal ? <input type="hidden" name="modal" value="1" /> : null}
      <FormMessage state={state} />

      {/* Section 1: Service Overview */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-steel-500 border-b border-steel-200 pb-1">
          1. Service Overview
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="title" label="Service Title" error={e.title}>
            <input
              id="title"
              name="title"
              required
              defaultValue={service?.title ?? ""}
              placeholder="e.g. Architectural Metal Fabrication"
              className={cls("title")}
            />
          </Field>
          <Field id="slug" label="Slug (URL)" error={e.slug} hint="Blank = generated from title.">
            <input
              id="slug"
              name="slug"
              defaultValue={service?.slug ?? ""}
              placeholder="e.g. architectural-metal-fabrication"
              className={cls("slug")}
            />
          </Field>
          <Field id="icon" label="Icon" error={e.icon}>
            <select
              id="icon"
              name="icon"
              defaultValue={service?.icon ?? ""}
              className={cls("icon")}
            >
              <option value="">Default (Factory)</option>
              {SERVICE_ICON_KEYS.map((k) => (
                <option key={k} value={k}>
                  {k}
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
              defaultValue={service?.sort_order ?? 0}
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
        <Field id="short_description" label="Short description" error={e.short_description}>
          <textarea
            id="short_description"
            name="short_description"
            rows={2}
            defaultValue={service?.short_description ?? ""}
            placeholder="Brief overview of the service..."
            className={cls("short_description")}
          />
        </Field>
        <Field id="description" label="Detailed description" error={e.description}>
          <textarea
            id="description"
            name="description"
            rows={5}
            defaultValue={service?.description ?? ""}
            placeholder="Comprehensive description of engineering capabilities and standards..."
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
          <Field id="specifications" label="Specifications (optional)" hint="One per line as Label: value.">
            <textarea
              id="specifications"
              name="specifications"
              rows={4}
              defaultValue={specsToText(service?.specifications)}
              placeholder="Tolerances: ±0.5 mm&#10;Capacity: 50 Tons / Month"
              className="field font-mono text-xs"
            />
          </Field>
          <Field id="applications" label="Relevant applications" hint="One per line.">
            <textarea
              id="applications"
              name="applications"
              rows={4}
              defaultValue={(service?.applications ?? []).join("\n")}
              placeholder="Commercial High-Rises&#10;Infrastructure Projects&#10;Luxury Villas"
              className="field text-xs"
            />
          </Field>
        </div>
      </div>

      {/* Section 4: Imagery, SEO & Visibility */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-steel-500 border-b border-steel-200 pb-1">
          4. Media & SEO
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <ImageUploadField
            id="image"
            name="image"
            purpose="service"
            label={service?.image_public_id ? "Replace service photo" : "Service photo (optional)"}
            error={clientError}
            isUploading={isUploading}
            progress={progress}
            onError={setClientError}
            hint="Upload service photo up to 5 MB."
          />
          <Field id="image_alt" label="Image alt text" error={e.image_alt}>
            <input
              id="image_alt"
              name="image_alt"
              defaultValue={service?.image_alt ?? ""}
              placeholder="Describe service photo"
              className={cls("image_alt")}
            />
          </Field>
          <Field id="seo_title" label="SEO title (optional)" error={e.seo_title}>
            <input
              id="seo_title"
              name="seo_title"
              defaultValue={service?.seo_title ?? ""}
              placeholder="Custom SEO title"
              className={cls("seo_title")}
            />
          </Field>
          <Field id="seo_description" label="SEO description (optional)" error={e.seo_description}>
            <input
              id="seo_description"
              name="seo_description"
              defaultValue={service?.seo_description ?? ""}
              placeholder="Custom SEO meta description"
              className={cls("seo_description")}
            />
          </Field>
        </div>

        <div className="flex flex-wrap gap-6 pt-1">
          <Check
            name="is_published"
            label="Published (visible on website)"
            defaultChecked={service?.is_published ?? true}
          />
          <Check
            name="show_on_home"
            label="Show on homepage"
            defaultChecked={service?.show_on_home ?? true}
          />
        </div>
      </div>

      {/* Form Action Buttons */}
      <div className="flex items-center gap-3 pt-3 border-t border-steel-200">
        <SubmitButton
          disabled={isSubmitting}
          pendingLabel={isUploading ? `Uploading image (${progress ?? 0}%)...` : "Saving service..."}
        >
          Save service
        </SubmitButton>
        {isModal ? (
          <button type="button" onClick={onCancel} className="btn-outline">
            Cancel
          </button>
        ) : (
          <Link href="/admin/services" className="btn-outline">
            Back to list
          </Link>
        )}
      </div>
    </form>
  );
}
