"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface ChipProps {
  children: ReactNode;
  active?: boolean;
  onClick?: () => void;
  href?: string;
  mirrored?: boolean;
  className?: string;
}

/**
 * Filter / tab chip. Inactive is transparent on paper, active takes the accent
 * fill — the same treatment for project categories, the legal tabs and the
 * admin sidebar.
 */
export default function Chip({
  children,
  active,
  onClick,
  href,
  mirrored,
  className,
}: ChipProps) {
  const base = cn(
    "inline-flex cursor-pointer items-center justify-center px-4 py-2",
    "ink-border lift-chip text-[11px] font-bold uppercase tracking-[0.08em]",
    mirrored ? "r-chip-alt" : "r-chip",
    active ? "bg-(--accent) text-white" : "bg-transparent text-(--ink)",
    className,
  );

  /**
   * Status aktif sebelumnya hanya disampaikan lewat isian warna aksen. Yang
   * memakai pembaca layar tidak punya cara tahu filter mana yang sedang
   * dipilih, dan warna saja juga bukan penanda yang cukup.
   *
   * Atributnya berbeda menurut bentuknya: chip bertaut adalah navigasi, jadi
   * `aria-current="page"`; chip bertombol adalah sakelar, jadi `aria-pressed`.
   */
  if (href) {
    return (
      <Link
        href={href}
        aria-current={active ? "page" : undefined}
        className={base}
      >
        {children}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active ?? false}
      className={base}
    >
      {children}
    </button>
  );
}
