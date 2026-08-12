import React from "react";
import type { Metadata } from "next";
import Image from "next/image";
import { getDictionary } from "@/lib/dictionary";
import { createMetadata } from "@/lib/metadata";
import PageWrapper from "@/components/layout/PageWrapper";
import SectionWrapper from "@/components/layout/SectionWrapper";
import ExperienceSection from "@/components/sections/ExperienceSection";
import CTASection from "@/components/sections/CTASection";
import Button from "@/components/ui/Button";
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
  const header = dict.pageHeader.about;

  return createMetadata({
    title: header.title,
    description: header.description,
    path: "/about",
    siteConfig: dict.siteConfig,
    locale: validLocale,
  });
}

const DownloadIcon = () => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.4"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <path d="M12 3v12M7 12l5 5 5-5M4 20h16" />
  </svg>
);

export default async function AboutPage({ params }: PageProps) {
  const { locale } = await params;
  const validLocale = (locale === "id" ? "id" : "en") as Locale;
  const dict = await getDictionary(validLocale);
  const header = dict.pageHeader.about;
  const { about, siteConfig } = dict;

  return (
    <PageWrapper>
      <SectionWrapper id="about" spacing="sm">
        <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-[330px_1fr]">
          <div className="flex flex-col gap-[30px]">
            <div className="relative">
              <div className="r-portrait ink-border flat-6 relative aspect-square overflow-hidden bg-(--wash)">
                <Image
                  src="/foto.webp"
                  alt={siteConfig.fullName}
                  fill
                  sizes="330px"
                  priority
                  className="object-cover"
                  style={{ filter: "grayscale(1) contrast(1.1)" }}
                />
              </div>
              <span
                className="font-note ink-border flat-3 absolute -bottom-3.5 -left-3 bg-(--paper) px-3.5 py-[5px] text-[19px]"
                style={{ transform: "rotate(-5deg)" }}
              >
                {about.sticker}
              </span>
            </div>

            <div className="flex flex-col gap-[11px]">
              <span className="font-note text-[19px] text-(--soft)">
                {about.cv.note}
              </span>
              {about.cv.items.map((item, i) => (
                <Button
                  key={item.label}
                  href={item.href}
                  target="_blank"
                  variant={i === 0 ? "primary" : "secondary"}
                  mirrored={i !== 0}
                  fullWidth
                >
                  <DownloadIcon />
                  {item.label}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <div className="eyebrow">{header.topTitle}</div>
            <h1 className="font-hand mt-0.5 mb-[18px] text-[clamp(2.2rem,4.8vw,3.6rem)] leading-none">
              {header.title}
            </h1>
            {about.biography.map((paragraph, i) => (
              <p
                key={i}
                className="mb-3.5 max-w-[620px] text-[16px] leading-[1.75] text-(--soft)"
              >
                {paragraph}
              </p>
            ))}

            <ExperienceSection aboutData={about} />
          </div>
        </div>
      </SectionWrapper>

      <SectionWrapper id="cta">
        <CTASection ctaData={dict.cta} locale={validLocale} />
      </SectionWrapper>
    </PageWrapper>
  );
}
