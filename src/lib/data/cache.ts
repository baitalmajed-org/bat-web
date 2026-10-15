import "server-only";
import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";

export const CACHE_TAGS = ["settings", "homepage", "catalog", "services", "pages"] as const;

/**
 * Cache a read. Errors are NOT cached: unstable_cache re-throws, and we return the
 * fallback so public pages degrade to empty states instead of crashing.
 */
export async function cachedRead<T>(
  key: string[],
  tags: (typeof CACHE_TAGS)[number][],
  fn: () => Promise<T>,
  fallback: T,
  revalidate = 3600,
): Promise<T> {
  try {
    return await unstable_cache(fn, key, { tags: [...tags], revalidate })();
  } catch (e) {
    console.error("[data] read failed:", key.join("/"), e instanceof Error ? e.message : e);
    return fallback;
  }
}

/** Call after any admin mutation that changes public content. */
export function revalidatePublic() {
  for (const tag of CACHE_TAGS) revalidateTag(tag);
  revalidatePath("/", "layout");
}
