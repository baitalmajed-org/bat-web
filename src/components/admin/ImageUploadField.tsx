"use client";

import { useState, useRef, useEffect, startTransition, useActionState, useId } from "react";
import { type ImagePurpose, getImageLimit, formatFileSize } from "@/lib/cloudinary/limits";
import { validateImageFile } from "@/lib/validation/schemas";
import { uploadDirectToCloudinary } from "@/lib/cloudinary/direct-upload";
import CloudImage from "@/components/ui/CloudImage";
import type { FormState } from "@/lib/validation/state";
import { initialFormState } from "@/lib/validation/state";

export interface ImageUploadFieldProps {
  id?: string;
  name?: string;
  purpose: ImagePurpose;
  label?: string;
  hint?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  currentPublicId?: string | null;
  error?: string | null;
  progress?: number | null;
  isUploading?: boolean;
  onFileSelect?: (file: File | null) => void;
  onError?: (err: string | null) => void;
}

export function ImageUploadField({
  id: explicitId,
  name = "image",
  purpose,
  label,
  hint,
  required = false,
  disabled = false,
  className = "",
  currentPublicId,
  error: externalError,
  progress: externalProgress,
  isUploading: externalIsUploading,
  onFileSelect,
  onError,
}: ImageUploadFieldProps) {
  const generatedId = useId();
  const inputId = explicitId || generatedId;
  const spec = getImageLimit(purpose);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const error = externalError || localError;
  const isUploading = externalIsUploading ?? false;
  const progress = externalProgress ?? null;

  // Cleanup object URL on unmount or file change
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setLocalError(null);
    onError?.(null);

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }

    if (!file) {
      setSelectedFile(null);
      onFileSelect?.(null);
      return;
    }

    // Client-side validation
    const validationMessage = validateImageFile(file, purpose);
    if (validationMessage) {
      setLocalError(validationMessage);
      onError?.(validationMessage);
      setSelectedFile(null);
      onFileSelect?.(null);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    setSelectedFile(file);
    onFileSelect?.(file);
    try {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } catch {
      // Ignore if ObjectURL is not supported in environment
    }
  };

  const handleClear = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setSelectedFile(null);
    setLocalError(null);
    onError?.(null);
    onFileSelect?.(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {label ? (
        <label htmlFor={inputId} className="label flex items-center justify-between">
          <span>
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </span>
          <span className="text-xs font-normal text-steel-500">
            {spec.recommendedTypes} · Max {spec.maxMB} MB
          </span>
        </label>
      ) : null}

      <div className="relative">
        <input
          ref={inputRef}
          id={inputId}
          name={name}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          required={required && !selectedFile}
          disabled={disabled || isUploading}
          onChange={handleChange}
          className="field file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-navy-900 file:text-white hover:file:bg-navy-800 disabled:opacity-50"
        />
      </div>

      {/* Helper text explaining limits and delivery optimization */}
      <div className="text-xs text-steel-500 flex flex-col gap-0.5">
        <p>
          Accepted formats: <strong className="text-steel-700">JPEG, PNG, WebP</strong>. Maximum upload size:{" "}
          <strong className="text-steel-700">{spec.maxMB} MB</strong>.
        </p>
        <p className="text-steel-400">
          Source images are preserved and automatically delivered in optimized, responsive formats.
        </p>
        {hint ? <p className="text-steel-500">{hint}</p> : null}
      </div>

      {/* Error message */}
      {error ? (
        <div role="alert" className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-2.5 py-1.5 font-medium">
          {error}
        </div>
      ) : null}

      {/* Existing image indicator if currentPublicId is supplied and no new file selected */}
      {currentPublicId && !selectedFile ? (
        <div className="flex items-center gap-3 p-2 rounded bg-steel-50/80 border border-steel-200">
          <div className="relative w-12 h-9 rounded overflow-hidden bg-steel-200 shrink-0 border border-steel-300">
            <CloudImage publicId={currentPublicId} alt={label || "Current image"} preset="thumb" sizes="48px" />
          </div>
          <div className="min-w-0 flex-1 text-xs">
            <span className="font-semibold text-steel-700">Current image active</span>
            <p className="text-[11px] text-steel-500 truncate">Choose a file above to replace it.</p>
          </div>
        </div>
      ) : null}

      {/* Selected file preview and upload progress */}
      {selectedFile && previewUrl ? (
        <div className="flex items-center gap-3 p-2.5 rounded bg-steel-50 border border-steel-200">
          {/* Preview thumbnail */}
          <div className="relative w-14 h-14 rounded overflow-hidden bg-steel-200 flex-shrink-0 border border-steel-300">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewUrl} alt="Upload preview" className="w-full h-full object-cover" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-steel-900 truncate">{selectedFile.name}</p>
            <p className="text-xs text-steel-500">
              {formatFileSize(selectedFile.size)} / {spec.maxMB} MB
            </p>

            {/* Progress bar */}
            {isUploading && progress !== null ? (
              <div className="mt-1.5 space-y-1">
                <div className="flex justify-between text-xs text-steel-600 font-medium">
                  <span>Uploading to Cloudinary...</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full bg-steel-200 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-navy-600 h-1.5 rounded-full transition-all duration-200"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            ) : null}
          </div>

          {!isUploading ? (
            <button
              type="button"
              onClick={handleClear}
              className="text-xs text-steel-500 hover:text-red-600 px-2 py-1 rounded hover:bg-steel-100 transition-colors"
            >
              Remove
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

/**
 * Hook to manage direct browser-to-Cloudinary upload within a form.
 * Automatically validates client-side, uploads directly with live progress,
 * removes the multi-megabyte binary payload before submitting to Vercel,
 * and attaches verified direct_asset metadata.
 */
export function useDirectImageUpload(
  purpose: ImagePurpose,
  serverAction: (state: FormState, fd: FormData) => Promise<FormState>,
  fileFieldName = "image"
) {
  const [state, formAction, isPending] = useActionState(serverAction, initialFormState);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [clientError, setClientError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string | null>>({});

  const setFieldError = (field: string, msg: string | null) => {
    setFieldErrors((prev) => ({ ...prev, [field]: msg }));
    if (msg) setClientError(msg);
  };

  const handleSubmit = async (formData: FormData) => {
    setClientError(null);
    setFieldErrors({});
    const fieldsToCheck = Array.from(new Set([fileFieldName, "mobile_image"]));

    for (const fieldName of fieldsToCheck) {
      const file = formData.get(fieldName) as File | null;
      if (file && file.size > 0) {
        // 1. Client-side validation
        const validationError = validateImageFile(file, purpose);
        if (validationError) {
          setFieldError(fieldName, validationError);
          return;
        }

        // 2. Direct upload to Cloudinary with live progress
        setIsUploading(true);
        setUploadingField(fieldName);
        setProgress(0);
        try {
          const asset = await uploadDirectToCloudinary({
            file,
            purpose,
            onProgress: (percent) => setProgress(percent),
          });

          // 3. Remove large binary file from formData so Vercel function stays far below 4.5 MB limit
          formData.delete(fieldName);
          formData.set(`${fieldName}_direct_asset`, JSON.stringify(asset));
          if (fieldName === fileFieldName) {
            formData.set("direct_asset", JSON.stringify(asset));
          }
        } catch (err) {
          setIsUploading(false);
          setUploadingField(null);
          setProgress(null);
          const message = err instanceof Error ? err.message : "Image upload failed";
          setFieldError(fieldName, message);
          return;
        }
        setIsUploading(false);
        setUploadingField(null);
        setProgress(null);
      }
    }

    // 4. Submit form data to server action
    startTransition(() => {
      formAction(formData);
    });
  };

  return {
    state,
    handleSubmit,
    isSubmitting: isPending || isUploading,
    isUploading,
    uploadingField,
    progress,
    clientError,
    fieldErrors,
    setClientError,
    setFieldError,
  };
}
