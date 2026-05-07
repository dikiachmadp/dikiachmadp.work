import React from "react";
import { getDictionary } from "@/lib/dictionary";
import PageWrapper from "@/components/layout/PageWrapper";
import PageHeader from "@/components/layout/PageHeader";
import SectionWrapper from "@/components/layout/SectionWrapper";
import { Locale } from "@/types/content";

export default async function LegalPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const resolvedParams = await params;
  const validLocale = (resolvedParams.locale === "en" || resolvedParams.locale === "id")
    ? (resolvedParams.locale as Locale)
    : "en";

  const dict = await getDictionary(validLocale);
  const legal = dict.legal;

  return (
    <PageWrapper>
      <PageHeader
        topTitle={`Last updated: ${legal.lastUpdated}`}
        title={legal.title}
        description={legal.description}
      />

      <SectionWrapper id="legal-content">
        <div className="max-w-3xl">
          {legal.points?.map((point) => (
            <div
              key={point.id}
              className="py-8 border-b-2 border-(--border) last:border-b-0"
            >
              <h2 className="text-xl font-black uppercase mb-3">{point.title}</h2>
              <p className="text-base font-medium text-(--gray-medium) leading-relaxed">
                {point.content}
              </p>
            </div>
          ))}

          {legal.sections?.map((section, index) => (
            <div key={index} className="py-8 border-b-2 border-(--border) last:border-b-0">
              <h2 className="text-xl font-black uppercase mb-3">{section.heading}</h2>
              <p className="text-base font-medium text-(--gray-medium) leading-relaxed">
                {section.content}
              </p>
            </div>
          ))}
        </div>
      </SectionWrapper>
    </PageWrapper>
  );
}
