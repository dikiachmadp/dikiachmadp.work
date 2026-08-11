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

  if (href) {
    return (
      <Link href={href} className={base}>
        {children}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={base}>
      {children}
    </button>
  );
}
