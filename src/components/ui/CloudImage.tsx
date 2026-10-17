"use client";

import { useState } from "react";
import Image, { type ImageLoaderProps } from "next/image";
import { cloudinaryUrl, cleanPublicId, type ImagePreset } from "@/lib/cloudinary/urls";
import Placeholder from "@/components/ui/Placeholder";

type Props = {
  publicId: string;
  alt: string;
  preset?: ImagePreset;
  sizes?: string;
  priority?: boolean;
  className?: string;
  fallback?: React.ReactNode;
};

/**
 * Cloudinary-delivered responsive image. Uses a custom loader so resizing happens at
 * Cloudinary (f_auto, q_auto) and not in Vercel's image optimizer (saves free-tier quota).
 * The parent must be `relative` and give the image its size (e.g. aspect-[4/3]).
 * If unconfigured or if an error occurs, falls back gracefully to Placeholder or custom fallback.
 */
export default function CloudImage({ publicId, alt, preset = "card", sizes = "100vw", priority = false, className, fallback }: Props) {
  const [hasError, setHasError] = useState(false);
  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const cleaned = cleanPublicId(publicId);

  if (!cloud || !cleaned || hasError) {
    if (fallback) return <div className={`absolute inset-0 ${className ?? ""}`}>{fallback}</div>;
    return <Placeholder label={alt || undefined} className={`absolute inset-0 ${className ?? ""}`} />;
  }

  const loader = ({ src, width }: ImageLoaderProps) => cloudinaryUrl(src, width, preset);
  return (
    <Image
      loader={loader}
      src={cleaned}
      alt={alt || "Bait Al Majed Metal Works"}
      fill
      sizes={sizes}
      priority={priority}
      loading={priority ? undefined : "lazy"}
      className={className ?? "object-cover"}
      onError={() => setHasError(true)}
    />
  );
}

