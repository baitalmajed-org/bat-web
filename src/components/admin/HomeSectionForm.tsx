"use client";

import { useEffect } from "react";
import { saveHomeSection } from "@/app/admin/actions/content";
import { useToast } from "@/components/admin/ToastProvider";
import type { HomepageSection } from "@/types/db";
import Field, { Check } from "./Field";
import FormMessage from "./FormMessage";
import SubmitButton from "./SubmitButton";

const HAS_IMAGE = new Set(["hero", "about", "contact_cta"]);
const HAS_ITEMS = new Set(["hero", "trust"]);
const HAS_CTA = new Set(["hero", "featured_products", "services", "about", "contact_cta"]);
const HAS_SECONDARY_CTA = new Set(["hero", "contact_cta"]);

interface HomeSectionFormProps {
  section: HomepageSection;
  isModal?: boolean;
  onSuccess?: (message?: string) => void;
  onCancel?: () => void;
  onChange?: () => void;
}

import { ImageUploadField, useDirectImageUpload } from "./ImageUploadField";

export default function HomeSectionForm({
  section,
  isModal = false,
  onSuccess,
  onCancel,
  onChange,
}: HomeSectionFormProps) {
  const purpose = section.key === "hero" ? "homepage_hero" : "homepage";
  const {
    state,
    handleSubmit,
    isSubmitting,
    isUploading,
    uploadingField,
    progress,
    clientError,
    fieldErrors,
    setClientError,
  } = useDirectImageUpload(purpose, saveHomeSection.bind(null, section.key));
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
  const id = (n: string) => `${section.key}-${n}`;
  const cls = (k: string) => `field ${e[k] ? "field-error" : ""}`;

  return (
    <form action={handleSubmit} onChange={onChange} className="space-y-4">
      <FormMessage state={state} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id={id("eyebrow")} label="Small label above heading" error={e.eyebrow}>
          <input
            id={id("eyebrow")}
            name="eyebrow"
            defaultValue={section.eyebrow ?? ""}
            placeholder="e.g. Precision Engineering"
            className={cls("eyebrow")}
          />
        </Field>
        <Field
          id={id("order")}
          label="Display order"
          error={e.sort_order}
          hint="Lower numbers appear higher on the page."
        >
          <input
            id={id("order")}
            name="sort_order"
            type="number"
            min={0}
            defaultValue={section.sort_order}
            className={cls("sort_order")}
          />
        </Field>
      </div>

      {section.key !== "trust" ? (
        <>
          <Field id={id("heading")} label="Heading" error={e.heading}>
            <input
              id={id("heading")}
              name="heading"
              defaultValue={section.heading ?? ""}
              placeholder="Main section heading"
              className={cls("heading")}
            />
          </Field>
          <Field id={id("body")} label="Description" error={e.body}>
            <textarea
              id={id("body")}
              name="body"
              rows={3}
              defaultValue={section.body ?? ""}
              placeholder="Supporting descriptive text..."
              className={cls("body")}
            />
          </Field>
        </>
      ) : null}

      {HAS_CTA.has(section.key) ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id={id("pl")} label="Primary button label" error={e.primary_cta_label}>
            <input
              id={id("pl")}
              name="primary_cta_label"
              defaultValue={section.primary_cta_label ?? ""}
              placeholder="e.g. View Products"
              className={cls("primary_cta_label")}
            />
          </Field>
          <Field
            id={id("ph")}
            label="Primary button destination"
            error={e.primary_cta_href}
            hint="whatsapp, tel, /path or https:// URL"
          >
            <input
              id={id("ph")}
              name="primary_cta_href"
              defaultValue={section.primary_cta_href ?? ""}
              placeholder="e.g. /products or tel:+966..."
              className={cls("primary_cta_href")}
            />
          </Field>
          {HAS_SECONDARY_CTA.has(section.key) ? (
            <>
              <Field id={id("sl")} label="Secondary button label" error={e.secondary_cta_label}>
                <input
                  id={id("sl")}
                  name="secondary_cta_label"
                  defaultValue={section.secondary_cta_label ?? ""}
                  placeholder="e.g. Contact Us"
                  className={cls("secondary_cta_label")}
                />
              </Field>
              <Field id={id("sh")} label="Secondary button destination" error={e.secondary_cta_href}>
                <input
                  id={id("sh")}
                  name="secondary_cta_href"
                  defaultValue={section.secondary_cta_href ?? ""}
                  placeholder="e.g. /contact"
                  className={cls("secondary_cta_href")}
                />
              </Field>
            </>
          ) : null}
        </div>
      ) : null}

      {HAS_ITEMS.has(section.key) ? (
        <Field
          id={id("items")}
          label={
            section.key === "hero"
              ? "Highlights (one per line)"
              : "Strengths (one per line: Title | supporting text)"
          }
          hint="Only state verified facts. No invented statistics or certifications."
        >
          <textarea
            id={id("items")}
            name="items"
            rows={4}
            defaultValue={(section.items || [])
              .map((i) => (i.text ? `${i.title} | ${i.text}` : i.title))
              .join("\n")}
            className="field"
          />
        </Field>
      ) : null}

      {HAS_IMAGE.has(section.key) ? (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <ImageUploadField
              id={id("image")}
              name="image"
              purpose={purpose}
              currentPublicId={section.image_public_id}
              label={
                section.key === "hero"
                  ? section.image_public_id
                    ? "Replace desktop background image"
                    : "Desktop background image"
                  : section.image_public_id
                    ? "Replace background image"
                    : "Background image"
              }
              error={fieldErrors.image ?? (uploadingField === "image" ? clientError : null)}
              isUploading={uploadingField === "image"}
              progress={uploadingField === "image" ? progress : null}
              onError={setClientError}
              hint={
                section.key === "hero"
                  ? "Desktop hero banner image up to 8 MB (also used on mobile if no separate mobile banner is set)."
                  : "Homepage section image up to 5 MB."
              }
            />
            <Field id={id("alt")} label="Image alt text" error={e.image_alt}>
              <input
                id={id("alt")}
                name="image_alt"
                defaultValue={section.image_alt ?? ""}
                placeholder="Describe background image"
                className={cls("image_alt")}
              />
            </Field>
          </div>

          {section.key === "hero" ? (
            <div className="grid gap-4 sm:grid-cols-2 pt-2 border-t border-steel-200/70">
              <ImageUploadField
                id={id("mobile_image")}
                name="mobile_image"
                purpose={purpose}
                currentPublicId={section.mobile_image_public_id}
                label={
                  section.mobile_image_public_id
                    ? "Replace mobile background image"
                    : "Mobile background image (optional)"
                }
                error={fieldErrors.mobile_image ?? (uploadingField === "mobile_image" ? clientError : null)}
                isUploading={uploadingField === "mobile_image"}
                progress={uploadingField === "mobile_image" ? progress : null}
                onError={setClientError}
                hint="Displayed on mobile screens (< 768px). If empty, the desktop banner image is displayed on mobile."
              />
              <Field
                id={id("mobile_alt")}
                label="Mobile image alt text"
                error={e.mobile_image_alt}
              >
                <input
                  id={id("mobile_alt")}
                  name="mobile_image_alt"
                  defaultValue={section.mobile_image_alt ?? ""}
                  placeholder="Describe mobile background image"
                  className={cls("mobile_image_alt")}
                />
              </Field>
            </div>
          ) : null}
        </div>
      ) : null}

      <Check
        name="is_visible"
        label="Visible on homepage"
        defaultChecked={section.is_visible}
      />

      <div className="flex items-center gap-3 pt-3 border-t border-steel-200">
        <SubmitButton
          disabled={isSubmitting}
          pendingLabel={isUploading ? `Uploading image (${progress ?? 0}%)...` : "Saving section..."}
        >
          Save section
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
