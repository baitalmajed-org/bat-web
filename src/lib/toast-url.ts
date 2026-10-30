import type { ToastType } from "./toast";

export interface UrlToastResult {
  type: ToastType;
  message: string;
}

const NOTIFICATION_PARAM_KEYS = [
  "deleted",
  "created",
  "uploaded",
  "featured",
  "services",
  "saved",
  "published",
  "primary",
  "altSaved",
  "imageDeleted",
  "imageRemoved",
  "logoReset",
  "imageError",
  "error",
  "n",
] as const;

/**
 * Extracts and maps query parameter action feedback into a friendly toast notification.
 */
export function parseUrlToast(
  pathname: string,
  params: URLSearchParams | Record<string, string | undefined>
): UrlToastResult | null {
  const get = (key: string): string | null => {
    if (params instanceof URLSearchParams) {
      return params.get(key);
    }
    const val = params[key];
    return typeof val === "string" ? val : null;
  };

  // Check error parameters first
  const error = get("error");
  if (error) {
    if (error === "delete") {
      if (pathname.includes("/admin/products")) return { type: "error", message: "The product could not be deleted." };
      if (pathname.includes("/admin/services")) return { type: "error", message: "The service could not be deleted." };
      if (pathname.includes("/admin/categories")) return { type: "error", message: "The category could not be deleted." };
      if (pathname.includes("/admin/blogs")) return { type: "error", message: "The blog post could not be deleted." };
      return { type: "error", message: "The item could not be deleted." };
    }
    if (error === "status") return { type: "error", message: "Invalid status." };
    if (error === "in_use") {
      if (pathname.includes("/admin/categories")) {
        const count = get("n") || "some";
        return {
          type: "error",
          message: `That category still has ${count} product(s). Choose another category to move them to, then delete.`,
        };
      }
      return {
        type: "error",
        message: "That image is still used by website content and was not deleted. Replace it where it is used first.",
      };
    }
    if (error === "move") return { type: "error", message: "The products could not be moved, so nothing was deleted." };
    if (error === "check") return { type: "error", message: "Could not verify whether the image is in use, so it was kept." };
    if (error === "cloudinary") {
      return {
        type: "warning",
        message: "Cloudinary could not delete the file. It is marked for retry: press Delete again later.",
      };
    }
    if (error === "publish") return { type: "error", message: "Failed to update publish status." };
    if (error === "image_delete") return { type: "error", message: "Could not remove image." };
    if (error === "image_remove") return { type: "error", message: "Could not remove image." };
    if (error === "logo_reset") return { type: "error", message: "Could not reset logo." };
    return { type: "error", message: "The requested operation could not be completed." };
  }

  // Warning for image errors during creation
  if (get("imageError") === "1") {
    return {
      type: "warning",
      message: "The item was created, but its image could not be uploaded. Try uploading below.",
    };
  }

  // Deletion feedback
  if (get("deleted") === "1") {
    if (pathname.includes("/admin/products")) return { type: "success", message: "Product deleted." };
    if (pathname.includes("/admin/services")) return { type: "success", message: "Service deleted." };
    if (pathname.includes("/admin/categories")) return { type: "success", message: "Category deleted." };
    if (pathname.includes("/admin/blogs")) return { type: "success", message: "Blog post deleted." };
    if (pathname.includes("/admin/media")) return { type: "success", message: "Image deleted." };
    return { type: "success", message: "Item deleted." };
  }

  // Creation feedback
  if (get("created") === "1") {
    if (pathname.includes("/admin/products")) return { type: "success", message: "Product created. You can now add images." };
    if (pathname.includes("/admin/services")) return { type: "success", message: "Service created." };
    if (pathname.includes("/admin/categories")) return { type: "success", message: "Category created." };
    if (pathname.includes("/admin/blogs")) return { type: "success", message: "Blog post created." };
    return { type: "success", message: "Created successfully." };
  }

  // Upload feedback
  if (get("uploaded") === "1") {
    return { type: "success", message: "Image uploaded." };
  }

  // Saved / updated feedback
  if (get("saved") === "1") {
    if (pathname.includes("/admin/inquiries")) return { type: "success", message: "Changes saved." };
    if (pathname.includes("/admin/blogs")) return { type: "success", message: "Blog post saved." };
    return { type: "success", message: "Changes saved." };
  }

  // Featured products & services
  if (get("featured") === "1") {
    return { type: "success", message: "Featured products updated." };
  }
  if (get("services") === "1") {
    return { type: "success", message: "Homepage services updated." };
  }

  // Published toggle feedback
  const published = get("published");
  if (published === "1") {
    if (pathname.includes("/admin/services")) return { type: "success", message: "Service published." };
    if (pathname.includes("/admin/blogs")) return { type: "success", message: "Blog published." };
    return { type: "success", message: "Product published." };
  }
  if (published === "0") {
    if (pathname.includes("/admin/services")) return { type: "info", message: "Service unpublished." };
    if (pathname.includes("/admin/blogs")) return { type: "info", message: "Blog unpublished." };
    return { type: "info", message: "Product unpublished." };
  }

  // Media & product image feedback
  if (get("imageDeleted") === "1") return { type: "success", message: "Image removed from product." };
  if (get("imageRemoved") === "1") return { type: "success", message: "Image removed." };
  if (get("primary") === "1") return { type: "success", message: "Main image updated." };
  if (get("altSaved") === "1") return { type: "success", message: "Image alt text saved." };
  if (get("logoReset") === "1") return { type: "success", message: "Reverted to official bundled logo." };

  return null;
}

/**
 * Strips transient notification query parameters from a URL while preserving
 * standard filter/pagination parameters (such as `page`, `q`, `status`, `type`, etc.).
 */
export function cleanUrlNotificationParams(url: string): string {
  try {
    const parsed = new URL(url, "http://localhost");
    let changed = false;

    NOTIFICATION_PARAM_KEYS.forEach((key) => {
      if (parsed.searchParams.has(key)) {
        parsed.searchParams.delete(key);
        changed = true;
      }
    });

    if (!changed) return url;
    const query = parsed.searchParams.toString();
    return parsed.pathname + (query ? `?${query}` : "") + parsed.hash;
  } catch {
    return url;
  }
}
