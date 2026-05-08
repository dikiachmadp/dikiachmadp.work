"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  href?: string;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  className?: string;
  variant?: "primary" | "outline" | "ghost";
}

export default function Button({
  children,
  onClick,
  href,
  type = "button",
  disabled,
  className,
  variant = "primary",
}: ButtonProps) {
  const shadowColors = {
    primary: "bg-[var(--accent)]",
    outline: "bg-[var(--foreground)]",
    ghost: "bg-[var(--gray-soft)]",
  };

  const variantStyles = {
    primary:
      "bg-[var(--foreground)] text-[var(--background)] border-2 border-[var(--foreground)]",
    outline:
      "bg-[var(--background)] text-[var(--foreground)] border-2 border-[var(--foreground)]",
    ghost:
      "bg-transparent text-[var(--foreground)] border-2 border-transparent hover:border-[var(--border)]",
  };

  const content = (
    /* LAPISAN BAWAH (Shadow Layer) */
    <div
      className={cn(
        "relative inline-block w-full sm:w-fit transition-all duration-200 rounded-(--button-radius)",
        shadowColors[variant],
        className,
      )}
    >
      <div
        className={cn(
          "flex items-center justify-center px-8 py-2 tracking-wide transition-all duration-200 rounded-(--button-radius)",
          variantStyles[variant],
          "translate-x-0 translate-y-0",
          !disabled &&
            "group-hover:-translate-x-1.5 group-hover:-translate-y-1.5",
          disabled && "opacity-50 cursor-not-allowed",
        )}
        /* Penerapan Font Display dan Fluid Size */
        style={{
          fontFamily: "var(--font-modak), var(--font-display), cursive",
          fontSize: "var(--text-ui-button)",
        }}
      >
        {children}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="group block sm:inline-block outline-none">
        {content}
      </Link>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="group block w-full sm:w-fit outline-none"
    >
      {content}
    </button>
  );
}
