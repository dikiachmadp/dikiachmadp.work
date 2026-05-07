"use client";

import { usePathname, useRouter } from "next/navigation";
import { Locale } from "@/types/content";
import { cn } from "@/lib/utils";

/**
 * Komponen untuk berpindah bahasa (en <-> id).
 * Menggunakan segmentasi URL untuk menentukan locale aktif.
 */
export default function LanguageToggle() {
  const pathname = usePathname();
  const router = useRouter();

  // Mengambil locale dari segment pertama path (misal: /en/about -> en)
  const currentLocale = pathname.split("/")[1] as Locale;

  const toggleLanguage = (newLocale: Locale) => {
    if (newLocale === currentLocale) return;

    // Mengganti segment locale di URL tanpa mengubah sisa path
    const pathSegments = pathname.split("/");
    pathSegments[1] = newLocale;
    const newPath = pathSegments.join("/");

    router.push(newPath);
  };

  return (
    <div className="flex items-center brutalist-border rounded-md overflow-hidden bg-(--card)">
      {(["en", "id"] as const).map((lang) => (
        <button
          key={lang}
          onClick={() => toggleLanguage(lang)}
          className={cn(
            "px-3 py-1.5 text-xs font-black uppercase transition-all",
            currentLocale === lang 
              ? "bg-(--accent) text-white" 
              : "text-(--foreground) hover:bg-(--gray-soft)"
          )}
        >
          {lang}
        </button>
      ))}
    </div>
  );
}