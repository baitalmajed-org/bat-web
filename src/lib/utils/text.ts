import type { Spec } from "@/types/db";

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/, "");
}

/** "Label: value" per line -> specs. Lines without a colon are ignored. */
export function parseSpecs(text: string): Spec[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .flatMap((line) => {
      const idx = line.indexOf(":");
      if (idx < 1) return [];
      const label = line.slice(0, idx).trim();
      const value = line.slice(idx + 1).trim();
      return label && value ? [{ label, value }] : [];
    })
    .slice(0, 40);
}

export function specsToText(specs: Spec[] | null | undefined): string {
  return (specs ?? []).map((s) => `${s.label}: ${s.value}`).join("\n");
}

/** One item per line, trimmed, de-duplicated. */
export function parseLines(text: string, max = 30): string[] {
  return Array.from(new Set(text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean))).slice(0, max);
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function formatDateTime(iso: string, timeZone = "Asia/Dubai"): string {
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone }).format(new Date(iso));
}
