"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ConfirmSubmitButtonProps {
  children: ReactNode;
  message: string;
  className?: string;
}

/** Submit button that asks before firing — used for destructive admin actions. */
export default function ConfirmSubmitButton({
  children,
  message,
  className,
}: ConfirmSubmitButtonProps) {
  return (
    <button
      type="submit"
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
      className={cn("cursor-pointer outline-none", className)}
    >
      {children}
    </button>
  );
}
