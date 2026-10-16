"use client";

import { useEffect } from "react";
import { addProductImage, replaceProductImage } from "@/app/admin/actions/products";
import CloudImage from "@/components/ui/CloudImage";
import FormMessage from "./FormMessage";
import SubmitButton from "./SubmitButton";
import { ImageUploadField, useDirectImageUpload } from "./ImageUploadField";
import { useToast } from "./ToastProvider";

export function AddImageForm({ productId }: { productId: string }) {
  const { state, handleSubmit, isSubmitting, isUploading, progress, clientError, setClientError } =
    useDirectImageUpload("product", addProductImage.bind(null, productId));
  const { toast } = useToast();

  useEffect(() => {
    if (state.message) {
      if (state.ok) toast.success(state.message);
      else toast.error(state.message);
    }
  }, [state, toast]);

  return (
    <form action={handleSubmit} className="space-y-4 border border-dashed border-steel-300 p-4 rounded bg-steel-50/50">
      <FormMessage state={state} />

      <ImageUploadField
        id="new-image"
        name="image"
        purpose="product"
        label="Product image"
        required
        error={clientError}
        isUploading={isUploading}
        progress={progress}
        onError={setClientError}
        hint="Upload product photos up to 5 MB. Identical files are reused automatically."
      />

      <div>
        <label htmlFor="new-alt" className="label">Alt text (describe the image for accessibility)</label>
        <input id="new-alt" name="alt_text" maxLength={200} placeholder="e.g. Heavy Duty Wheelbarrow side view" className="field" />
      </div>

      <SubmitButton
        disabled={isSubmitting}
        pendingLabel={isUploading ? `Uploading image (${progress ?? 0}%)...` : "Saving to database..."}
      >
        Upload image
      </SubmitButton>
    </form>
  );
}

export function ReplaceImageForm({ imageId }: { imageId: string }) {
  const { state, handleSubmit, isSubmitting, isUploading, progress, clientError, setClientError } =
    useDirectImageUpload("product", replaceProductImage.bind(null, imageId));
  const { toast } = useToast();

  useEffect(() => {
    if (state.message) {
      if (state.ok) toast.success(state.message);
      else toast.error(state.message);
    }
  }, [state, toast]);

  return (
    <form action={handleSubmit} className="space-y-2">
      <FormMessage state={state} />
      <ImageUploadField
        id={`rep-${imageId}`}
        name="image"
        purpose="product"
        required
        error={clientError}
        isUploading={isUploading}
        progress={progress}
        onError={setClientError}
        hint="JPEG, PNG or WebP, max 5 MB."
      />
      <SubmitButton
        className="btn-outline !min-h-9 !py-1 text-xs w-full"
        disabled={isSubmitting}
        pendingLabel={isUploading ? `Uploading (${progress ?? 0}%)...` : "Replacing..."}
      >
        Replace
      </SubmitButton>
    </form>
  );
}

export function Thumb({ publicId, alt }: { publicId: string; alt: string }) {
  return <div className="relative aspect-[4/3] bg-steel-100"><CloudImage publicId={publicId} alt={alt} preset="card" sizes="240px" /></div>;
}
