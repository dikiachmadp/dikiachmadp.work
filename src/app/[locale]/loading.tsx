"use client";

import { usePathname } from "next/navigation";
import enUi from "@/content/en/ui.json";
import idUi from "@/content/id/ui.json";

/**
 * Shown while a locale page waits on the database. Same locale trick as
 * ErrorContent: getDictionary() is `server-only`, so the two dictionaries are
 * imported directly and picked from the path.
 */
export default function LocaleLoading() {
  const pathname = usePathname();
  const dict = (pathname.split("/")[1] === "id" ? idUi : enUi).states;

  return (
    <div
      role="status"
      aria-live="polite"
      className="main-container flex flex-col gap-6 py-16"
    >
      <span className="sr-only">{dict.loading}</span>

      <div
        aria-hidden
        className="anim-pulse-dot ink-border r-card h-9 w-[min(20rem,70%)] bg-(--wash)"
      />
      <div
        aria-hidden
        className="anim-pulse-dot ink-border r-card h-5 w-[min(32rem,90%)] bg-(--wash)"
      />

      <div className="mt-4 grid grid-cols-1 gap-[26px] sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            aria-hidden
            className="anim-pulse-dot ink-border r-card aspect-[16/10] bg-(--wash)"
          />
        ))}
      </div>
    </div>
  );
}
