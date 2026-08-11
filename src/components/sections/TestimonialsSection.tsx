"use client";

import { useState } from "react";
import { TestimonialsData, SectionsData } from "@/types/content";

interface TestimonialsSectionProps {
  testimonialsData: TestimonialsData;
  sectionsData: SectionsData;
}

export default function TestimonialsSection({
  testimonialsData,
  sectionsData,
}: TestimonialsSectionProps) {
  const items = testimonialsData.items;
  const [index, setIndex] = useState(0);

  if (items.length === 0) return null;

  const quote = items[index % items.length];
  const step = (delta: number) =>
    setIndex((i) => (i + delta + items.length) % items.length);

  return (
    <div className="r-panel ink-border flat-5 relative bg-(--wash) p-9">
      <span
        className="font-note ink-border absolute -top-3.5 left-[34px] bg-(--paper) px-3.5 py-[3px] text-[18px]"
        style={{ transform: "rotate(-2.5deg)" }}
      >
        {sectionsData.testimonials.eyebrow ?? sectionsData.testimonials.title}
      </span>

      <div className="grid grid-cols-1 items-center gap-[34px] md:grid-cols-[220px_1fr]">
        <div className="flex flex-col items-center gap-2.5 text-center">
          <div className="r-blob-alt ink-border flat-3 font-hand flex h-[88px] w-[88px] items-center justify-center bg-(--paper) text-[34px]">
            {quote.clientName.charAt(0)}
          </div>
          <div className="text-[14px] font-bold">{quote.clientName}</div>
          <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-(--soft)">
            {quote.role}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex gap-1" aria-label="5 out of 5">
            {[0, 1, 2, 3, 4].map((i) => (
              <svg
                key={i}
                width="17"
                height="17"
                viewBox="0 0 24 24"
                fill="var(--accent)"
                aria-hidden
              >
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            ))}
          </div>

          <blockquote className="font-hand m-0 text-[21px] font-normal leading-[1.5]">
            &ldquo;{quote.content}&rdquo;
          </blockquote>

          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={() => step(-1)}
              aria-label="Previous testimonial"
              className="ink-border flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-(--paper) transition-all duration-200 hover:-translate-x-[2px] hover:-translate-y-[2px] hover:rotate-[-6deg] hover:shadow-[4px_4px_0_var(--line)]"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                aria-hidden
              >
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => step(1)}
              aria-label="Next testimonial"
              className="ink-border flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-(--paper) transition-all duration-200 hover:-translate-x-[2px] hover:-translate-y-[2px] hover:rotate-[6deg] hover:shadow-[4px_4px_0_var(--line)]"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                aria-hidden
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
