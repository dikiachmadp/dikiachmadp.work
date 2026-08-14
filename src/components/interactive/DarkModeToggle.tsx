"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { uiDictionary, localeFromPathname } from "@/lib/ui-dictionary";

/**
 * 64×34 pill with a sun and a moon at either end and a blob knob that slides
 * between them. Ink and paper invert together, so the knob is always `--ink`.
 */
export default function DarkModeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const a11y = uiDictionary(localeFromPathname(usePathname())).a11y;

  const mounted = React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  if (!mounted) {
    return (
      <div
        className="ink-border h-[34px] w-16 bg-(--wash)"
        style={{ borderRadius: "24px 20px 24px 20px / 20px 24px 20px 24px" }}
      />
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? a11y.switchToLight : a11y.switchToDark}
      className="ink-border relative flex h-[34px] w-16 cursor-pointer items-center justify-between bg-(--wash) px-[7px] transition-transform duration-200 outline-none hover:-translate-x-[2px] hover:-translate-y-[2px] hover:rotate-[-2deg]"
      style={{ borderRadius: "24px 20px 24px 20px / 20px 24px 20px 24px" }}
    >
      <svg
        width="13"
        height="13"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        aria-hidden
      >
        <circle cx="12" cy="12" r="4" />
        <path d="M12 3v2M12 19v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M3 12h2M19 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </svg>
      <svg
        width="13"
        height="13"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden
      >
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
      </svg>
      <span
        aria-hidden
        className="r-blob-alt absolute top-[3px] left-[3px] h-6 w-6 bg-(--ink)"
        style={{
          transform: isDark ? "translateX(31px)" : "translateX(0px)",
          transition: "transform .45s cubic-bezier(.65,0,.35,1)",
          willChange: "transform",
        }}
      />
    </button>
  );
}
