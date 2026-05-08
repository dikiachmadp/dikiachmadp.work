"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

export default function DarkModeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  // Penting: Hanya aktifkan mounted setelah komponen di client
  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Selama belum mounted, tampilkan placeholder dengan ukuran yang sesuai
  if (!mounted) {
    return (
      <div className="h-8.5 w-16 rounded-[30px] border border-(--border) bg-(--gray-soft) opacity-20" />
    );
  }

  const isDark = theme === "dark";

  return (
    <>
      {/* Definisi keyframes animasi secara lokal agar tidak perlu mengubah tailwind.config.js */}
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
          "relative inline-block h-[34px] w-[64px] rounded-[30px] outline-none cursor-pointer",
          "transition-colors duration-400 ease-in-out",
        )}
        style={{
          // Background berubah sesuai state
          backgroundColor: isDark ? "#183153" : "#73C0FC",
        }}
      >
        <span className="sr-only">Toggle theme</span>

        {/* MOON ICON (Kiri) - Tampil saat Dark Mode karena tidak tertutup Knob */}
        <span className="absolute left-[5px] top-[5px] z-10 flex h-[24px] w-[24px] items-center justify-center text-[#73C0FC]">
          <svg
            className="animate-tilt-moon"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        </span>

        {/* SUN ICON (Kanan) - Tampil saat Light Mode karena tidak tertutup Knob */}
        <span className="absolute left-[36px] top-[6px] z-10 flex h-[24px] w-[24px] items-center justify-center text-white">
          <svg
            className="animate-rotate-sun"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
          </svg>
        </span>

        {/* KNOB: Lapisan bulat yang bergeser ke kiri dan kanan untuk menutupi/membuka icon */}
        <span
          className="absolute bottom-[2px] left-[2px] z-20 h-[30px] w-[30px] rounded-[20px] bg-[#e8e8e8]"
          style={{
            transition: "transform 0.4s",
            transform: isDark ? "translateX(30px)" : "translateX(0px)",
            willChange: "transform",
          }}
        />
      </button>
    </>
  );
}
