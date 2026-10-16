"use client";

import { useEffect } from "react";
import { uploadLibraryImage } from "@/app/admin/actions/content";
import { useToast } from "@/components/admin/ToastProvider";
import FormMessage from "./FormMessage";
import SubmitButton from "./SubmitButton";
import { ImageUploadField, useDirectImageUpload } from "./ImageUploadField";

interface LibraryUploadProps {
  isModal?: boolean;
  onSuccess?: (message?: string) => void;
  onCancel?: () => void;
  onChange?: () => void;
}

export default function LibraryUpload({
  isModal = false,
  onSuccess,
  onCancel,
  onChange,
}: LibraryUploadProps) {
  const { state, handleSubmit, isSubmitting, isUploading, progress, clientError, setClientError } =
    useDirectImageUpload("library", uploadLibraryImage);
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

  return (
    <form action={handleSubmit} onChange={onChange} className="space-y-4">
      {isModal ? <input type="hidden" name="modal" value="1" /> : null}
      <FormMessage state={state} />

      <ImageUploadField
        id="lib-image"
        name="image"
        purpose="library"
        label="Image file"
        required
        error={clientError}
        isUploading={isUploading}
        progress={progress}
        onError={setClientError}
        hint="Upload media library assets up to 8 MB. Files are stored on Cloudinary."
      />

      <div>
        <label htmlFor="lib-alt" className="label">
          Alt text / Description (optional)
        </label>
        <input
          id="lib-alt"
          name="alt_text"
          maxLength={200}
          placeholder="Briefly describe the image for accessibility"
          className="field"
        />
      </div>

      <div className="flex items-center gap-3 pt-2">
        <SubmitButton
          disabled={isSubmitting}
          pendingLabel={isUploading ? `Uploading image (${progress ?? 0}%)...` : "Saving to library..."}
        >
          Upload image
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
