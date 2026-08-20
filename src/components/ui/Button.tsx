import Link from "next/link";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type ButtonVariant = "primary" | "secondary" | "onDark";
export type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  href?: string;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  className?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Mirror the wobbly radius so neighbouring buttons never share a silhouette. */
  mirrored?: boolean;
  fullWidth?: boolean;
  target?: string;
  rel?: string;
  download?: boolean;
  "aria-label"?: string;
  "aria-expanded"?: boolean;
  "aria-controls"?: string;
}

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-5 py-2 text-[13px]",
  md: "px-[26px] py-[13px] text-[14px]",
  lg: "px-8 py-3.5 text-[15px]",
};

/**
 * One button, two fills. Both share the 2px ink border, the wobbly radius, the
 * 3px flat shadow and the −3px hover lift; only the fill changes. `onDark`
 * keeps the accent fill but swaps border and shadow to paper for use on the
 * ink CTA panel.
 */
export default function Button({
  children,
  onClick,
  href,
  type = "button",
  disabled,
  className,
  variant = "primary",
  size = "md",
  mirrored,
  fullWidth,
  target,
  rel,
  download,
  ...rest
}: ButtonProps) {
  const base = cn(
    "inline-flex items-center justify-center gap-2 whitespace-nowrap",
    "font-bold tracking-[0.03em] cursor-pointer",
    mirrored ? "r-btn-alt" : "r-btn",
    sizeStyles[size],
    fullWidth ? "w-full" : "w-auto",
    variant === "onDark"
      ? "border-2 border-(--paper) bg-(--accent) text-white shadow-[3px_3px_0_var(--paper)] transition-all duration-[0.22s] ease-out hover:-translate-x-[3px] hover:-translate-y-[3px] hover:shadow-[6px_6px_0_var(--paper)]"
      : "ink-border flat-3 lift-btn",
    variant === "primary" && "bg-(--accent) text-white",
    variant === "secondary" && "bg-(--paper) text-(--ink)",
    disabled && "pointer-events-none opacity-50",
    className,
  );

  if (href) {
    return (
      <Link
        href={href}
        target={target}
        rel={target === "_blank" ? (rel ?? "noopener noreferrer") : rel}
        download={download}
        className={base}
        {...rest}
      >
        {children}
      </Link>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={base}
      {...rest}
    >
      {children}
    </button>
  );
}
