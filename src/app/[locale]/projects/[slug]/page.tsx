import React from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { getDictionary } from "@/lib/dictionary";
import {
  getAdjacentProjects,
  getAllProjectSlugs,
  getProjectBySlug,
} from "@/lib/db/projects";
import { createMetadata } from "@/lib/metadata";
import PageWrapper from "@/components/layout/PageWrapper";
import Button from "@/components/ui/Button";
import Tag from "@/components/ui/Tag";
import Gallery from "@/components/ui/Gallery";
import ReadingRail from "@/components/ui/ReadingRail";
import ShareButton from "@/components/logbook/ShareButton";
import JsonLd from "@/components/seo/JsonLd";
import { breadcrumbSchema, projectSchema } from "@/lib/structured-data";
import { categoryLabel } from "@/lib/categories";
import { Locale } from "@/types/content";

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

  /**
   * Halaman ini menjawab 200 walau project-nya tidak ada — status tidak bisa
   * diubah setelah respons mulai di-stream; lihat catatan panjang di
   * `[locale]/[...not-found]/page.tsx`. Yang menjaga URL semacam ini keluar
   * dari indeks adalah `noindex`, bukan angka statusnya, dan tanpa baris ini
   * setiap slug yang salah ketik boleh terindeks sebagai halaman sungguhan.
   */
  if (!project) {
    return {
      title: dict.ui.projectDetail.notFoundTitle,
      robots: { index: false, follow: false },
    };
  }

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

  const adjacent = await getAdjacentProjects(validLocale, slug);

  const t = dict.ui.projectDetail;
  const category = categoryLabel(validLocale, project.categoryKey);
  // Sama seperti Logbook (di sana `cover` cuma alias untuk `images[0]`, lihat
  // `lib/db/logbook.ts`): tidak ada kotak cover terpisah di sini. `coverImage`
  // digabung jadi elemen pertama, lalu satu `<Gallery>` yang merender semuanya
  // — gambar pertama besar, sisanya jadi strip thumbnail. `Set` membuang
  // duplikat kalau admin sempat menaruh URL yang sama di cover & di galeri;
  // `filter(Boolean)` menjaga kasus `coverImage` kosong (data lama) supaya
  // tidak masuk sebagai item kosong.
  const galleryImages = Array.from(
    new Set([project.coverImage, ...(project.gallery ?? [])].filter(Boolean)),
  ).map((src, i) => ({
    id: src,
    url: src,
    alt: `${project.title} — ${i + 1}`,
  }));
  // Deskripsi sudah tampil sebagai pull-quote di bawah judul; tanpa
  // contentBlocks, seksi "About the project" tidak dirender sama sekali
  // supaya deskripsinya tidak tercetak dua kali.
  const blocks = project.contentBlocks ?? [];

  const facts = [
    { label: t.client, value: project.client },
    { label: t.datePublished, value: project.year },
    { label: t.role, value: project.role },
    { label: t.duration, value: project.duration },
  ].filter((fact): fact is { label: string; value: string } =>
    Boolean(fact.value),
  );

  const tools = project.tools ?? [];

  // Label "Karya"/"All work" sudah ada di navigasi — jangan tulis ulang di
  // sini. Fallback-nya judul halaman projects, bukan literal Inggris: dua-duanya
  // ikut bahasa, jadi tidak ada jalur yang bisa mengembalikan teks Inggris ke
  // halaman berbahasa Indonesia.
  const projectsLabel =
    dict.navigation.main.find((item) => item.path === "/projects")?.label ??
    dict.pageHeader.projects.title;

  const factsAside = (
    <aside className="r-panel ink-border flat-6 flex flex-col gap-4 bg-(--paper) p-6 max-sm:items-center max-sm:text-center">
      {facts.length > 0 && (
        <div className="flex flex-col gap-3.5 max-sm:items-center">
          {facts.map((fact) => (
            <div key={fact.label}>
              <div className="micro">{fact.label}</div>
              <div className="font-hand mt-0.5 text-[18px] leading-[1.2]">
                {fact.value}
              </div>
            </div>
          ))}
        </div>
      )}

      {facts.length > 0 && (tools.length > 0 || project.tags.length > 0) && (
        <div className="h-0.5 bg-(--line) opacity-25" />
      )}

      {tools.length > 0 && (
        <div>
          <div className="micro mb-2">{t.tools}</div>
          <div className="flex flex-wrap gap-2 max-sm:justify-center">
            {tools.map((tool) => (
              <Tag key={tool} className="px-3 py-[5px]">
                {tool}
              </Tag>
            ))}
          </div>
        </div>
      )}

      {project.tags.length > 0 && (
        <div>
          <div className="micro mb-2">{t.techStack}</div>
          <div className="flex flex-wrap gap-2 max-sm:justify-center">
            {project.tags.map((tag) => (
              <Tag key={tag} className="px-3 py-[5px]">
                {tag}
              </Tag>
            ))}
          </div>
        </div>
      )}

      {project.liveUrl && (
        <>
          <div className="h-0.5 bg-(--line) opacity-25" />
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
        </>
      )}
    </aside>
  );

  return (
    <PageWrapper>
      <JsonLd
        data={projectSchema(project, dict.siteConfig, validLocale, category)}
      />
      <JsonLd
        data={breadcrumbSchema(
          [
            { name: dict.siteConfig.siteName, path: `/${validLocale}` },
            { name: projectsLabel, path: `/${validLocale}/projects` },
            {
              name: project.title,
              path: `/${validLocale}/projects/${project.slug}`,
            },
          ],
          dict.siteConfig,
        )}
      />

      <ReadingRail label={category.toLowerCase()}>
        <article className="mx-auto w-full max-w-[980px] px-[22px] pt-11">
          <Button
            href={`/${validLocale}/projects`}
            variant="secondary"
            size="sm"
            className="r-chip mb-[26px] px-4 py-2 text-[12px] max-sm:mx-auto max-sm:flex max-sm:w-fit"
          >
            ← {t.backBtn}
          </Button>

          <div className="mb-9 flex flex-col gap-5 sm:flex-row-reverse sm:items-start">
            {project.logoUrl && (
              <span className="r-blob ink-border flat-3 mx-auto flex h-[130px] w-[130px] shrink-0 items-center justify-center overflow-hidden bg-(--paper) sm:mx-0">
                <Image
                  src={project.logoUrl}
                  alt=""
                  width={86}
                  height={86}
                  className="h-[86px] w-[86px] object-contain"
                />
              </span>
            )}

            <div className="min-w-0 flex-1">
              <div className="mb-4.5 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 sm:justify-start">
                <span className="r-tag bg-(--accent) px-3 py-1.5 text-[10px] font-bold tracking-[0.18em] text-white uppercase">
                  {category}
                </span>
                <span className="font-tech block text-[11px] tracking-[0.16em] text-(--soft) uppercase">
                  {project.year}
                </span>
              </div>

              <h1 className="font-hand m-center mt-1.5 mb-4 text-[clamp(2.4rem,5.6vw,4.2rem)] leading-none">
                <span
                  style={{
                    backgroundImage:
                      "linear-gradient(transparent 62%, color-mix(in srgb, var(--accent-ink) 26%, transparent) 62%, color-mix(in srgb, var(--accent-ink) 26%, transparent) 94%, transparent 94%)",
                  }}
                >
                  {project.title}
                </span>
              </h1>

              <p className="justify-body max-w-[640px] border-l-[3px] border-(--accent-ink) pl-5 text-[17px] leading-[1.7] text-(--ink)">
                {project.description}
              </p>
            </div>
          </div>

          {galleryImages.length > 0 && (
            <div className="mb-11">
              <Gallery
                images={galleryImages}
                title={project.title}
                ui={dict.ui}
                dateLabel={project.year}
                moreLabel={t.moreShots}
              />
            </div>
          )}

          {blocks.length > 0 ? (
            <div className="grid grid-cols-1 items-start gap-9 lg:grid-cols-[1fr_260px]">
              <div className="flex flex-col gap-[18px]">
                <h2 className="font-hand text-[28px]">{t.aboutProject}</h2>
                {blocks.map((paragraph, i) => (
                  <p
                    key={i}
                    className="justify-body m-0 text-[16px] leading-[1.75] text-(--ink)"
                  >
                    {paragraph}
                  </p>
                ))}
              </div>

              {factsAside}
            </div>
          ) : (
            <div className="mx-auto w-full max-w-[360px]">{factsAside}</div>
          )}

          <div className="dashed-rule mt-11 mb-9" />

          <div className="flex items-center gap-3">
            <span
              aria-hidden
              className="h-2.5 w-2.5 rotate-45 bg-(--accent-ink)"
            />
            <span className="font-note text-[20px] text-(--soft)">
              {t.endOfProject}
            </span>
            <span className="dashed-rule flex-1" />
          </div>

          <div className="mt-[30px] flex flex-wrap items-center gap-3 border-t-2 border-dashed border-(--line) pt-7 max-sm:justify-center">
            <ShareButton
              title={project.title}
              label={t.share}
              copiedLabel={t.shareCopied}
            />
            <Button
              href={`/${validLocale}/projects`}
              variant="secondary"
              size="sm"
            >
              {projectsLabel} →
            </Button>
          </div>

          {(adjacent.prev || adjacent.next) && (
            <nav
              aria-label={`${t.prevProject} / ${t.nextProject}`}
              className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2"
            >
              {adjacent.prev ? (
                <Link
                  href={`/${validLocale}/projects/${adjacent.prev.slug}`}
                  className="ink-border flat-3 lift-card-sm r-card block bg-(--paper) p-4 max-sm:text-center"
                >
                  <span className="block text-[11px] font-bold tracking-[0.1em] text-(--soft) uppercase">
                    ← {t.prevProject}
                  </span>
                  <span className="font-hand mt-1 block text-[17px] leading-[1.2]">
                    {adjacent.prev.title}
                  </span>
                </Link>
              ) : (
                <span />
              )}
              {adjacent.next ? (
                <Link
                  href={`/${validLocale}/projects/${adjacent.next.slug}`}
                  className="ink-border flat-3 lift-card-sm r-card-alt block bg-(--paper) p-4 max-sm:text-center sm:text-right"
                >
                  <span className="block text-[11px] font-bold tracking-[0.1em] text-(--soft) uppercase">
                    {t.nextProject} →
                  </span>
                  <span className="font-hand mt-1 block text-[17px] leading-[1.2]">
                    {adjacent.next.title}
                  </span>
                </Link>
              ) : (
                <span />
              )}
            </nav>
          )}
        </article>
      </ReadingRail>
    </PageWrapper>
  );
}
