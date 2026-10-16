"use client";

import { useActionState, useEffect } from "react";
import { uploadLibraryImage } from "@/app/admin/actions/content";
import { initialFormState } from "@/lib/validation/state";
import { useToast } from "@/components/admin/ToastProvider";
import FormMessage from "./FormMessage";
import SubmitButton from "./SubmitButton";

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
  const [state, action] = useActionState(uploadLibraryImage, initialFormState);
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
    <form action={action} onChange={onChange} className="space-y-4">
      {isModal ? <input type="hidden" name="modal" value="1" /> : null}
      <FormMessage state={state} />

      <div>
        <label htmlFor="lib-image" className="label">
          Image file (JPEG, PNG or WebP)
        </label>
        <input
          id="lib-image"
          name="image"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          required
          className="field"
        />
        <p className="mt-1 text-xs text-steel-500">Maximum size 8 MB. Files are stored and served via Cloudinary.</p>
      </div>

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
        <SubmitButton pendingLabel="Uploading...">Upload image</SubmitButton>
        {isModal ? (
          <button type="button" onClick={onCancel} className="btn-outline">
            Cancel
          </button>
        ) : null}
      </div>
    </form>
  );
}
