import React from "react";
import type { Metadata } from "next";
import { getDictionary } from "@/lib/dictionary";
import { createMetadata } from "@/lib/metadata";
import PageWrapper from "@/components/layout/PageWrapper";
import PageHeader from "@/components/layout/PageHeader";
import SectionWrapper from "@/components/layout/SectionWrapper";
import ProjectsGallery from "@/components/sections/ProjectsGallery";
import CTASection from "@/components/sections/CTASection";
import { Locale, ProjectsData } from "@/types/content";
import { prisma } from "@/lib/prisma";

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
    title: pageHeader.projects.title,
    description: pageHeader.projects.description,
    path: "/projects",
    siteConfig,
    locale: validLocale,
  });
}

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

  // Fetch from DB
  const dbProjects = await prisma.project.findMany();

  // Map DB projects to frontend expected structure
  // This is a partial mapping based on current DB schema vs JSON schema
  const dbProjectsMapped = dbProjects.map((p) => ({
    ...dict.projects.items[0], // Use first item as template for missing fields
    id: p.id,
    title: p.title,
    slug: p.slug,
    description: p.description,
    coverImage: p.imageUrl,
  }));

  const projectsData: ProjectsData = {
    categories: ["All", ...Array.from(new Set(dbProjects.map(p => p.title)))], // Simplification for now
    items: dbProjectsMapped,
  };

  return (
    <PageWrapper>
      <PageHeader
        topTitle={header.topTitle}
        title={header.title}
        description={header.description}
      />
      <SectionWrapper id="projects-gallery">
        <ProjectsGallery
          projectsData={projectsData}
          uiLabels={dict.ui}
          locale={validLocale}
          featuredOnly={false}
        />
      </SectionWrapper>
      <CTASection ctaData={dict.cta} uiLabels={dict.ui} locale={validLocale} />
    </PageWrapper>
  );
}
