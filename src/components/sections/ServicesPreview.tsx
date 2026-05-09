"use client";

import { ServicesData, SectionsData, UiLabels, Locale } from "@/types/content";
import Button from "@/components/ui/Button";
import ServicesCard from "@/components/ui/ServicesCard";

interface ServicesPreviewProps {
  servicesData: ServicesData;
  sectionsData: SectionsData;
  uiLabels: UiLabels;
  locale: Locale;
}

export default function ServicesPreview({
  servicesData,
  sectionsData,
  uiLabels,
  locale,
}: ServicesPreviewProps) {
  const section = sectionsData.services;
  const buttonLabel =
    section?.buttonLabel && uiLabels
      ? uiLabels.buttons[
          section.buttonLabel as keyof typeof uiLabels.buttons
        ] || section.buttonLabel
      : "";

  return (
    <section className="w-full py-16 md:py-20 bg-(--background)">
      <div className="main-container flex flex-col gap-12">
        {/* 1. Section Header - Sinkron dengan ProjectsGallery */}
        {section && (
          <div className="flex flex-col text-center md:text-start max-w-3xl">
            <h2
              className="tracking-wide leading-[0.9]"
              style={{
                fontSize: "var(--text-section-title)",
                fontFamily: "var(--font-display)",
              }}
            >
              {section.title}
            </h2>
            <p
              className="text-(--gray-medium) font-medium leading-relaxed"
              style={{ fontSize: "var(--text-desc)" }}
            >
              {section.description}
            </p>
          </div>
        )}

        {/* 2. Services List Grid - Menggunakan ServicesCard Wrapper */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {servicesData.items.map((service, index) => (
            <ServicesCard key={service.id} index={index}>
              <div className="flex flex-col gap-2 group">
                <div className="flex justify-between items-center">
                  <span
                    className="text-(--accent) opacity-40 group-hover:opacity-100 transition-opacity"
                    style={{
                      fontSize: "var(--text-stats-num)",
                      fontFamily:
                        "var(--font-modak), var(--font-display), cursive",
                    }}
                  >
                    {String(service.order).padStart(2, "0")}
                  </span>
                </div>
                <h3
                  className="leading-wide"
                  style={{ fontSize: "clamp(1.25rem, 2.5vw, 1.75rem)" }}
                >
                  {service.title}
                </h3>
                <p
                  className="font-medium text-(--gray-medium) leading-relaxed"
                  style={{ fontSize: "var(--text-services-desc)" }}
                >
                  {service.summary}
                </p>
              </div>
            </ServicesCard>
          ))}
        </div>

        {/* 3. Button - Sinkron dengan ProjectsGallery (Posisi Bawah Tengah) */}
        {section.showButton && buttonLabel && (
          <div className="flex justify-center">
            <Button
              href={`/${locale}/services`}
              variant="primary"
              className="min-w-52"
            >
              {buttonLabel}
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
