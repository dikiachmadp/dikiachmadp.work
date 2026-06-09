"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { cn, themeTransition } from "@/lib/utils";

export type ButtonSize = "xs" | "sm" | "md" | "lg" | "xl";

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  href?: string;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  className?: string;
  variant?: "primary" | "outline" | "ghost";
  size?: ButtonSize;
  target?: string;
  rel?: string;
}

export default function Button({
  children,
  onClick,
  href,
  type = "button",
  disabled,
  className,
  variant = "primary",
  size = "md",
  target,
  rel,
}: ButtonProps) {
  const shadowColors = {
    primary: "bg-[var(--foreground)]",
    outline: "bg-[var(--background)]",
    ghost: "bg-transparent",
  };

  const variantStyles = {
    primary:
      "bg-[var(--foreground)] text-[var(--background)] border-2 border-[var(--background)]",
    outline:
      "bg-[var(--background)] text-[var(--foreground)] border-2 border-[var(--foreground)]",
    ghost:
      "bg-transparent text-[var(--foreground)] border-2 border-transparent hover:bg-[var(--gray-soft)] hover:border-[var(--border)]",
  };

  const sizeStyles = {
    xs: "px-3 py-1 text-[9px] tracking-[0.2em]",
    sm: "px-5 py-1.5 text-[10px] tracking-widest",
    md: "px-8 py-2 text-xs tracking-wide",
    lg: "px-10 py-3 text-sm tracking-wide",
    xl: "px-12 py-4 text-base tracking-wider",
  };

  const content = (
    <div
      className={cn(
        "relative inline-block w-full sm:w-fit transition-all duration-200 rounded-(--button-radius)",
        shadowColors[variant],
        className,
        themeTransition,
      )}
    >
      <div
        className={cn(
          "flex items-center justify-center transition-all duration-200 rounded-(--button-radius) uppercase w-full",
          variantStyles[variant],
          sizeStyles[size],
          "translate-x-0 translate-y-0",
          !disabled &&
            variant !== "ghost" &&
            "group-hover:-translate-x-1.5 group-hover:-translate-y-1.5",
          !disabled && variant === "ghost" && "group-hover:opacity-80",
          disabled && "opacity-50 cursor-not-allowed",
        )}
        style={
          size === "md" || size === "lg" || size === "xl"
            ? {
                fontFamily: "var(--font-modak), cursive",
                fontSize: size === "md" ? "var(--text-ui-button)" : undefined,
              }
            : {
                fontFamily: "var(--font-body), sans-serif",
              }
        }
      >
        {children}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        target={target}
        rel={target === "_blank" ? rel || "noopener noreferrer" : rel}
        className="group block sm:inline-block outline-none"
      >
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
