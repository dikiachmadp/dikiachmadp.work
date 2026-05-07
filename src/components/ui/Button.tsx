import Link from "next/link";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "outline" | "ghost";

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  href?: string;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  className?: string;
  variant?: ButtonVariant;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-(--accent) text-white border-2 border-(--accent) hover:bg-transparent hover:text-(--accent)",
  outline:
    "bg-transparent text-(--foreground) border-2 border-(--border) hover:border-(--accent) hover:text-(--accent)",
  ghost:
    "bg-transparent text-(--foreground) border-2 border-transparent hover:border-(--border)",
};

const baseClasses =
  "inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-black uppercase tracking-widest transition-all duration-150 cursor-pointer select-none active:translate-x-[2px] active:translate-y-[2px] disabled:opacity-40 disabled:cursor-not-allowed";

export default function Button({
  children,
  onClick,
  href,
  type = "button",
  disabled = false,
  className = "",
  variant = "primary",
}: ButtonProps) {
  const combinedClasses = cn(baseClasses, variantClasses[variant], className);

  if (href) {
    return (
      <Link href={href} className={combinedClasses}>
        {children}
      </Link>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={combinedClasses}
    >
      {children}
    </button>
  );
}
