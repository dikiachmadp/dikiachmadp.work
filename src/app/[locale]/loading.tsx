"use client";

import { usePathname } from "next/navigation";
import { uiDictionary, localeFromPathname } from "@/lib/ui-dictionary";

/**
 * Shown while a locale page waits on the database. Same locale trick as
 * ErrorContent — see lib/ui-dictionary.
 */
export default function LocaleLoading() {
  const dict = uiDictionary(localeFromPathname(usePathname())).states;

  return (
    <div
      role="status"
      aria-live="polite"
      className="main-container flex flex-col gap-6 py-16"
    >
      <span className="sr-only">{dict.loading}</span>

      <div
        aria-hidden
        className="anim-pulse-soft ink-border r-card h-9 w-[min(20rem,70%)] bg-(--wash)"
      />
      <div
        aria-hidden
        className="anim-pulse-soft ink-border r-card h-5 w-[min(32rem,90%)] bg-(--wash)"
      />

      <div className="mt-4 grid grid-cols-1 gap-[26px] sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            aria-hidden
            className="anim-pulse-soft ink-border r-card aspect-[16/10] bg-(--wash)"
          />
        ))}
      </div>
    </div>
  );
}
