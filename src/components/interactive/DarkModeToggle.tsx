"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Komponen DarkModeToggle dengan gaya Brutalist.
 * Menggunakan next-themes untuk manajemen state tema global.
 */
export default function DarkModeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  // Menghindari Hydration Mismatch (Komponen hanya muncul setelah di-mount di client)
  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-10 h-10 brutalist-border rounded-md bg-(--gray-soft) animate-pulse" />
    );
  }

  const isDark = theme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "group relative w-10 h-10 flex items-center justify-center",
        "brutalist-border rounded-md transition-all duration-200",
        "bg-(--card) hover:bg-(--accent) hover:text-white",
        "active:translate-x-[2px] active:translate-y-[2px] active:shadow-none",
        "shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)]"
      )}
      aria-label="Toggle Dark Mode"
    >
      {isDark ? (
        <Sun className="w-5 h-5 transition-transform group-hover:rotate-12" />
      ) : (
        <Moon className="w-5 h-5 transition-transform group-hover:-rotate-12" />
      )}
      
      {/* Tooltip sederhana ala Brutalist */}
      <span className="absolute -bottom-10 scale-0 group-hover:scale-100 transition-all bg-black text-white dark:bg-white dark:text-black text-[10px] font-black px-2 py-1 rounded border border-current whitespace-nowrap">
        {isDark ? "LIGHT MODE" : "DARK MODE"}
      </span>
    </button>
  );
}