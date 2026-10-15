"use client";

import { useActionState } from "react";
import { uploadLibraryImage } from "@/app/admin/actions/content";
import { initialFormState } from "@/lib/validation/state";
import FormMessage from "./FormMessage";
import SubmitButton from "./SubmitButton";

export default function LibraryUpload() {
  const [state, action] = useActionState(uploadLibraryImage, initialFormState);
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-3 sm:items-end">
      <div className="sm:col-span-3"><FormMessage state={state} /></div>
      <div><label htmlFor="lib-image" className="label">Image</label><input id="lib-image" name="image" type="file" accept="image/jpeg,image/png,image/webp" required className="field" /></div>
      <div><label htmlFor="lib-alt" className="label">Alt text</label><input id="lib-alt" name="alt_text" maxLength={200} className="field" /></div>
      <SubmitButton pendingLabel="Uploading...">Upload</SubmitButton>
    </form>
  );
}
