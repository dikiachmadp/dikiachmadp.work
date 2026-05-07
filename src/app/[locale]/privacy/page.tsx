import React from "react";
import { getDictionary } from "@/lib/dictionary";
import PageWrapper from "@/components/layout/PageWrapper";
import PageHeader from "@/components/layout/PageHeader";
import SectionWrapper from "@/components/layout/SectionWrapper";
import { Locale } from "@/types/content";

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const resolvedParams = await params;
  const validLocale = (resolvedParams.locale === "en" || resolvedParams.locale === "id")
    ? (resolvedParams.locale as Locale)
    : "en";

  const dict = await getDictionary(validLocale);
  const privacy = dict.privacy;

  return (
    <PageWrapper>
      <PageHeader
        topTitle={`Last updated: ${privacy.lastUpdated}`}
        title={privacy.title}
        description={privacy.description}
      />

      <SectionWrapper id="privacy-content">
        <div className="max-w-3xl">
          {privacy.points?.map((point) => (
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

          {privacy.sections?.map((section, index) => (
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
