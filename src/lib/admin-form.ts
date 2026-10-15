import type { FormState } from "@/lib/validation/state";

export function str(fd: FormData, key: string): string {
  const v = fd.get(key);
  return typeof v === "string" ? v : "";
}
export function bool(fd: FormData, key: string): boolean {
  return fd.get(key) === "on";
}
export function file(fd: FormData, key: string): File | null {
  const v = fd.get(key);
  return v instanceof File && v.size > 0 ? v : null;
}
export function fail(message: string, errors?: Record<string, string>): FormState {
  return { ok: false, message, errors };
}
export function done(message: string): FormState {
  return { ok: true, message };
}
/** Maps common Postgres errors to friendly messages without leaking internals. */
export function dbMessage(error: { code?: string; message: string }): string {
  if (error.code === "23505") return "That slug is already used by another item. Choose a different slug.";
  if (error.code === "23503") return "This item is still referenced by other records.";
  if (error.code === "42501") return "You do not have permission to do that.";
  console.error("[admin] database error", error.code, error.message);
  return "The change could not be saved. Please try again.";
}
