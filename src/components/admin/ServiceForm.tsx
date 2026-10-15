"use client";

import { useActionState } from "react";
import Link from "next/link";
import { saveService } from "@/app/admin/actions/services";
import { initialFormState } from "@/lib/validation/state";
import { specsToText } from "@/lib/utils/text";
import { SERVICE_ICON_KEYS } from "@/components/ui/ServiceIcon";
import type { Service } from "@/types/db";
import Field, { Check } from "./Field";
import FormMessage from "./FormMessage";
import SubmitButton from "./SubmitButton";

export default function ServiceForm({ service }: { service: Service | null }) {
  const [state, action] = useActionState(saveService.bind(null, service?.id ?? null), initialFormState);
  const e = state.errors ?? {};
  const cls = (k: string) => `field ${e[k] ? "field-error" : ""}`;
  return (
    <form action={action} className="space-y-5">
      <FormMessage state={state} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="title" label="Title" error={e.title}><input id="title" name="title" required defaultValue={service?.title} className={cls("title")} /></Field>
        <Field id="slug" label="Slug (URL)" error={e.slug} hint="Blank = generated from title."><input id="slug" name="slug" defaultValue={service?.slug} className={cls("slug")} /></Field>
        <Field id="icon" label="Icon" error={e.icon}>
          <select id="icon" name="icon" defaultValue={service?.icon ?? ""} className={cls("icon")}><option value="">Default</option>{SERVICE_ICON_KEYS.map((k) => <option key={k} value={k}>{k}</option>)}</select>
        </Field>
        <Field id="sort_order" label="Display order" error={e.sort_order}><input id="sort_order" name="sort_order" type="number" min={0} defaultValue={service?.sort_order ?? 0} className={cls("sort_order")} /></Field>
      </div>
      <Field id="short_description" label="Short description" error={e.short_description}><textarea id="short_description" name="short_description" rows={2} defaultValue={service?.short_description ?? ""} className={cls("short_description")} /></Field>
      <Field id="description" label="Detailed description" error={e.description}><textarea id="description" name="description" rows={7} defaultValue={service?.description ?? ""} className={cls("description")} /></Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="specifications" label="Specifications (optional)" hint="One per line as Label: value."><textarea id="specifications" name="specifications" rows={4} defaultValue={specsToText(service?.specifications)} className="field font-mono" /></Field>
        <Field id="applications" label="Relevant applications" hint="One per line."><textarea id="applications" name="applications" rows={4} defaultValue={(service?.applications ?? []).join("\n")} className="field" /></Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="image" label={service?.image_public_id ? "Replace image (optional)" : "Image (optional)"}><input id="image" name="image" type="file" accept="image/jpeg,image/png,image/webp" className="field" /></Field>
        <Field id="image_alt" label="Image alt text" error={e.image_alt}><input id="image_alt" name="image_alt" defaultValue={service?.image_alt ?? ""} className={cls("image_alt")} /></Field>
        <Field id="seo_title" label="SEO title (optional)" error={e.seo_title}><input id="seo_title" name="seo_title" defaultValue={service?.seo_title ?? ""} className={cls("seo_title")} /></Field>
        <Field id="seo_description" label="SEO description (optional)" error={e.seo_description}><input id="seo_description" name="seo_description" defaultValue={service?.seo_description ?? ""} className={cls("seo_description")} /></Field>
      </div>
      <div className="flex flex-wrap gap-6">
        <Check name="is_published" label="Published (visible on website)" defaultChecked={service?.is_published} />
        <Check name="show_on_home" label="Show on homepage" defaultChecked={service?.show_on_home ?? true} />
      </div>
      <div className="flex gap-3"><SubmitButton>Save service</SubmitButton><Link href="/admin/services" className="btn-outline">Back to list</Link></div>
    </form>
  );
}
