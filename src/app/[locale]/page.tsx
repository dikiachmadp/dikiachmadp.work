import React from "react";
import type { Metadata } from "next";
import { getDictionary } from "@/lib/dictionary";
import { getProjects } from "@/lib/db/projects";
import { getTestimonials } from "@/lib/db/testimonials";
import { createMetadata } from "@/lib/metadata";
import PageWrapper from "@/components/layout/PageWrapper";
import SectionWrapper from "@/components/layout/SectionWrapper";
import Hero from "@/components/sections/Hero";
import StatBox from "@/components/ui/StatBox";
import ProjectsGallery from "@/components/sections/ProjectsGallery";
import ServicesPreview from "@/components/sections/ServicesPreview";
import TestimonialsSection from "@/components/sections/TestimonialsSection";
import CTASection from "@/components/sections/CTASection";
import JsonLd from "@/components/seo/JsonLd";
import { personSchema, websiteSchema } from "@/lib/structured-data";
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
  const { locale } = await params;
  const validLocale = (locale === "id" ? "id" : "en") as Locale;
  const [dict, featured, testimonials] = await Promise.all([
    getDictionary(validLocale),
    getProjects(validLocale, { featured: true }),
    getTestimonials(validLocale),
  ]);

  return (
    <PageWrapper>
      {/* Siapa pemilik situs ini, dan situs apa ini. Tanpa keduanya mesin
          pencari hanya menebak dari teks halaman. */}
      <JsonLd data={personSchema(dict.siteConfig, validLocale)} />
      <JsonLd data={websiteSchema(dict.siteConfig, validLocale)} />

      <Hero heroData={dict.hero} locale={validLocale} />

      <SectionWrapper id="stats" spacing="md">
        <div className="grid grid-cols-1 gap-[22px] sm:grid-cols-3">
          {dict.hero.stats.map((stat, i) => (
            <StatBox
              key={stat.id}
              value={stat.value}
              label={stat.label}
              index={i}
            />
          ))}
        </div>
      </SectionWrapper>

      <SectionWrapper id="featured-projects">
        <ProjectsGallery
          projectsData={{ ...dict.projects, items: featured }}
          sectionsData={dict.sections}
          uiLabels={dict.ui}
          locale={validLocale}
        />
      </SectionWrapper>

      <SectionWrapper id="services">
        <ServicesPreview
          servicesData={dict.services}
          sectionsData={dict.sections}
          locale={validLocale}
        />
      </SectionWrapper>

      <SectionWrapper id="testimonials">
        <TestimonialsSection
          testimonialsData={{ items: testimonials }}
          sectionsData={dict.sections}
        />
      </SectionWrapper>

      <SectionWrapper id="cta">
        <CTASection ctaData={dict.cta} locale={validLocale} />
      </SectionWrapper>
    </PageWrapper>
  );
}
