import React from "react";
import { cn } from "@/lib/utils";

interface SectionWrapperProps {
  children: React.ReactNode;
  id?: string;
  className?: string;
  /** Section rhythm: 52–82px of top padding depending on how much air it needs. */
  spacing?: "sm" | "md" | "lg";
  /** Skip the inner container when the section needs to run full-bleed. */
  bleed?: boolean;
}

const spacings = {
  sm: "pt-[52px]",
  md: "pt-[64px]",
  lg: "pt-[82px]",
} as const;

export default function SectionWrapper({
  children,
  id,
  className,
  spacing = "lg",
  bleed,
}: SectionWrapperProps) {
  return (
    <section id={id} className={cn("w-full", spacings[spacing], className)}>
      {bleed ? children : <div className="main-container">{children}</div>}
    </section>
  );
}
