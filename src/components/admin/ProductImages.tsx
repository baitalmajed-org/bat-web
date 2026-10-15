"use client";

import { useActionState } from "react";
import { addProductImage, replaceProductImage } from "@/app/admin/actions/products";
import { initialFormState } from "@/lib/validation/state";
import CloudImage from "@/components/ui/CloudImage";
import FormMessage from "./FormMessage";
import SubmitButton from "./SubmitButton";

export function AddImageForm({ productId }: { productId: string }) {
  const [state, action] = useActionState(addProductImage.bind(null, productId), initialFormState);
  return (
    <form action={action} className="space-y-3 border border-dashed border-steel-300 p-4">
      <FormMessage state={state} />
      <div className="grid gap-3 sm:grid-cols-2">
        <div><label htmlFor="new-image" className="label">New image</label><input id="new-image" name="image" type="file" accept="image/jpeg,image/png,image/webp" required className="field" /></div>
        <div><label htmlFor="new-alt" className="label">Alt text (describe the image)</label><input id="new-alt" name="alt_text" maxLength={200} className="field" /></div>
      </div>
      <SubmitButton pendingLabel="Uploading...">Upload image</SubmitButton>
      <p className="text-xs text-steel-500">JPEG, PNG or WebP, up to 8 MB. Identical files are reused, not stored twice.</p>
    </form>
  );
}

export function ReplaceImageForm({ imageId }: { imageId: string }) {
  const [state, action] = useActionState(replaceProductImage.bind(null, imageId), initialFormState);
  return (
    <form action={action} className="space-y-2">
      <FormMessage state={state} />
      <label htmlFor={`rep-${imageId}`} className="sr-only">Replacement image</label>
      <input id={`rep-${imageId}`} name="image" type="file" accept="image/jpeg,image/png,image/webp" required className="field !py-1.5 text-xs" />
      <SubmitButton className="btn-outline !min-h-9 !py-1 text-xs" pendingLabel="Replacing...">Replace</SubmitButton>
    </form>
  );
}

export function Thumb({ publicId, alt }: { publicId: string; alt: string }) {
  return <div className="relative aspect-[4/3] bg-steel-100"><CloudImage publicId={publicId} alt={alt} preset="card" sizes="240px" /></div>;
}
