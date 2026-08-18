import React from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  topTitle?: string;
  title: string;
  description?: string;
  className?: string;
  /** Legal and privacy set their eyebrow in mono ("Last updated: …"). */
  eyebrowStyle?: "hand" | "mono";
}

export default function PageHeader({
  topTitle,
  title,
  description,
  className,
  eyebrowStyle = "hand",
}: PageHeaderProps) {
  return (
    <div className={cn("w-full", className)}>
      {topTitle &&
        (eyebrowStyle === "mono" ? (
          <p className="font-tech m-center m-0 text-[11px] tracking-[0.14em] text-(--soft) uppercase">
            {topTitle}
          </p>
        ) : (
          <p className="eyebrow m-center m-0">{topTitle}</p>
        ))}
      <h1 className="font-hand m-center mt-0.5 mb-2.5 text-[clamp(2.4rem,5.4vw,4rem)] leading-none">
        {title}
      </h1>
      {description && (
        <p className="m-justify m-0 max-w-[620px] text-[16px] leading-[1.6] text-(--soft)">
          {description}
        </p>
      )}
    </div>
  );
}
