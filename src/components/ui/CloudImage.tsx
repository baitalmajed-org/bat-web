"use client";

import Image, { type ImageLoaderProps } from "next/image";
import { cloudinaryUrl, type ImagePreset } from "@/lib/cloudinary/urls";

type Props = {
  publicId: string;
  alt: string;
  preset?: ImagePreset;
  sizes?: string;
  priority?: boolean;
  className?: string;
};

/**
 * Cloudinary-delivered responsive image. Uses a custom loader so resizing happens at
 * Cloudinary (f_auto, q_auto) and not in Vercel's image optimizer (saves free-tier quota).
 * The parent must be `relative` and give the image its size (e.g. aspect-[4/3]).
 */
export default function CloudImage({ publicId, alt, preset = "card", sizes = "100vw", priority = false, className }: Props) {
  const loader = ({ src, width }: ImageLoaderProps) => cloudinaryUrl(src, width, preset);
  return (
    <Image
      loader={loader}
      src={publicId}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      loading={priority ? undefined : "lazy"}
      className={className ?? "object-cover"}
    />
  );
}
