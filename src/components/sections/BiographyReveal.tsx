"use client";

import { useId, useState } from "react";
import Button from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface BiographyRevealProps {
  /** Paragraphs after the always-visible lead line — collapsed by default. */
  paragraphs: string[];
  labels: {
    readMore: string;
    showLess: string;
  };
}

const ChevronIcon = ({ expanded }: { expanded: boolean }) => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
    className={cn(
      "transition-transform duration-300 ease-out",
      expanded && "-rotate-180",
    )}
  >
    <path d="M6 9l6 6 6-6" />
  </svg>
);

/**
 * A long bio in one sitting is easy to skip. This keeps the opening line
 * visible and folds the rest behind a toggle, using a grid-rows 0fr/1fr
 * trick so the reveal animates without measuring content height in JS.
 */
export default function BiographyReveal({
  paragraphs,
  labels,
}: BiographyRevealProps) {
  const [expanded, setExpanded] = useState(false);
  const panelId = useId();

  if (paragraphs.length === 0) return null;

  return (
    <div>
      <div
        id={panelId}
        className={cn(
          "grid transition-[grid-template-rows] duration-500 ease-out",
          expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="overflow-hidden">
          {paragraphs.map((paragraph, i) => (
            <p
              key={i}
              className="justify-body mb-3.5 text-[16px] leading-[1.75] text-(--soft)"
            >
              {paragraph}
            </p>
          ))}
        </div>
      </div>

      <Button
        type="button"
        size="sm"
        variant="secondary"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        aria-controls={panelId}
        className="mb-3.5"
      >
        {expanded ? labels.showLess : labels.readMore}
        <ChevronIcon expanded={expanded} />
      </Button>
    </div>
  );
}
