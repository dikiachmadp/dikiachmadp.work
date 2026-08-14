"use client";

import { usePathname, useRouter } from "next/navigation";
import { Locale } from "@/types/content";
import { cn, fill } from "@/lib/utils";
import { uiDictionary, localeFromPathname } from "@/lib/ui-dictionary";

const LOCALES: Locale[] = ["en", "id"];

/** Two segments in one wobbly pill; the active one takes the accent fill. */
export default function LanguageToggle() {
  const pathname = usePathname();
  const router = useRouter();

  const currentLocale = localeFromPathname(pathname);
  const a11y = uiDictionary(currentLocale).a11y;

  const switchTo = (next: Locale) => {
    if (next === currentLocale) return;
    const segments = pathname.split("/");
    segments[1] = next;
    router.push(segments.join("/"));
  };

  return (
    <div
      className="ink-border flex w-fit cursor-pointer items-center overflow-hidden text-[11px] font-bold tracking-[0.08em] transition-transform duration-200 hover:-translate-x-[2px] hover:-translate-y-[2px]"
      style={{ borderRadius: "20px 9px 22px 8px / 8px 22px 9px 20px" }}
    >
      {LOCALES.map((lang) => {
        const isActive = currentLocale === lang;
        return (
          <button
            key={lang}
            type="button"
            onClick={() => switchTo(lang)}
            aria-label={fill(a11y.switchToLanguage, {
              lang: a11y.languageNames[lang],
            })}
            aria-current={isActive ? "true" : undefined}
            className={cn(
              "cursor-pointer px-[10px] py-[6px] uppercase transition-colors outline-none",
              isActive
                ? "bg-(--accent) text-white"
                : "bg-transparent text-(--ink)",
            )}
          >
            {lang}
          </button>
        );
      })}
    </div>
  );
}
