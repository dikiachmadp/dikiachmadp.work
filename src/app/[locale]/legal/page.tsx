import React from "react";
import type { Metadata } from "next";
import { getDictionary } from "@/lib/dictionary";
import { createMetadata } from "@/lib/metadata";
import PageWrapper from "@/components/layout/PageWrapper";
import PageHeader from "@/components/layout/PageHeader";
import SectionWrapper from "@/components/layout/SectionWrapper";
import { Locale } from "@/types/content";

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
    title: pageHeader.legal.title,
    description: pageHeader.legal.description,
    path: "/legal",
    siteConfig,
    locale: validLocale,
  });
}
export default async function LegalPage({
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
  const { pageHeader, legal } = dict;
  return (
    <PageWrapper>
      <PageHeader
        topTitle={pageHeader.legal.topTitle}
        title={pageHeader.legal.title}
        description={pageHeader.legal.description}
      />
      <SectionWrapper id="legal-content">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10 max-w-6xl mx-auto">
          {legal.sections?.map((section, index) => (
            <div
              key={index}
              className="group relative bg-(--foreground) rounded-(--button-radius)"
            >
              <div className="relative h-full p-6 md:p-8 bg-(--background) border-2 border-(--foreground) rounded-(--button-radius) transition-all duration-300 ease-out translate-x-0 translate-y-0 group-hover:-translate-x-1 group-hover:-translate-y-1">
                <div className="flex justify-between items-start gap-4 mb-4 border-b-2 border-(--border)">
                  <h2
                    className="leading-[1.1] group-hover:text-(--accent) transition-colors"
                    style={{
                      fontSize: "clamp(1.5rem, 3vw, 2.25rem)",
                      fontFamily: "var(--font-modak)",
                    }}
                  >
                    {section.heading}
                  </h2>
                  <span
                    className="font-bold uppercase tracking-widest text-(--gray-medium) shrink-0"
                    style={{ fontSize: "var(--text-ui-label)" }}
                  >
                    0{(legal.points?.length || 0) + index + 1}
                  </span>
                </div>
                <div className="text-base font-medium text-(--gray-medium) leading-relaxed space-y-4">
                  {section.content
                    .split("\n\n")
                    .map((paragraph: string, pIndex: number) => (
                      <p key={pIndex}>{paragraph}</p>
                    ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </SectionWrapper>
    </PageWrapper>
  );
}
