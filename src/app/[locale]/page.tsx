import React from "react";
import type { Metadata } from "next";
import { getDictionary } from "@/lib/dictionary";
import { createMetadata } from "@/lib/metadata";
import PageWrapper from "@/components/layout/PageWrapper";
import Hero from "@/components/sections/Hero";
import ServicesPreview from "@/components/sections/ServicesPreview";
import ProjectsGallery from "@/components/sections/ProjectsGallery";
import TestimonialsSection from "@/components/sections/TestimonialsSection";
import CTASection from "@/components/sections/CTASection";
import SectionWrapper from "@/components/layout/SectionWrapper";
import { Locale } from "@/types/content";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const validLocale = (locale === "id" ? "id" : "en") as Locale;
  const dict = await getDictionary(validLocale);
  const { siteConfig } = dict;

  return createMetadata({
    title: siteConfig.fullName,
    description: siteConfig.description,
    path: "",
    siteConfig,
    locale: validLocale,
  });
}

export default async function HomePage({ params }: PageProps) {
  const resolvedParams = await params;
  const validLocale =
    resolvedParams.locale === "id" || resolvedParams.locale === "en"
      ? (resolvedParams.locale as Locale)
      : "en";

  const dict = await getDictionary(validLocale);

  return (
    <PageWrapper>
      <Hero heroData={dict.hero} locale={validLocale} />

      <SectionWrapper id="featured-projects">
        <ProjectsGallery
          projectsData={dict.projects}
          sectionsData={dict.sections}
          uiLabels={dict.ui}
          locale={validLocale}
          featuredOnly={true}
        />
      </SectionWrapper>

      <ServicesPreview
        servicesData={dict.services}
        sectionsData={dict.sections}
        uiLabels={dict.ui}
        locale={validLocale}
      />

      <TestimonialsSection
        testimonialsData={dict.testimonials}
        sectionsData={dict.sections}
      />

      <CTASection ctaData={dict.cta} uiLabels={dict.ui} locale={validLocale} />
    </PageWrapper>
  );
}
