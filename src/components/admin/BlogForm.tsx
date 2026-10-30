"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { saveBlog } from "@/app/admin/actions/blogs";
import { slugify } from "@/lib/utils/text";
import { useToast } from "@/components/admin/ToastProvider";
import type { Blog } from "@/types/db";
import Field, { Check } from "./Field";
import FormMessage from "./FormMessage";
import SubmitButton from "./SubmitButton";
import { Thumb } from "./ProductImages";
import { ImageUploadField, useDirectImageUpload } from "./ImageUploadField";

interface BlogFormProps {
  blog: Blog | null;
  onSuccess?: (message?: string) => void;
  onCancel?: () => void;
  onChange?: () => void;
}

export default function BlogForm({ blog, onSuccess, onCancel, onChange }: BlogFormProps) {
  const { state, handleSubmit, isSubmitting, isUploading, progress, clientError, setClientError } =
    useDirectImageUpload("blog", saveBlog.bind(null, blog?.id ?? null));
  const { toast } = useToast();

  const [title, setTitle] = useState(blog?.title ?? "");
  const [slug, setSlug] = useState(blog?.slug ?? "");
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(Boolean(blog?.slug));
  const [excerpt, setExcerpt] = useState(blog?.excerpt ?? "");
  const [content, setContent] = useState(blog?.content ?? "");
  const [seoTitle, setSeoTitle] = useState(blog?.seo_title ?? "");
  const [seoDescription, setSeoDescription] = useState(blog?.seo_description ?? "");

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

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!isSlugManuallyEdited) {
      setSlug(slugify(val));
    }
  };

  const handleAutoGenerateMeta = () => {
    const generatedTitle = title ? `${title.trim()} | Bait Al Majed Metal Works` : "";
    let desc = excerpt.trim();
    if (!desc && content) {
      const clean = content.replace(/<[^>]*>?/gm, "").replace(/\s+/g, " ").trim();
      desc = clean.length > 155 ? clean.slice(0, 155).replace(/\s+\S*$/, "") + "..." : clean;
    }
    setSeoTitle(generatedTitle);
    setSeoDescription(desc);
    toast.success("SEO Meta Title and Description generated!");
  };

  const e = state.errors ?? {};
  const cls = (k: string) => `field ${e[k] ? "field-error" : ""}`;

  return (
    <form action={handleSubmit} onChange={onChange} className="space-y-6">
      <FormMessage state={state} />

      {/* Section 1: Article Content */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-steel-500 border-b border-steel-200 pb-1">
          1. Article Details
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="title" label="Blog Title *" error={e.title}>
            <input
              id="title"
              name="title"
              value={title}
              onChange={(evt) => handleTitleChange(evt.target.value)}
              className={cls("title")}
              placeholder="e.g. Modern Steel Fabrication Techniques in UAE"
              required
            />
          </Field>

          <Field
            id="slug"
            label="URL Slug *"
            error={e.slug}
            hint="Lowercase letters, numbers, and hyphens"
          >
            <div className="flex gap-2">
              <input
                id="slug"
                name="slug"
                value={slug}
                onChange={(evt) => {
                  setSlug(evt.target.value);
                  setIsSlugManuallyEdited(true);
                }}
                className={cls("slug")}
                placeholder="modern-steel-fabrication-techniques"
                required
              />
              <button
                type="button"
                onClick={() => setSlug(slugify(title))}
                className="btn-outline text-xs px-2.5 py-1 whitespace-nowrap"
                title="Regenerate from title"
              >
                Auto
              </button>
            </div>
          </Field>
        </div>

        <Field
          id="excerpt"
          label="Short Excerpt (Summary)"
          error={e.excerpt}
          hint="Brief overview shown on cards and preview lists (max 500 characters)"
        >
          <textarea
            id="excerpt"
            name="excerpt"
            rows={2}
            value={excerpt}
            onChange={(evt) => setExcerpt(evt.target.value)}
            className={cls("excerpt")}
            placeholder="A short summary of this article..."
          />
        </Field>

        <Field id="content" label="Article Content *" error={e.content} hint="Write the full body of the blog post.">
          <textarea
            id="content"
            name="content"
            rows={12}
            value={content}
            onChange={(evt) => setContent(evt.target.value)}
            className={`${cls("content")} font-mono text-sm leading-relaxed`}
            placeholder="Write your article content here. You can use multiple paragraphs, headings, and bullet points."
            required
          />
        </Field>
      </div>

      {/* Section 2: Featured Image */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-steel-500 border-b border-steel-200 pb-1">
          2. Featured Image
        </h3>

        {blog?.image_public_id ? (
          <div className="flex items-center gap-4 border border-steel-200 bg-steel-50 p-3">
            <Thumb publicId={blog.image_public_id} alt={blog.image_alt ?? blog.title} />
            <div className="text-xs text-steel-600 flex-1">
              <p className="font-semibold text-steel-900">Current featured image attached</p>
              <p className="mt-0.5">Upload a new image below to replace it, or check the box to remove it.</p>
              <label className="mt-2 inline-flex items-center gap-2 font-medium text-red-700 cursor-pointer">
                <input type="checkbox" name="remove_image" value="1" className="h-4 w-4 accent-red-600" />
                Remove this image
              </label>
            </div>
          </div>
        ) : null}

        <ImageUploadField
          name="image"
          label={blog?.image_public_id ? "Replace Featured Image" : "Upload Featured Image"}
          purpose="blog"
          hint="Upload a landscape image (recommended 1200x630 or 16:9). Maximum size 5 MB."
          error={clientError ?? undefined}
          onError={setClientError}
        />

        <Field id="image_alt" label="Image Alt Text (Accessibility & SEO)" error={e.image_alt}>
          <input
            id="image_alt"
            name="image_alt"
            defaultValue={blog?.image_alt ?? ""}
            className={cls("image_alt")}
            placeholder="Describe the image content for screen readers and SEO"
          />
        </Field>
      </div>

      {/* Section 3: SEO Meta Information */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-steel-200 pb-1">
          <h3 className="text-sm font-bold uppercase tracking-wider text-steel-500">
            3. Search Engine Optimization (SEO)
          </h3>
          <button
            type="button"
            onClick={handleAutoGenerateMeta}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand hover:text-brand-700 bg-brand-50 px-2.5 py-1 rounded border border-brand-200 transition-colors"
          >
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            Auto-generate Meta
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            id="seo_title"
            label="Meta Title"
            error={e.seo_title}
            hint="Auto-generated if left empty. Optimal length 50-60 characters."
          >
            <input
              id="seo_title"
              name="seo_title"
              value={seoTitle}
              onChange={(evt) => setSeoTitle(evt.target.value)}
              className={cls("seo_title")}
              placeholder="e.g. Modern Steel Fabrication Techniques | BAM Metal Works"
            />
          </Field>

          <Field
            id="seo_description"
            label="Meta Description"
            error={e.seo_description}
            hint="Auto-generated if left empty. Optimal length 150-160 characters."
          >
            <textarea
              id="seo_description"
              name="seo_description"
              rows={3}
              value={seoDescription}
              onChange={(evt) => setSeoDescription(evt.target.value)}
              className={cls("seo_description")}
              placeholder="Search snippet summary shown in Google search results"
            />
          </Field>
        </div>
      </div>

      {/* Section 4: Publishing Status */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-steel-500 border-b border-steel-200 pb-1">
          4. Publishing
        </h3>
        <Check
          name="is_published"
          label="Published on website"
          defaultChecked={blog?.is_published ?? true}
          hint="Uncheck to save as a draft. Published blogs are publicly accessible immediately."
        />
      </div>

      <div className="flex items-center gap-3 pt-4 border-t border-steel-200">
        <SubmitButton
          disabled={isSubmitting}
          pendingLabel={isUploading ? `Uploading image (${progress ?? 0}%)...` : "Saving blog post..."}
        >
          {blog ? "Save changes" : "Create blog post"}
        </SubmitButton>
        {onCancel ? (
          <button type="button" onClick={onCancel} className="btn-outline">
            Cancel
          </button>
        ) : (
          <Link href="/admin/blogs" className="btn-outline">
            Cancel
          </Link>
        )}
      </div>
    </form>
  );
}