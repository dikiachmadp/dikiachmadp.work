import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  /** Right-aligned slot, usually the secondary "All work →" button. */
  action?: ReactNode;
  className?: string;
}

export default function SectionHeading({
  eyebrow,
  title,
  action,
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "mb-[30px] flex flex-col items-center gap-5 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between",
        className,
      )}
    >
      <div className="w-full sm:w-auto">
        {eyebrow && <div className="eyebrow m-center">{eyebrow}</div>}
        <h2 className="font-hand m-center mt-0.5 text-[clamp(2rem,4vw,3.2rem)] leading-none">
          {title}
        </h2>
      </div>
      {action}
    </div>
  );
}
