import React from "react";
import Image from "next/image";
import { getDictionary } from "@/lib/dictionary";
import PageWrapper from "@/components/layout/PageWrapper";
import PageHeader from "@/components/layout/PageHeader";
import SectionWrapper from "@/components/layout/SectionWrapper";
import ExperienceSection from "@/components/sections/ExperienceSection";
import CTASection from "@/components/sections/CTASection";
import { Locale } from "@/types/content";
import { cn, themeTransition } from "@/lib/utils";
import { Download } from "lucide-react";

export default async function AboutPage({
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
  const header = dict.pageHeader.about;

  return (
    <PageWrapper>
      <PageHeader
        topTitle={header.topTitle}
        title={header.title}
        description={header.description}
      />

      {/* Biography Section */}
      <SectionWrapper id="biography" className="border-b-2 border-(--border)">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-24 items-start">
          {/* Left Side: Photo Placeholder */}
          <div className="lg:col-span-5 relative group">
            {/* Shadow Layer */}
            <div className="absolute inset-0 bg-(--foreground) rounded-2xl transition-all duration-300" />

            {/* Left Side: Photo Placeholder Container */}
            <div className="lg:col-span-5 relative group">
              {/* Shadow Layer (Tetap di belakang, tidak bergerak) */}
              <div className="absolute inset-0 bg-(--foreground) rounded-2xl transition-all duration-200" />

              {/* Image/Content Layer (Bergerak saat container di-hover) */}
              <div
                className={cn(
                  "relative aspect-4/3 bg-(--gray-light) border-2 border-(--foreground) rounded-2xl overflow-hidden",
                  // Menggunakan jarak translasi yang sama dengan card lainnya
                  "group-hover:-translate-x-1 group-hover:-translate-y-1 transition-all duration-200",
                  themeTransition,
                )}
              >
                <Image
                  src="/foto.webp"
                  alt={dict.siteConfig.fullName || "Profile Photo"}
                  fill
                  className="object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                  priority
                />
              </div>
            </div>
          </div>

          {/* Right Side: Text & CV Button */}
          <div className="lg:col-span-7 flex flex-col gap-8">
            <div className="flex flex-col gap-2">
              <div className="h-0.5 w-12 bg-(--foreground)" />
            </div>

            <div className="flex flex-col gap-6">
              {dict.about.biography.map((paragraph, index) => (
                <p
                  key={index}
                  className="text-base md:text-lg font-medium leading-relaxed text-(--foreground)"
                >
                  {paragraph}
                </p>
              ))}
            </div>

            {/* Download CV Button - Styled like Filter Button */}
            <div className="pt-4">
              <a
                href="/cv-diki.pdf" // Sesuaikan path file CV Anda
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block group relative outline-none"
              >
                {/* Shadow Layer */}
                <div className="absolute inset-0 rounded-lg bg-(--foreground) transition-all duration-200" />

                {/* Content Layer */}
                <div
                  className={cn(
                    "relative flex h-12 px-8 items-center justify-center rounded-lg uppercase transition-all duration-200 text-[10px] font-bold tracking-[0.2em] border-2",
                    "bg-(--background) text-(--foreground) border-(--foreground)",
                    "group-hover:-translate-x-1 group-hover:-translate-y-1 group-active:translate-x-0 group-active:translate-y-0",
                    themeTransition,
                  )}
                >
                  <Download
                    className="w-4 h-4 mr-3 text-(--accent)"
                    strokeWidth={3}
                  />
                  {dict.ui.buttons.download || "Download CV"}
                </div>
              </a>
            </div>
          </div>
        </div>
      </SectionWrapper>

      {/* Experience & Skills */}
      <ExperienceSection aboutData={dict.about} uiLabels={dict.ui} />

      {/* CTA */}
      <CTASection ctaData={dict.cta} uiLabels={dict.ui} locale={validLocale} />
    </PageWrapper>
  );
}
