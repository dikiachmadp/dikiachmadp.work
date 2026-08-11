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

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const validLocale = (locale === "id" ? "id" : "en") as Locale;
  const dict = await getDictionary(validLocale);
  const header = dict.pageHeader.services;

  return createMetadata({
    title: header.title,
    description: header.description,
    path: "/services",
    siteConfig: dict.siteConfig,
    locale: validLocale,
  });
}

export default async function ServicesPage({ params }: PageProps) {
  const { locale } = await params;
  const validLocale = (locale === "id" ? "id" : "en") as Locale;
  const dict = await getDictionary(validLocale);
  const header = dict.pageHeader.services;

  return (
    <PageWrapper>
      <SectionWrapper id="services" spacing="sm">
        <PageHeader
          topTitle={header.topTitle}
          title={header.title}
          description={header.description}
          className="mb-8"
        />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {dict.services.items.map((service) => (
            <ServicesCard key={service.id} service={service} />
          ))}
        </div>
      </SectionWrapper>

      <SectionWrapper id="cta">
        <CTASection ctaData={dict.cta} locale={validLocale} />
      </SectionWrapper>
    </PageWrapper>
  );
}
