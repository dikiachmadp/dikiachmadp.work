"use client";

import { type ReactNode, useEffect, useState } from "react";

/**
 * Scroll-progress chrome wrapped around a detail page's content (Logbook
 * post or Project case study): a thin accent bar that docks under the
 * sticky navbar, plus a desktop-only vertical rail repeating a short label
 * and the live read percentage.
 *
 * Owns the scroll listener itself and renders the two-column layout (rail +
 * content) around `children`, so the article in `page.tsx` doesn't need to
 * thread scroll state through props.
 *
 * The progress bar is `position: sticky`, not `fixed` — placed right after
 * `Navbar`'s own sticky element, sticky positioning docks it under that bar
 * for free, with no prop or context threaded through `Navbar.tsx` itself.
 */
export default function ReadingRail({
  label,
  children,
}: {
  /** Short vertical-rail label, e.g. `"log 003"` or a project's category. */
  label: string;
  children: ReactNode;
}) {
  const [pct, setPct] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      setPct(
        max > 0 ? Math.min(100, Math.max(0, (window.scrollY / max) * 100)) : 0,
      );
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <>
      <div aria-hidden className="sticky top-(--nav-h) z-40 h-0.5 w-full">
        <div
          className="h-full bg-(--accent-ink) transition-[width] duration-150 ease-out"
          style={{ width: `${pct.toFixed(2)}%` }}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-[88px_minmax(0,1fr)]">
        <aside aria-hidden className="relative hidden sm:block">
          <div className="sticky top-[120px] flex flex-col items-center gap-3.5 pt-[62px]">
            <span className="font-note text-[20px] tracking-[0.06em] text-(--soft) [writing-mode:vertical-rl]">
              {label}
            </span>
            <span
              className="h-[150px] w-0.5 opacity-45"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(180deg, var(--line) 0 5px, transparent 5px 10px)",
              }}
            />
            <span className="h-[9px] w-[9px] rotate-45 bg-(--accent-ink)" />
            <span className="font-tech text-[10px] tracking-[0.12em] text-(--soft)">
              {Math.round(pct)}%
            </span>
          </div>
        </aside>

        <div className="min-w-0 pb-2">{children}</div>
      </div>
    </>
  );
}
