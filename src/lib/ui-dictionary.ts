import enUi from "@/content/en/ui.json";
import idUi from "@/content/id/ui.json";
import type { Locale } from "@/types/content";

/**
 * ui.json for Client Components.
 *
 * getDictionary() is marked `server-only`, so anything with "use client" — the
 * error boundary, the loading skeleton, the toggles, the testimonial carousel —
 * cannot reach it. Each of them was importing both JSON files and picking one
 * off the path; this is that trick in one place instead of copied around.
 *
 * It costs nothing extra in the bundle: both files were already pulled in by
 * loading.tsx and ErrorContent, and together they are ~4.4 kB.
 *
 * Server Components must keep using getDictionary() — it validates against the
 * Zod schemas, which is what stops a missing key reaching the page.
 */
export function uiDictionary(locale: Locale) {
  return locale === "id" ? idUi : enUi;
}

/** The locale segment of an App Router path, defaulting to `en`. */
export function localeFromPathname(pathname: string): Locale {
  return pathname.split("/")[1] === "id" ? "id" : "en";
}
