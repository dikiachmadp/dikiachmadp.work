import React from "react";
import { getDictionary } from "@/lib/dictionary";
import PageWrapper from "@/components/layout/PageWrapper";
import PageHeader from "@/components/layout/PageHeader";
import SectionWrapper from "@/components/layout/SectionWrapper";
import ExperienceSection from "@/components/sections/ExperienceSection";
import CTASection from "@/components/sections/CTASection";
import { Locale } from "@/types/content";

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const resolvedParams = await params;
  const validLocale = (resolvedParams.locale === "en" || resolvedParams.locale === "id")
    ? (resolvedParams.locale as Locale)
    : "en";

  const dict = await getDictionary(validLocale);
  const header = dict.pageHeader.about;

  return (
    <PageWrapper>
      <PageHeader
        topTitle={header.topTitle}
        title={header.title}
        description={header.description}
      />

      {/* Biography */}
      <SectionWrapper id="biography" className="border-b-2 border-(--border)">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-start">
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tighter mb-2 text-(--gray-medium)">
              Biography
            </h2>
            <div className="h-0.5 w-12 bg-(--accent) mb-8" />
          </div>
          <div className="flex flex-col gap-5">
            {dict.about.biography.map((paragraph, index) => (
              <p key={index} className="text-base md:text-lg font-medium leading-relaxed">
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      </SectionWrapper>

      {/* Experience & Skills */}
      <ExperienceSection aboutData={dict.about} />

      {/* CTA */}
      <CTASection
        ctaData={dict.cta}
        uiLabels={dict.ui}
        locale={validLocale}
      />
    </PageWrapper>
  );
}
