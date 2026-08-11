import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface TagProps {
  children: ReactNode;
  className?: string;
}

/** The small uppercase pill used for project tags and skill items. */
export default function Tag({ children, className }: TagProps) {
  return (
    <span
      className={cn(
        "r-tag border-[1.5px] border-(--line) px-2.5 py-1",
        "text-[10px] font-bold uppercase tracking-[0.1em] text-(--soft)",
        className,
      )}
    >
      {children}
    </span>
  );
}
