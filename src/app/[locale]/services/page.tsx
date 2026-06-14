import React from "react";
import type { Metadata } from "next";
import { getDictionary } from "@/lib/dictionary";
import { createMetadata } from "@/lib/metadata";
import PageWrapper from "@/components/layout/PageWrapper";
import PageHeader from "@/components/layout/PageHeader";
import SectionWrapper from "@/components/layout/SectionWrapper";
import CTASection from "@/components/sections/CTASection";
import ServicesCard from "@/components/ui/ServicesCard";
import { Locale } from "@/types/content";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const validLocale = (locale === "id" ? "id" : "en") as Locale;
  const dict = await getDictionary(validLocale);
  const { pageHeader, siteConfig } = dict;

  return createMetadata({
    title: pageHeader.services.title,
    description: pageHeader.services.description,
    path: "/services",
    siteConfig,
    locale: validLocale,
  });
}

export default async function ServicesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const resolvedParams = await params;
  const validLocale =
    resolvedParams.locale === "en" || resolvedParams.locale === "id"
      ? (resolvedParams.locale as Locale)
      : "en";

  const dict = await getDictionary(validLocale);
  const header = dict.pageHeader.services;

  return (
    <PageWrapper>
      <PageHeader
        topTitle={header.topTitle}
        title={header.title}
        description={header.description}
      />
      <SectionWrapper id="services-list">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8 md:gap-10">
          {dict.services.items.map((service) => (
            <ServicesCard key={service.id}>
              <div className="flex flex-col gap-6 h-full">
                <div className="flex flex-col gap-2">
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
                  <h2
                    className="leading-tight"
                    style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)" }}
                  >
                    {service.title}
                  </h2>
                </div>
                <p
                  className="font-medium text-(--gray-medium) leading-relaxed"
                  style={{ fontSize: "var(--text-services-desc)" }}
                >
                  {service.summary}
                </p>
                <div className="mt-auto pt-6 border-t-2 border-(--border) border-dashed">
                  <ul className="grid grid-cols-1 gap-3">
                    {service.deliverables.map((item, index) => (
                      <li
                        key={index}
                        className="flex items-start gap-3 text-[10px] font-bold uppercase tracking-widest text-(--foreground)"
                      >
                        <span className="text-(--accent) shrink-0 text-xs">
                          ✦
                        </span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </ServicesCard>
          ))}
        </div>
      </SectionWrapper>
      <CTASection ctaData={dict.cta} uiLabels={dict.ui} locale={validLocale} />
    </PageWrapper>
  );
}
