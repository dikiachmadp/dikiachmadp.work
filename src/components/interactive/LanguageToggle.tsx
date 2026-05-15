"use client";

import { usePathname, useRouter } from "next/navigation";
import { Locale } from "@/types/content";
import { cn, themeTransition } from "@/lib/utils";

export default function LanguageToggle() {
  const pathname = usePathname();
  const router = useRouter();

  const currentLocale = pathname.split("/")[1] as Locale;

  const toggleLanguage = (newLocale: Locale) => {
    if (newLocale === currentLocale) return;

    const pathSegments = pathname.split("/");
    pathSegments[1] = newLocale;
    const newPath = pathSegments.join("/");

    router.push(newPath);
  };

  return (
    <div
      className={cn(
        "relative inline-flex h-8.5 w-18 items-center rounded-full border-2 border-(--foreground) bg-(--gray-soft)",
        "transition-colors duration-500 ease-in-out",
      )}
    >
      <span
        className="absolute bottom-0.5 left-0.5 z-0 h-6.5 w-7.5 rounded-full bg-(--foreground)"
        style={{
          transition: "transform 0.5s cubic-bezier(0.65, 0, 0.35, 1)",
          transform:
            currentLocale === "id" ? "translateX(34px)" : "translateX(0px)",
          willChange: "transform",
        }}
      />

      {(["en", "id"] as const).map((lang) => {
        const isActive = currentLocale === lang;
        return (
          <button
            key={lang}
            onClick={() => toggleLanguage(lang)}
            aria-label={`Switch to ${lang} language`}
            className={cn(
              "relative z-10 flex h-full w-1/2 items-center justify-center outline-none cursor-pointer",
              "text-[11px] font-black uppercase tracking-wider transition-colors duration-500",
              isActive
                ? "text-(--background)"
                : "text-(--foreground) hover:opacity-70",
              themeTransition,
            )}
          >
            {lang}
          </button>
        );
      })}
    </div>
  );
}
