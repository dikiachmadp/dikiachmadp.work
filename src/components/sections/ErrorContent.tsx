"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import enUi from "@/content/en/ui.json";
import idUi from "@/content/id/ui.json";
import { Locale } from "@/types/content";
import PageWrapper from "@/components/layout/PageWrapper";
import Button from "@/components/ui/Button";

interface ErrorContentProps {
  error: Error & { digest?: string };
  /** Next 16.3's error boundary prop — re-fetches and re-renders the segment. */
  retry: () => void;
}

/**
 * Fallback for the error boundaries. Deliberately shaped like NotFoundContent
 * so a failed page still looks like the site rather than a crash.
 *
 * Error boundaries must be Client Components, which rules out getDictionary()
 * — it is marked `server-only`. The two dictionaries are imported directly
 * instead and picked by the locale segment of the path, the same way
 * LanguageToggle reads it.
 */
export default function ErrorContent({ error, retry }: ErrorContentProps) {
  const pathname = usePathname();
  const locale: Locale = pathname.split("/")[1] === "id" ? "id" : "en";
  const dict = (locale === "id" ? idUi : enUi).errorPage;

  useEffect(() => {
    // In production the message is redacted; `digest` is what matches this up
    // with the server log.
    console.error("Route error:", error.digest ?? error.message);
  }, [error]);

  return (
    <PageWrapper>
      <div className="mx-auto w-full max-w-[820px] px-[22px] pt-[70px] text-center">
        <div className="relative inline-block">
          <h1 className="font-hand m-0 text-[clamp(4rem,14vw,9rem)] leading-[0.85]">
            {dict.heading}
          </h1>
          <span
            aria-hidden
            className="anim-wob absolute top-[14%] left-[-8%] h-[70%] w-[116%] border-2 border-dashed border-(--line) opacity-50"
            style={{ borderRadius: "52% 48% 45% 55% / 48% 52% 48% 52%" }}
          />
        </div>

        <p className="font-note mt-2.5 mb-1.5 text-[24px] text-(--soft)">
          {dict.badge}
        </p>
        <p className="mx-auto mb-[26px] max-w-[420px] text-[17px] leading-[1.6]">
          {dict.description}
        </p>

        <div className="flex flex-wrap justify-center gap-3">
          <Button onClick={retry} variant="primary">
            {dict.retry}
          </Button>
          <Button href={`/${locale}`} variant="secondary" mirrored>
            {dict.btnHome}
          </Button>
        </div>

        {error.digest && (
          <p className="font-tech mt-8 text-[11px] tracking-[0.1em] text-(--soft) uppercase">
            ref: {error.digest}
          </p>
        )}
      </div>
    </PageWrapper>
  );
}
