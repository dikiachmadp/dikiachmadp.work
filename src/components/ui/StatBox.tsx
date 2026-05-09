"use client";

import { cn, themeTransition } from "@/lib/utils";

interface StatBoxProps {
  label: string;
  value: string;
  className?: string;
}

/**
 * Komponen StatBox dengan efek hover 3D.
 */
export default function StatBox({ label, value, className }: StatBoxProps) {
  return (
    <div
      className={cn(
        "group relative bg-(--foreground) rounded-(--button-radius)",
        className,
        themeTransition,
      )}
    >
      <div
        className="
        relative h-full p-6
        bg-(--background) 
        border-2 border-(--foreground) 
        rounded-(--button-radius)
        flex flex-col items-center justify-center text-center
        translate-x-0 translate-y-0
        transition-all duration-200 ease-out
        group-hover:-translate-x-1.5 group-hover:-translate-y-1.5
        cursor-default
      "
      >
        {/* VALUE: Menggunakan font-display secara eksplisit */}
        <span
          className="block leading-none"
          style={{
            fontSize: "var(--text-stats-num)",
            fontFamily: "var(--font-modak), var(--font-display), cursive",
          }}
        >
          {value}
        </span>

        {/* LABEL: Menggunakan font-main (Inter) */}
        <span
          className="uppercase tracking-widest text-(--gray-medium) mt-2 font-bold"
          style={{
            fontSize: "var(--text-ui-label)",
            fontFamily: "var(--font-main)",
          }}
        >
          {label}
        </span>
      </div>
    </div>
  );
}
