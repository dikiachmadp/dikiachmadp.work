import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { getDictionary } from "@/lib/dictionary";
import { getPublishedPosts } from "@/lib/db/logbook";
import { createMetadata } from "@/lib/metadata";
import PageWrapper from "@/components/layout/PageWrapper";
import PageHeader from "@/components/layout/PageHeader";
import SectionWrapper from "@/components/layout/SectionWrapper";
import Button from "@/components/ui/Button";
import PostCard from "@/components/logbook/PostCard";
import { Locale, StudioData, StudioItem } from "@/types/content";
import { cn } from "@/lib/utils";

/** Jumlah pos terbaru yang dipajang; selebihnya lewat tombol lihat-semua. */
const LATEST_POSTS = 3;

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const validLocale = (locale === "id" ? "id" : "en") as Locale;
  const dict = await getDictionary(validLocale);
  const header = dict.pageHeader.studio;

  return createMetadata({
    title: header.title,
    description: header.description,
    path: "/studio",
    siteConfig: dict.siteConfig,
    locale: validLocale,
  });
}

type SectionKey = keyof StudioData["sections"];
const SECTION_ORDER: SectionKey[] = ["experiments", "store", "thoughts"];

export default async function StudioPage({ params }: PageProps) {
  const { locale } = await params;
  const validLocale = (locale === "id" ? "id" : "en") as Locale;
  // Bagian Logbook datang dari database, bukan dari studio.json. Sebelumnya
  // item `thoughts` ditulis tangan di JSON dan menunjuk ke route yang tidak
  // pernah dibuat — tautan mati yang dijawab catch-all dengan HTTP 200.
  const [dict, { posts }] = await Promise.all([
    getDictionary(validLocale),
    getPublishedPosts(validLocale, { page: 1, perPage: LATEST_POSTS }),
  ]);
  const header = dict.pageHeader.studio;
  const { sections, items } = dict.studio;

  const StudioCard = ({
    item,
    actionLabel,
    index,
  }: {
    item: StudioItem;
    actionLabel: string;
    index: number;
  }) => {
    const href = item.isExternal ? item.link : `/${validLocale}${item.link}`;

    return (
      <Link
        href={href}
        target={item.isExternal ? "_blank" : undefined}
        rel={item.isExternal ? "noopener noreferrer" : undefined}
        className={cn(
          "ink-border flat-3 lift-card-sm flex gap-4 bg-(--paper) p-5",
          index % 2 === 0 ? "r-card" : "r-card-alt",
        )}
      >
        <span className="r-blob crosshatch-tight ink-border font-hand flex h-[76px] w-[76px] shrink-0 items-center justify-center bg-(--wash) text-[26px]">
          {item.badge ?? item.title.slice(0, 2).toUpperCase()}
        </span>
        <span className="block">
          <span className="font-hand mb-1.5 block text-[20px] leading-[1.2]">
            {item.title}
          </span>
          {item.description && (
            <span className="mb-2.5 block text-[13px] leading-[1.6] text-(--soft)">
              {item.description}
            </span>
          )}
          <span className="block text-[11px] font-bold tracking-[0.1em] uppercase">
            {actionLabel} ↗
          </span>
        </span>
      </Link>
    );
  };

  return (
    <PageWrapper>
      <SectionWrapper id="studio" spacing="sm">
        <PageHeader
          topTitle={header.topTitle}
          title={header.title}
          description={header.description}
          className="mb-[34px]"
        />

        {SECTION_ORDER.map((key) => {
          const section = sections[key];
          const isLogbook = key === "thoughts";
          const sectionItems = (items as StudioItem[]).filter(
            (item) => item.type === key,
          );
          // Bagian yang kosong tidak dirender sama sekali — termasuk Logbook
          // sebelum ada pos pertama. Menjanjikan tulisan yang belum ada persis
          // masalah yang sedang diperbaiki di sini.
          if (isLogbook ? posts.length === 0 : sectionItems.length === 0) {
            return null;
          }

          const heading = (
            <div className="mb-4 flex items-center gap-3">
              <span className="font-tech text-[12px] text-(--soft)">
                {section.number}
              </span>
              <h2 className="font-hand text-[28px]">{section.title}</h2>
              <span className="dashed-rule flex-1" />
            </div>
          );

          if (isLogbook) {
            return (
              <div key={key} id={section.id} className="mb-11">
                {heading}
                <div className="grid grid-cols-1 gap-[22px] sm:grid-cols-2 lg:grid-cols-3">
                  {posts.map((post, i) => (
                    <PostCard
                      key={post.id}
                      post={post}
                      locale={validLocale}
                      readLabel={section.buttonLabel}
                      index={i}
                    />
                  ))}
                </div>
                <div className="mt-5">
                  <Button
                    href={`/${validLocale}/logbook`}
                    variant="secondary"
                    size="sm"
                    className="r-chip px-4 py-2 text-[12px]"
                  >
                    {dict.ui.logbook.viewAll} →
                  </Button>
                </div>
              </div>
            );
          }

          return (
            <div key={key} id={section.id} className="mb-11">
              {heading}
              <div className="grid grid-cols-1 gap-[22px] lg:grid-cols-2">
                {sectionItems.map((item, i) => (
                  <StudioCard
                    key={item.id}
                    item={item}
                    actionLabel={item.buttonLabel ?? section.buttonLabel}
                    index={i}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </SectionWrapper>
    </PageWrapper>
  );
}
