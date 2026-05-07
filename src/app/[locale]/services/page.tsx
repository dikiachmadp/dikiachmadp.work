import React from "react";
import { getDictionary } from "@/lib/dictionary";
import PageWrapper from "@/components/layout/PageWrapper";
import PageHeader from "@/components/layout/PageHeader";
import SectionWrapper from "@/components/layout/SectionWrapper";
import CTASection from "@/components/sections/CTASection";
import { Locale } from "@/types/content";

export default async function ServicesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const resolvedParams = await params;
  const validLocale = (resolvedParams.locale === "en" || resolvedParams.locale === "id")
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          {dict.services.items.map((service) => (
            <div
              key={service.id}
              className="flex flex-col border-2 border-(--border) p-6 md:p-8 hover:border-(--accent) transition-all duration-200 bg-(--card) group"
            >
              <div className="flex justify-between items-start mb-6 pb-4 border-b-2 border-(--border)">
                <h2 className="text-2xl md:text-3xl font-black uppercase leading-tight w-3/4">
                  {service.title}
                </h2>
                <span className="text-2xl font-black font-mono text-(--accent) opacity-50 group-hover:opacity-100 transition-opacity">
                  {String(service.order).padStart(2, "0")}
                </span>
              </div>
              <p className="text-base font-medium text-(--gray-medium) mb-8 leading-relaxed">
                {service.summary}
              </p>
              <div className="mt-auto">
                <p className="text-xs font-black uppercase tracking-widest text-(--gray-medium) mb-4">
                  Deliverables
                </p>
                <ul className="flex flex-col gap-3">
                  {service.deliverables.map((item, index) => (
                    <li key={index} className="flex items-start gap-3 text-sm font-medium">
                      <span className="text-(--accent) mt-0.5 shrink-0 text-base">✦</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </SectionWrapper>

      <CTASection
        ctaData={dict.cta}
        uiLabels={dict.ui}
        locale={validLocale}
      />
    </PageWrapper>
  );
}
