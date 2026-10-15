"use client";

import { useActionState } from "react";
import { saveHomeSection } from "@/app/admin/actions/content";
import { initialFormState } from "@/lib/validation/state";
import type { HomepageSection } from "@/types/db";
import Field, { Check } from "./Field";
import FormMessage from "./FormMessage";
import SubmitButton from "./SubmitButton";

const HAS_IMAGE = new Set(["hero", "about", "contact_cta"]);
const HAS_ITEMS = new Set(["hero", "trust"]);
const HAS_CTA = new Set(["hero", "featured_products", "services", "about", "contact_cta"]);
const HAS_SECONDARY_CTA = new Set(["hero", "contact_cta"]);

export default function HomeSectionForm({ section }: { section: HomepageSection }) {
  const [state, action] = useActionState(saveHomeSection.bind(null, section.key), initialFormState);
  const e = state.errors ?? {};
  const id = (n: string) => `${section.key}-${n}`;
  const cls = (k: string) => `field ${e[k] ? "field-error" : ""}`;
  return (
    <form action={action} className="space-y-4">
      <FormMessage state={state} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id={id("eyebrow")} label="Small label above heading" error={e.eyebrow}><input id={id("eyebrow")} name="eyebrow" defaultValue={section.eyebrow ?? ""} className={cls("eyebrow")} /></Field>
        <Field id={id("order")} label="Display order" error={e.sort_order} hint="Lower numbers appear higher on the page."><input id={id("order")} name="sort_order" type="number" min={0} defaultValue={section.sort_order} className={cls("sort_order")} /></Field>
      </div>
      {section.key !== "trust" ? (
        <>
          <Field id={id("heading")} label="Heading" error={e.heading}><input id={id("heading")} name="heading" defaultValue={section.heading ?? ""} className={cls("heading")} /></Field>
          <Field id={id("body")} label="Description" error={e.body}><textarea id={id("body")} name="body" rows={3} defaultValue={section.body ?? ""} className={cls("body")} /></Field>
        </>
      ) : null}
      {HAS_CTA.has(section.key) ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id={id("pl")} label="Primary button label" error={e.primary_cta_label}><input id={id("pl")} name="primary_cta_label" defaultValue={section.primary_cta_label ?? ""} className={cls("primary_cta_label")} /></Field>
          <Field id={id("ph")} label="Primary button destination" error={e.primary_cta_href} hint="whatsapp, tel, /path or https:// URL"><input id={id("ph")} name="primary_cta_href" defaultValue={section.primary_cta_href ?? ""} className={cls("primary_cta_href")} /></Field>
          {HAS_SECONDARY_CTA.has(section.key) ? (
            <>
              <Field id={id("sl")} label="Secondary button label" error={e.secondary_cta_label}><input id={id("sl")} name="secondary_cta_label" defaultValue={section.secondary_cta_label ?? ""} className={cls("secondary_cta_label")} /></Field>
              <Field id={id("sh")} label="Secondary button destination" error={e.secondary_cta_href}><input id={id("sh")} name="secondary_cta_href" defaultValue={section.secondary_cta_href ?? ""} className={cls("secondary_cta_href")} /></Field>
            </>
          ) : null}
        </div>
      ) : null}
      {HAS_ITEMS.has(section.key) ? (
        <Field id={id("items")} label={section.key === "hero" ? "Highlights (one per line)" : "Strengths (one per line: Title | supporting text)"} hint="Only state things that are true. No invented statistics or certifications.">
          <textarea id={id("items")} name="items" rows={4} defaultValue={section.items.map((i) => (i.text ? `${i.title} | ${i.text}` : i.title)).join("\n")} className="field" />
        </Field>
      ) : null}
      {HAS_IMAGE.has(section.key) ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id={id("image")} label={section.image_public_id ? "Replace image" : "Image"}><input id={id("image")} name="image" type="file" accept="image/jpeg,image/png,image/webp" className="field" /></Field>
          <Field id={id("alt")} label="Image alt text" error={e.image_alt}><input id={id("alt")} name="image_alt" defaultValue={section.image_alt ?? ""} className={cls("image_alt")} /></Field>
        </div>
      ) : null}
      <Check name="is_visible" label="Visible on homepage" defaultChecked={section.is_visible} />
      <SubmitButton>Save section</SubmitButton>
    </form>
  );
}
