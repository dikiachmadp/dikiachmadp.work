import React from "react";
import { getDictionary } from "@/lib/dictionary";
import PageWrapper from "@/components/layout/PageWrapper";
import PageHeader from "@/components/layout/PageHeader";
import SectionWrapper from "@/components/layout/SectionWrapper";
import ProjectsGallery from "@/components/sections/ProjectsGallery";
import CTASection from "@/components/sections/CTASection";
import { Locale } from "@/types/content";

export default async function ProjectsPage({
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
  const header = dict.pageHeader.projects;

  return (
    <PageWrapper>
      <PageHeader
        topTitle={header.topTitle}
        title={header.title}
        description={header.description}
      />
      <SectionWrapper id="projects-gallery">
        <ProjectsGallery
          projectsData={dict.projects}
          uiLabels={dict.ui}
          locale={validLocale}
          featuredOnly={false}
        />
      </SectionWrapper>
      <CTASection ctaData={dict.cta} uiLabels={dict.ui} locale={validLocale} />
    </PageWrapper>
  );
}
