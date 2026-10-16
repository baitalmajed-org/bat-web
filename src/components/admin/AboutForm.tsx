"use client";

import { useEffect } from "react";
import { saveAbout } from "@/app/admin/actions/content";
import { useToast } from "@/components/admin/ToastProvider";
import type { PageRow } from "@/types/db";
import Field from "./Field";
import FormMessage from "./FormMessage";
import SubmitButton from "./SubmitButton";
import { ImageUploadField, useDirectImageUpload } from "./ImageUploadField";

export default function AboutForm({ page }: { page: PageRow }) {
  const { state, handleSubmit, isSubmitting, isUploading, progress, clientError, setClientError } =
    useDirectImageUpload("about", saveAbout);
  const { toast } = useToast();

  useEffect(() => {
    if (state.message) {
      if (state.ok) {
        toast.success(state.message);
      } else {
        toast.error(state.message);
      }
    }
  }, [state, toast]);

  const e = state.errors ?? {};
  const c = page.content;
  const ta = (name: string, label: string, value: string, rows = 3, hint?: string) => (
    <Field id={name} label={label} error={e[name]} hint={hint}>
      <textarea id={name} name={name} rows={rows} defaultValue={value} className={`field ${e[name] ? "field-error" : ""}`} />
    </Field>
  );

  return (
    <form action={handleSubmit} className="space-y-5">
      <FormMessage state={state} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="title" label="Page title" error={e.title}>
          <input id="title" name="title" defaultValue={page.title} className="field" />
        </Field>
        <Field id="meta_description" label="Meta description" error={e.meta_description}>
          <input id="meta_description" name="meta_description" defaultValue={page.meta_description ?? ""} className="field" />
        </Field>
      </div>
      {ta("overview", "Company overview", c.overview, 5)}
      <div className="grid gap-4 sm:grid-cols-2">
        {ta("mission", "Mission (hidden when empty)", c.mission)}
        {ta("vision", "Vision (hidden when empty)", c.vision)}
      </div>
      {ta("quality", "Quality and reliability approach (hidden when empty)", c.quality)}
      <div className="grid gap-4 sm:grid-cols-2">
        {ta("capabilities", "Manufacturing and fabrication capabilities", c.capabilities.join("\n"), 4, "One per line.")}
        {ta("industries", "Industry applications", c.industries.join("\n"), 4, "One per line.")}
        {ta("strengths", "Company strengths", c.strengths.join("\n"), 4, "One per line.")}
        {ta("certifications", "Certifications", c.certifications.join("\n"), 4, "Only add certifications you actually hold. Hidden when empty.")}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="founded" label="Established (optional)" hint="Only enter a verified year. Hidden when empty.">
          <input id="founded" name="founded" defaultValue={c.founded} className="field" />
        </Field>
        <Field id="team_size" label="Team size (optional)" hint="Hidden when empty.">
          <input id="team_size" name="team_size" defaultValue={c.team_size} className="field" />
        </Field>
      </div>
      <ImageUploadField
        id="image"
        name="image"
        purpose="about"
        label={page.hero_image_public_id ? "Replace page image" : "Page image"}
        error={clientError}
        isUploading={isUploading}
        progress={progress}
        onError={setClientError}
        hint="Upload About page image up to 5 MB."
      />
      <SubmitButton
        disabled={isSubmitting}
        pendingLabel={isUploading ? `Uploading image (${progress ?? 0}%)...` : "Saving about page..."}
      >
        Save about page
      </SubmitButton>
    </form>
  );
}
