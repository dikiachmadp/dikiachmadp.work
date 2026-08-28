import React from "react";
import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getDictionary } from "@/lib/dictionary";
import { getAboutProfile, type AboutProfileData } from "@/lib/db/about";
import { createMetadata } from "@/lib/metadata";
import { cn } from "@/lib/utils";
import PageWrapper from "@/components/layout/PageWrapper";
import SectionWrapper from "@/components/layout/SectionWrapper";
import ExperienceSection from "@/components/sections/ExperienceSection";
import CTASection from "@/components/sections/CTASection";
import Button from "@/components/ui/Button";
import Tag from "@/components/ui/Tag";
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

/**
 * Rendered twice further down — once pinned in the profile sidebar for
 * `lg` and up, once inlined between the bio and Experience for mobile,
 * each toggled with `hidden`/`lg:hidden` rather than reordered with CSS
 * `order` because the two spots live in separate grid columns.
 */
function SkillsBlock({ about }: { about: AboutProfileData }) {
  if (about.skills.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      <h2 className="font-hand m-center text-[20px]">{about.skillsTitle}</h2>
      {about.skills.map((group, i) => (
        <div
          key={group.category}
          className={cn(
            "ink-border lift-card-sm flat-3 bg-(--wash) p-4",
            i % 2 === 0 ? "r-card-alt" : "r-card",
            i % 2 === 1 && "lift-card-sm-cw",
          )}
        >
          <div className="mb-2 text-[10px] font-bold tracking-[0.18em] text-(--soft) uppercase max-sm:text-center">
            {group.category}
          </div>
          <div className="flex flex-wrap gap-[7px] max-sm:justify-center">
            {group.items.map((item) => (
              <Tag
                key={item}
                className="bg-(--paper) text-[12px] font-semibold tracking-normal text-(--ink) normal-case"
              >
                {item}
              </Tag>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default async function AboutPage({ params }: PageProps) {
  const { locale } = await params;
  const validLocale = (locale === "id" ? "id" : "en") as Locale;
  const [dict, about] = await Promise.all([
    getDictionary(validLocale),
    getAboutProfile(validLocale),
  ]);

  // Seed migrasi selalu mengisi satu baris profil; ini hanya jaring pengaman
  // kalau baris itu pernah terhapus tanpa penggantinya lewat admin.
  if (!about) notFound();

  const header = dict.pageHeader.about;
  const { siteConfig } = dict;
  const [leadParagraph, ...restParagraphs] = about.biography;

  return (
    <PageWrapper>
      <SectionWrapper id="about" spacing="sm">
        <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-[330px_1fr]">
          <div className="flex flex-col gap-[30px]">
            <div className="anim-float relative">
              {/* Bentuk dekoratif mengisi ruang kosong di belakang potret,
                  senada dengan craft-badge Hero yang mengintip di sudut
                  frame video. */}
              <span
                className="crosshatch ink-border absolute -top-4 -right-4 -z-10 h-16 w-16 rounded-full bg-(--wash)"
                aria-hidden
              />
              <div className="r-portrait ink-border flat-6 relative aspect-square overflow-hidden bg-(--wash)">
                <Image
                  src={about.portraitUrl || "/foto.webp"}
                  alt={siteConfig.fullName}
                  fill
                  // The 330px column only exists from lg up; below that the
                  // portrait spans the full container, so a flat "330px" made
                  // the browser pick a candidate it then upscaled ~3.4x.
                  sizes="(max-width: 1023px) 100vw, 330px"
                  priority
                  className="object-cover"
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
                {about.cvNote}
              </span>
              {about.cvItems.map((item, i) => (
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

            {/* lg+ only: below that, this same block reappears further down
                between the bio and Experience — see the `lg:hidden` block
                past restParagraphs. */}
            <div className="hidden lg:block">
              <SkillsBlock about={about} />
            </div>
          </div>

          <div className="m-center">
            <div className="eyebrow">{header.topTitle}</div>
            <h1 className="font-hand mt-0.5 mb-[18px] text-[clamp(2.2rem,4.8vw,3.6rem)] leading-none">
              <span
                style={{
                  backgroundImage:
                    "linear-gradient(transparent 62%, color-mix(in srgb, var(--accent-ink) 26%, transparent) 62%, color-mix(in srgb, var(--accent-ink) 26%, transparent) 94%, transparent 94%)",
                }}
              >
                {header.title}
              </span>
            </h1>
            {leadParagraph && (
              <p className="justify-body mb-5 border-l-[3px] border-(--accent-ink) pl-5 text-[18px] leading-[1.65] font-medium text-(--ink)">
                {leadParagraph}
              </p>
            )}

            {restParagraphs.map((paragraph, i) => (
              <div key={i}>
                <div className="dashed-rule my-4" />
                <p className="justify-body text-[16px] leading-[1.75] text-(--ink)">
                  {paragraph}
                </p>
              </div>
            ))}

            {/* Below lg, Skills lives here instead of the sidebar — see the
                `hidden lg:block` copy up in the left column. */}
            <div className="lg:hidden">
              <div className="dashed-rule my-9" />
              <SkillsBlock about={about} />
            </div>

            <div className="dashed-rule my-9" />

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
