"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

export default function DarkModeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  // Mencegah hydration mismatch
  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="h-8.5 w-16 rounded-full border-2 border-(--border)" />
    );
  }

  const isDark = theme === "dark";

  return (
    <>
      <style>{`
        @keyframes rotate-sun {
          0% { transform: rotate(0); }
          100% { transform: rotate(360deg); }
        }
        @keyframes tilt-moon {
          0% { transform: rotate(0deg); }
          25% { transform: rotate(-10deg); }
          75% { transform: rotate(10deg); }
          100% { transform: rotate(0deg); }
        }
        .animate-rotate-sun {
          animation: rotate-sun 15s linear infinite;
        }
        .animate-tilt-moon {
          animation: tilt-moon 5s linear infinite;
        }
      `}</style>

      <button
        type="button"
        onClick={() => setTheme(isDark ? "light" : "dark")}
        aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        className={cn(
          "relative inline-block h-8.5 w-16 rounded-full outline-none cursor-pointer",
          // Menggunakan variabel tema alih-alih warna statis
          "border-2 border-(--foreground) bg-(--gray-soft)",
          "transition-colors duration-500 ease-in-out",
        )}
      >
        <span className="sr-only">Toggle theme</span>

        {/* MOON ICON (Kiri) - Tampil saat Dark Mode */}
        <span className="absolute left-1 top-1 z-10 flex h-5.5 w-5.5 items-center justify-center text-(--foreground)">
          <svg
            className="animate-tilt-moon"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        </span>

        {/* SUN ICON (Kanan) - Tampil saat Light Mode */}
        <span className="absolute right-1 top-1 z-10 flex h-5.5 w-5.5 items-center justify-center text-(--foreground)">
          <svg
            className="animate-rotate-sun"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
          </svg>
        </span>

        {/* KNOB */}
        <span
          className="absolute bottom-0.5 left-0.5 z-20 h-6.5 w-6.5 rounded-full bg-(--foreground)"
          style={{
            transition: "transform 0.5s cubic-bezier(0.65, 0, 0.35, 1)",
            transform: isDark ? "translateX(30px)" : "translateX(0px)",
            willChange: "transform",
          }}
        />
      </button>
    </>
  );
}
