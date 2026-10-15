"use client";

import { useActionState } from "react";
import { saveAbout } from "@/app/admin/actions/content";
import { initialFormState } from "@/lib/validation/state";
import type { PageRow } from "@/types/db";
import Field from "./Field";
import FormMessage from "./FormMessage";
import SubmitButton from "./SubmitButton";

export default function AboutForm({ page }: { page: PageRow }) {
  const [state, action] = useActionState(saveAbout, initialFormState);
  const e = state.errors ?? {};
  const c = page.content;
  const ta = (name: string, label: string, value: string, rows = 3, hint?: string) => (
    <Field id={name} label={label} error={e[name]} hint={hint}><textarea id={name} name={name} rows={rows} defaultValue={value} className={`field ${e[name] ? "field-error" : ""}`} /></Field>
  );
  return (
    <form action={action} className="space-y-5">
      <FormMessage state={state} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="title" label="Page title" error={e.title}><input id="title" name="title" defaultValue={page.title} className="field" /></Field>
        <Field id="meta_description" label="Meta description" error={e.meta_description}><input id="meta_description" name="meta_description" defaultValue={page.meta_description ?? ""} className="field" /></Field>
      </div>
      {ta("overview", "Company overview", c.overview, 5)}
      <div className="grid gap-4 sm:grid-cols-2">{ta("mission", "Mission (hidden when empty)", c.mission)}{ta("vision", "Vision (hidden when empty)", c.vision)}</div>
      {ta("quality", "Quality and reliability approach (hidden when empty)", c.quality)}
      <div className="grid gap-4 sm:grid-cols-2">
        {ta("capabilities", "Manufacturing and fabrication capabilities", c.capabilities.join("\n"), 4, "One per line.")}
        {ta("industries", "Industry applications", c.industries.join("\n"), 4, "One per line.")}
        {ta("strengths", "Company strengths", c.strengths.join("\n"), 4, "One per line.")}
        {ta("certifications", "Certifications", c.certifications.join("\n"), 4, "Only add certifications you actually hold. Hidden when empty.")}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="founded" label="Established (optional)" hint="Only enter a verified year. Hidden when empty."><input id="founded" name="founded" defaultValue={c.founded} className="field" /></Field>
        <Field id="team_size" label="Team size (optional)" hint="Hidden when empty."><input id="team_size" name="team_size" defaultValue={c.team_size} className="field" /></Field>
      </div>
      <Field id="image" label={page.hero_image_public_id ? "Replace page image" : "Page image"}><input id="image" name="image" type="file" accept="image/jpeg,image/png,image/webp" className="field" /></Field>
      <SubmitButton>Save about page</SubmitButton>
    </form>
  );
}
