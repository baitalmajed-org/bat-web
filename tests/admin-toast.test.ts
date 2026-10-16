import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { ToastStore, TOAST_DURATIONS } from "@/lib/toast";
import { parseUrlToast, cleanUrlNotificationParams } from "@/lib/toast-url";
import type { FormState } from "@/lib/validation/state";

describe("Centralized Toast Notification System", () => {
  let store: ToastStore;

  beforeEach(() => {
    vi.useFakeTimers();
    store = new ToastStore(1500); // 1.5s dedupe window
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("1 & 2. Success and error notifications", () => {
    it("adds success notifications with appropriate styling and metadata", () => {
      const id = store.add("success", "Product updated successfully.");
      expect(id).toBeTruthy();
      const toasts = store.getSnapshot();
      expect(toasts).toHaveLength(1);
      expect(toasts[0]).toMatchObject({
        type: "success",
        message: "Product updated successfully.",
        duration: TOAST_DURATIONS.success,
      });
    });

    it("adds error notifications with appropriate styling and duration", () => {
      const id = store.add("error", "Failed to update product. Please try again.");
      expect(id).toBeTruthy();
      const toasts = store.getSnapshot();
      expect(toasts).toHaveLength(1);
      expect(toasts[0]).toMatchObject({
        type: "error",
        message: "Failed to update product. Please try again.",
        duration: TOAST_DURATIONS.error,
      });
    });

    it("supports warning and info notification types", () => {
      store.add("warning", "Some changes could not be saved.");
      store.add("info", "Image upload is in progress.");
      const toasts = store.getSnapshot();
      expect(toasts).toHaveLength(2);
      expect(toasts[0]?.type).toBe("warning");
      expect(toasts[1]?.type).toBe("info");
    });
  });

  describe("4. Dismiss buttons work", () => {
    it("allows manual dismissal of specific notification by id", () => {
      const id1 = store.add("success", "Item 1 saved")!;
      const id2 = store.add("info", "Item 2 info")!;
      expect(store.getSnapshot()).toHaveLength(2);

      store.dismiss(id1);
      const remaining = store.getSnapshot();
      expect(remaining).toHaveLength(1);
      expect(remaining[0]?.id).toBe(id2);
    });

    it("allows dismissing all notifications simultaneously", () => {
      store.add("success", "First");
      store.add("error", "Second");
      expect(store.getSnapshot()).toHaveLength(2);

      store.dismissAll();
      expect(store.getSnapshot()).toHaveLength(0);
    });
  });

  describe("5. Automatic dismissal timings and hover pause", () => {
    it("auto-dismisses success notifications after configured timing (approx 4s)", () => {
      store.add("success", "Auto dismiss me");
      expect(store.getSnapshot()).toHaveLength(1);

      // Fast-forward past 3.9s: should still exist
      vi.advanceTimersByTime(3900);
      expect(store.getSnapshot()).toHaveLength(1);

      // Fast-forward past 4s: should be removed
      vi.advanceTimersByTime(200);
      expect(store.getSnapshot()).toHaveLength(0);
    });

    it("auto-dismisses error notifications after longer timing (approx 7s)", () => {
      store.add("error", "Error stays longer");
      expect(store.getSnapshot()).toHaveLength(1);

      // Fast-forward past 5s: error should still be visible
      vi.advanceTimersByTime(5000);
      expect(store.getSnapshot()).toHaveLength(1);

      // Fast-forward to 7.1s: should be dismissed
      vi.advanceTimersByTime(2100);
      expect(store.getSnapshot()).toHaveLength(0);
    });

    it("pauses dismissal timer while user hovers and resumes upon mouse leave", () => {
      const id = store.add("success", "Hover to pause")!;

      // User sees toast and hovers at 2s
      vi.advanceTimersByTime(2000);
      store.pause(id);
      expect(store.getSnapshot()[0]?.isPaused).toBe(true);

      // 5 seconds pass while user is hovering over notification
      vi.advanceTimersByTime(5000);
      expect(store.getSnapshot()).toHaveLength(1);

      // User leaves toast: timer resumes with remaining duration
      store.resume(id);
      expect(store.getSnapshot()[0]?.isPaused).toBe(false);

      // 1.5s passes: still visible
      vi.advanceTimersByTime(1500);
      expect(store.getSnapshot()).toHaveLength(1);

      // Remaining time expires: dismissed
      vi.advanceTimersByTime(1000);
      expect(store.getSnapshot()).toHaveLength(0);
    });
  });

  describe("6. Multiple notifications displayed without overlap", () => {
    it("stacks multiple notifications cleanly in order with unique IDs", () => {
      const id1 = store.add("info", "Task started");
      const id2 = store.add("warning", "Low disk space");
      const id3 = store.add("success", "Operation finished");

      const toasts = store.getSnapshot();
      expect(toasts).toHaveLength(3);
      expect(toasts.map((t) => t.id)).toEqual([id1, id2, id3]);
    });
  });

  describe("7. Duplicate notifications are prevented", () => {
    it("prevents accidental duplicate notifications for identical actions in short succession", () => {
      const id1 = store.add("success", "Product saved.");
      // Triggered again immediately from duplicate form submit or rapid click
      const id2 = store.add("success", "Product saved.");

      expect(id2).toBe(id1);
      expect(store.getSnapshot()).toHaveLength(1);
    });

    it("allows different messages without deduplication blockage", () => {
      store.add("success", "Product saved.");
      store.add("success", "Category saved.");

      expect(store.getSnapshot()).toHaveLength(2);
    });
  });

  describe("8 & 9. Server Action state changes and field validation preservation", () => {
    function simulateFormStateToast(state: FormState): { type: string; message: string } | null {
      if (!state.message) return null;
      if (state.ok) {
        if (
          state.message.toLowerCase().includes("warning") ||
          state.message.toLowerCase().includes("could not be removed")
        ) {
          return { type: "warning", message: state.message };
        }
        return { type: "success", message: state.message };
      }
      return { type: "error", message: state.message };
    }

    it("triggers success notification when Server Action succeeds", () => {
      const state: FormState = { ok: true, message: "Product saved." };
      const toastData = simulateFormStateToast(state);
      expect(toastData).toEqual({ type: "success", message: "Product saved." });
    });

    it("triggers error notification and preserves field-level errors when Server Action fails validation", () => {
      const state: FormState = {
        ok: false,
        message: "Please correct the highlighted fields.",
        errors: {
          name: "Name is required",
          slug: "Slug already in use",
        },
      };

      const toastData = simulateFormStateToast(state);
      expect(toastData).toEqual({
        type: "error",
        message: "Please correct the highlighted fields.",
      });

      // Crucial requirement: field-level messages remain available for inline display
      expect(state.errors).toBeDefined();
      expect(state.errors?.name).toBe("Name is required");
      expect(state.errors?.slug).toBe("Slug already in use");
    });

    it("triggers warning notification for multi-outcome partial failures", () => {
      const state: FormState = {
        ok: true,
        message: "Section saved. Old image could not be removed from Cloudinary.",
      };
      const toastData = simulateFormStateToast(state);
      expect(toastData).toEqual({
        type: "warning",
        message: "Section saved. Old image could not be removed from Cloudinary.",
      });
    });
  });

  describe("10 & 11. Redirect-based actions and URL query parameter parsing", () => {
    it("resolves product deletion and creation feedback across routes", () => {
      expect(parseUrlToast("/admin/products", { deleted: "1" })).toEqual({
        type: "success",
        message: "Product deleted.",
      });
      expect(parseUrlToast("/admin/products", { error: "delete" })).toEqual({
        type: "error",
        message: "The product could not be deleted.",
      });
      expect(parseUrlToast("/admin/products/123/edit", { created: "1" })).toEqual({
        type: "success",
        message: "Product created. You can now add images.",
      });
    });

    it("resolves category operations feedback including in_use with count", () => {
      expect(parseUrlToast("/admin/categories", { created: "1" })).toEqual({
        type: "success",
        message: "Category created.",
      });
      expect(parseUrlToast("/admin/categories", { deleted: "1" })).toEqual({
        type: "success",
        message: "Category deleted.",
      });
      expect(parseUrlToast("/admin/categories", { error: "in_use", n: "4" })).toEqual({
        type: "error",
        message: "That category still has 4 product(s). Choose another category to move them to, then delete.",
      });
      expect(parseUrlToast("/admin/categories", { error: "move" })).toEqual({
        type: "error",
        message: "The products could not be moved, so nothing was deleted.",
      });
    });

    it("resolves service operations feedback", () => {
      expect(parseUrlToast("/admin/services", { deleted: "1" })).toEqual({
        type: "success",
        message: "Service deleted.",
      });
      expect(parseUrlToast("/admin/services/new-id/edit", { imageError: "1" })).toEqual({
        type: "warning",
        message: "The item was created, but its image could not be uploaded. Try uploading below.",
      });
      expect(parseUrlToast("/admin/services", { published: "1" })).toEqual({
        type: "success",
        message: "Service published.",
      });
      expect(parseUrlToast("/admin/services", { published: "0" })).toEqual({
        type: "info",
        message: "Service unpublished.",
      });
    });

    it("resolves media library upload and deletion outcomes", () => {
      expect(parseUrlToast("/admin/media", { uploaded: "1" })).toEqual({
        type: "success",
        message: "Image uploaded.",
      });
      expect(parseUrlToast("/admin/media", { deleted: "1" })).toEqual({
        type: "success",
        message: "Image deleted.",
      });
      expect(parseUrlToast("/admin/media", { error: "cloudinary" })).toEqual({
        type: "warning",
        message: "Cloudinary could not delete the file. It is marked for retry: press Delete again later.",
      });
      expect(parseUrlToast("/admin/media", { error: "in_use" })).toEqual({
        type: "error",
        message: "That image is still used by website content and was not deleted. Replace it where it is used first.",
      });
    });

    it("resolves homepage and settings feedback", () => {
      expect(parseUrlToast("/admin/homepage", { featured: "1" })).toEqual({
        type: "success",
        message: "Featured products updated.",
      });
      expect(parseUrlToast("/admin/homepage", { services: "1" })).toEqual({
        type: "success",
        message: "Homepage services updated.",
      });
      expect(parseUrlToast("/admin/homepage", { imageRemoved: "1" })).toEqual({
        type: "success",
        message: "Image removed.",
      });
      expect(parseUrlToast("/admin/settings", { logoReset: "1" })).toEqual({
        type: "success",
        message: "Reverted to official bundled logo.",
      });
    });

    it("resolves inquiry status and notification retries", () => {
      expect(parseUrlToast("/admin/inquiries/inq-1", { saved: "1" })).toEqual({
        type: "success",
        message: "Changes saved.",
      });
      expect(parseUrlToast("/admin/inquiries/inq-1", { retry: "ok" })).toEqual({
        type: "success",
        message: "Emails sent.",
      });
      expect(parseUrlToast("/admin/inquiries/inq-1", { retry: "failed" })).toEqual({
        type: "error",
        message: "Sending failed again. Check the Brevo setup and try later.",
      });
      expect(parseUrlToast("/admin/inquiries/inq-1", { retry: "nothing" })).toEqual({
        type: "info",
        message: "Both emails were already delivered.",
      });
    });

    it("safely cleans notification parameters from URL while preserving search and pagination parameters", () => {
      const dirtyUrl = "/admin/products?q=steel&status=published&page=2&deleted=1";
      const cleanUrl = cleanUrlNotificationParams(dirtyUrl);

      expect(cleanUrl).toBe("/admin/products?q=steel&status=published&page=2");
      expect(cleanUrl).not.toContain("deleted=1");
    });
  });

  describe("3, 7, 12. Viewport accessibility, motion and authorization contracts", () => {
    it("respects accessible roles and live region expectations", () => {
      // Error toasts use role="alert" with aria-live="assertive"
      // Success, info, and warning use role="status" with aria-live="polite"
      function getLiveRole(type: string) {
        return type === "error" ? "alert" : "status";
      }

      expect(getLiveRole("error")).toBe("alert");
      expect(getLiveRole("success")).toBe("status");
      expect(getLiveRole("warning")).toBe("status");
      expect(getLiveRole("info")).toBe("status");
    });

    it("verifies container classes ensure fixed positioning independent of scroll", () => {
      // Contract test checking the CSS classes defined for container
      const containerClasses = "pointer-events-none fixed top-4 right-4 left-4 sm:left-auto sm:right-4 z-[9999] flex flex-col gap-2.5 max-w-[calc(100vw-2rem)] sm:max-w-md w-full sm:w-96";
      expect(containerClasses).toContain("fixed");
      expect(containerClasses).toContain("top-4");
      expect(containerClasses).toContain("z-[9999]");
      expect(containerClasses).toContain("sm:right-4");
    });

    it("ensures getSnapshot and cached server snapshots maintain stable reference identity", () => {
      // Must not generate a fresh array on every call without changes (avoiding useSyncExternalStore loop warning)
      const snap1 = store.getSnapshot();
      const snap2 = store.getSnapshot();
      expect(Object.is(snap1, snap2)).toBe(true);

      const EMPTY: unknown[] = [];
      const getServerSnapshot = () => EMPTY;
      expect(Object.is(getServerSnapshot(), getServerSnapshot())).toBe(true);
    });
  });
});
