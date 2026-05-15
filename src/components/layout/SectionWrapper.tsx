import React from "react";
import { cn, themeTransition } from "@/lib/utils";

interface SectionWrapperProps {
  children: React.ReactNode;
  id?: string;
  className?: string;
}

export default function SectionWrapper({
  children,
  id,
  className,
}: SectionWrapperProps) {
  return (
    <section
      id={id}
      className={cn("w-full py-16 md:py-24", className, themeTransition)}
    >
      <div className="main-container">{children}</div>
    </section>
  );
}
