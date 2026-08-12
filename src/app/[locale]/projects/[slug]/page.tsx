import React from "react";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { getDictionary } from "@/lib/dictionary";
import { getAllProjectSlugs, getProjectBySlug } from "@/lib/db/projects";
import { createMetadata } from "@/lib/metadata";
import PageWrapper from "@/components/layout/PageWrapper";
import Button from "@/components/ui/Button";
import Tag from "@/components/ui/Tag";
import { Locale } from "@/types/content";
import { cn } from "@/lib/utils";

interface ProjectDetailPageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateStaticParams() {
  // CI membangun tanpa database; tanpa guard ini `next build` mencoba query.
  if (process.env.SKIP_DB_STATIC_GEN) return [];

  const slugs = await getAllProjectSlugs();
  return ["en", "id"].flatMap((locale) =>
    slugs.map((slug) => ({ locale, slug })),
  );
}

export async function generateMetadata({
  params,
}: ProjectDetailPageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const validLocale = (locale === "id" ? "id" : "en") as Locale;
  const [dict, project] = await Promise.all([
    getDictionary(validLocale),
    getProjectBySlug(validLocale, slug),
  ]);

  if (!project) return { title: "Project Not Found" };

  return createMetadata({
    title: project.title,
    description: project.description,
    path: `/projects/${slug}`,
    siteConfig: dict.siteConfig,
    locale: validLocale,
  });
}

export default async function ProjectDetailPage({
  params,
}: ProjectDetailPageProps) {
  const { locale, slug } = await params;
  const validLocale = (locale === "id" ? "id" : "en") as Locale;
  const [dict, project] = await Promise.all([
    getDictionary(validLocale),
    getProjectBySlug(validLocale, slug),
  ]);

  if (!project) notFound();

  const t = dict.ui.projectDetail;
  const hasCover = Boolean(project.coverImage);
  // Selama galeri kosong, panel crosshatch lama tetap tampil — begitu gambar
  // diunggah lewat CMS, gambar itu yang muncul.
  const gallery = project.gallery ?? [];
  const blocks =
    project.contentBlocks && project.contentBlocks.length > 0
      ? project.contentBlocks
      : [project.description];

  const facts = [
    { label: t.client, value: project.client },
    { label: t.datePublished, value: project.year },
    { label: t.role, value: project.role },
    { label: t.duration, value: project.duration },
  ].filter((fact): fact is { label: string; value: string } =>
    Boolean(fact.value),
  );

  return (
    <PageWrapper>
      <div className="mx-auto w-full max-w-[980px] px-[22px] pt-11">
        <Button
          href={`/${validLocale}/projects`}
          variant="secondary"
          size="sm"
          className="r-chip mb-[26px] px-4 py-2 text-[12px]"
        >
          ← {t.backBtn}
        </Button>

        <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-(--soft)">
          {project.category} · {project.year}
        </div>
        <h1 className="font-hand mb-4 mt-1.5 text-[clamp(2.4rem,5.6vw,4.2rem)] leading-none">
          {project.title}
        </h1>
        <p className="mb-[30px] max-w-[640px] text-[17px] leading-[1.65] text-(--soft)">
          {project.description}
        </p>

        <div className="r-frame ink-border flat-5 mb-[34px] bg-(--wash) p-2.5">
          <div
            className={cn(
              "r-frame-inner ink-border relative flex aspect-video items-center justify-center overflow-hidden",
              !hasCover && "crosshatch",
            )}
          >
            {hasCover ? (
              <Image
                src={project.coverImage}
                alt={project.title}
                fill
                sizes="(max-width: 980px) 100vw, 960px"
                priority
                className="photo-ink object-cover"
              />
            ) : (
              <span className="font-tech text-[11px] uppercase tracking-[0.2em] text-(--soft)">
                {project.category.toLowerCase()} cover
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 items-start gap-9 lg:grid-cols-[1fr_260px]">
          <div className="flex flex-col gap-[18px]">
            <h2 className="font-hand text-[28px]">{t.aboutProject}</h2>
            {blocks.map((paragraph, i) => (
              <p key={i} className="m-0 text-[16px] leading-[1.75] text-(--soft)">
                {paragraph}
              </p>
            ))}
            <div className="mt-1.5 flex flex-wrap gap-2">
              {project.tags.map((tag) => (
                <Tag key={tag} className="px-3 py-[5px]">
                  {tag}
                </Tag>
              ))}
            </div>
          </div>

          <aside className="r-card-alt ink-border flat-3 flex flex-col gap-3.5 bg-(--paper) p-5">
            {facts.map((fact) => (
              <div key={fact.label}>
                <div className="micro">{fact.label}</div>
                <div className="font-hand mt-0.5 text-[18px] leading-[1.2]">
                  {fact.value}
                </div>
              </div>
            ))}

            <div className="h-0.5 bg-(--line) opacity-25" />

            {project.liveUrl && (
              <Button
                href={project.liveUrl}
                target="_blank"
                variant="primary"
                size="sm"
                fullWidth
                className="r-chip py-[11px] text-[13px]"
              >
                {t.visitBtn} ↗
              </Button>
            )}
          </aside>
        </div>

        <div className="mt-11">
          <h2 className="font-hand mb-4 text-[28px]">{t.galleryLabel}</h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {gallery.length > 0
              ? gallery.map((src, i) => (
                  <div
                    key={src}
                    className="r-card ink-border relative aspect-[4/3] overflow-hidden bg-(--wash) transition-all duration-[0.25s] ease-out hover:-translate-x-[3px] hover:-translate-y-[3px] hover:rotate-[-0.8deg] hover:shadow-[6px_6px_0_var(--line)]"
                  >
                    <Image
                      src={src}
                      alt={`${project.title} — ${i + 1}`}
                      fill
                      sizes="(max-width: 640px) 100vw, 480px"
                      className="photo-ink object-cover"
                    />
                  </div>
                ))
              : ["detail shot 01", "detail shot 02"].map((label) => (
                  <div
                    key={label}
                    className="r-card crosshatch ink-border flex aspect-[4/3] items-center justify-center bg-(--wash) transition-all duration-[0.25s] ease-out hover:-translate-x-[3px] hover:-translate-y-[3px] hover:rotate-[-0.8deg] hover:shadow-[6px_6px_0_var(--line)]"
                  >
                    <span className="font-tech text-[10px] uppercase tracking-[0.2em] text-(--soft)">
                      {label}
                    </span>
                  </div>
                ))}
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
