import Link from "next/link";
import { ServicesData, SectionsData, UiLabels, Locale } from "@/types/content";
import { cn } from "@/lib/utils";
import SectionHeading from "@/components/ui/SectionHeading";
import Button from "@/components/ui/Button";

interface ServicesPreviewProps {
  servicesData: ServicesData;
  sectionsData: SectionsData;
  uiLabels: UiLabels;
  locale: Locale;
}

/** How many services show on the home page before "All services" takes over. */
const PREVIEW_COUNT = 3;

export default function ServicesPreview({
  servicesData,
  sectionsData,
  uiLabels,
  locale,
}: ServicesPreviewProps) {
  const section = sectionsData.services;
  const preview = servicesData.items.slice(0, PREVIEW_COUNT);

  if (preview.length === 0) return null;

  return (
    <>
      <SectionHeading
        eyebrow={section.eyebrow}
        title={section.title}
        action={
          section.showButton ? (
            <Button
              href={`/${locale}/services`}
              variant="secondary"
              size="sm"
              mirrored
            >
              {uiLabels.buttons.viewAllServices} →
            </Button>
          ) : null
        }
      />

      <div className="grid grid-cols-1 gap-[22px] sm:grid-cols-2 lg:grid-cols-3">
        {preview.map((service, i) => (
          <Link
            key={service.id}
            href={`/${locale}/services`}
            className={cn(
              "ink-border flat-3 lift-card-sm flex min-h-[186px] flex-col gap-2 bg-(--paper) p-[22px]",
              i % 2 === 0 ? "r-card-alt" : "r-card",
              i % 2 === 0 && "lift-card-sm-cw",
            )}
          >
            <div className="flex items-center justify-between">
              <span className="font-hand text-[34px] leading-none text-(--accent-ink)">
                {String(service.order).padStart(2, "0")}
              </span>
              <span className="ink-border flex h-[30px] w-[30px] items-center justify-center rounded-full">
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  aria-hidden
                >
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </span>
            </div>
            <h3 className="font-hand mt-0.5 text-[22px] leading-[1.15]">
              {service.title}
            </h3>
            <p className="m-justify m-0 text-[14px] leading-[1.6] text-(--soft)">
              {service.summary}
            </p>
          </Link>
        ))}
      </div>
    </>
  );
}
