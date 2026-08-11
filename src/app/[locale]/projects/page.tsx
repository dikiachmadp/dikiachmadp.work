import React from "react";
import type { Metadata } from "next";
import { getDictionary } from "@/lib/dictionary";
import { createMetadata } from "@/lib/metadata";
import PageWrapper from "@/components/layout/PageWrapper";
import PageHeader from "@/components/layout/PageHeader";
import SectionWrapper from "@/components/layout/SectionWrapper";
import ProjectsExplorer from "@/components/interactive/ProjectsExplorer";
import CTASection from "@/components/sections/CTASection";
import { Locale } from "@/types/content";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const validLocale = (locale === "id" ? "id" : "en") as Locale;
  const dict = await getDictionary(validLocale);
  const { pageHeader, siteConfig } = dict;

  return createMetadata({
    title: pageHeader.projects.title,
    description: pageHeader.projects.description,
    path: "/projects",
    siteConfig,
    locale: validLocale,
  });
}

export default async function ProjectsPage({ params }: PageProps) {
  const { locale } = await params;
  const validLocale = (locale === "id" ? "id" : "en") as Locale;
  const dict = await getDictionary(validLocale);
  const header = dict.pageHeader.projects;

  return (
    <PageWrapper>
      <SectionWrapper id="projects" spacing="sm">
        <PageHeader
          topTitle={header.topTitle}
          title={header.title}
          description={header.description}
          className="mb-[30px]"
        />
        <ProjectsExplorer
          projectsData={dict.projects}
          uiLabels={dict.ui}
          locale={validLocale}
        />
      </SectionWrapper>

      <SectionWrapper id="cta">
        <CTASection ctaData={dict.cta} locale={validLocale} />
      </SectionWrapper>
    </PageWrapper>
  );
}
