import React from "react";
import { cn } from "@/lib/utils";

interface PageWrapperProps {
  children: React.ReactNode;
  className?: string;
}

/** Page-enter motion: the whole view rises and un-rotates into place. */
export default function PageWrapper({ children, className }: PageWrapperProps) {
  return <div className={cn("anim-rise", className)}>{children}</div>;
}
