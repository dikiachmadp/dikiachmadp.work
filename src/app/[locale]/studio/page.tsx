import React from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getDictionary } from "@/lib/dictionary";
import { createMetadata } from "@/lib/metadata";
import PageWrapper from "@/components/layout/PageWrapper";
import PageHeader from "@/components/layout/PageHeader";
import { Calendar } from "lucide-react";
import { Locale, StudioItem } from "@/types/content";

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
    title: pageHeader.studio.title,
    description: pageHeader.studio.description,
    path: "/studio",
    siteConfig,
    locale: validLocale,
  });
}

export default async function StudioPage({
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

  const { sections, items } = dict.studio;
  const { studio: headerData } = dict.pageHeader;

  const studioItems = items as StudioItem[];

  const experiments = studioItems.filter((item) => item.type === "experiments");
  const storeItems = studioItems.filter((item) => item.type === "store");
  const thoughts = studioItems.filter((item) => item.type === "thoughts");

  const CatalogCard = ({ item }: { item: StudioItem }) => {
    const destinationUrl = item.isExternal
      ? item.link
      : `/${validLocale}/studio/${item.type}/${item.id}`;

    return (
      <Link
        href={destinationUrl}
        target={item.isExternal ? "_blank" : undefined}
        rel={item.isExternal ? "noopener noreferrer" : undefined}
        className="group flex flex-col h-full bg-(--card) rounded-xl border border-(--foreground)/20 overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_var(--foreground)]"
      >
        {item.thumbnail ? (
          <div className="relative aspect-4/3 w-full border-b border-(--foreground)/20 bg-(--background)/50 overflow-hidden">
            <Image
              src={item.thumbnail}
              alt={item.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </div>
        ) : (
          <div className="relative aspect-4/3 w-full border-b border-(--foreground)/20 bg-(--background)/50 flex items-center justify-center">
            <span className="text-(--gray-medium) font-display opacity-50 text-sm">
              No Image
            </span>
          </div>
        )}

        <div className="flex flex-col flex-1 p-5 gap-3 items-center text-center">
          {item.date && (
            <div className="flex items-center justify-center gap-2 text-(--gray-medium) font-bold text-xs uppercase tracking-widest">
              <Calendar className="w-3.5 h-3.5" />
              {item.date}
            </div>
          )}

          <h3 className="text-xl font-display group-hover:text-(--accent) transition-colors line-clamp-2">
            {item.title}
          </h3>

          {item.description && (
            <p className="text-sm text-(--gray-medium) font-medium line-clamp-2 mt-auto">
              {item.description}
            </p>
          )}
        </div>
      </Link>
    );
  };

  return (
    <PageWrapper className="min-h-screen flex flex-col bg-(--background)">
      <PageHeader
        topTitle={headerData.topTitle}
        title={headerData.title}
        description={headerData.description}
      />

      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col gap-16">
        {experiments.length > 0 && (
          <section id="experiments" className="flex flex-col gap-8">
            <div className="flex items-baseline gap-4 border-b-2 border-(--foreground)/10 pb-4">
              <span className="font-display text-3xl text-(--accent)">
                {sections.experiments.number}
              </span>
              <h2 className="text-3xl font-display tracking-wide">
                {sections.experiments.title}
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {experiments.map((item) => (
                <CatalogCard key={item.id} item={item} />
              ))}
            </div>
          </section>
        )}

        {storeItems.length > 0 && (
          <section id="store" className="flex flex-col gap-8">
            <div className="flex items-baseline gap-4 border-b-2 border-(--foreground)/10 pb-4">
              <span className="font-display text-3xl text-(--accent)">
                {sections.store.number}
              </span>
              <h2 className="text-3xl font-display tracking-wide">
                {sections.store.title}
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {storeItems.map((item) => (
                <CatalogCard key={item.id} item={item} />
              ))}
            </div>
          </section>
        )}

        {thoughts.length > 0 && (
          <section id="thoughts" className="flex flex-col gap-8">
            <div className="flex items-baseline gap-4 border-b-2 border-(--foreground)/10 pb-4">
              <span className="font-display text-3xl text-(--accent)">
                {sections.thoughts.number}
              </span>
              <h2 className="text-3xl font-display tracking-wide">
                {sections.thoughts.title}
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {thoughts.map((item) => (
                <CatalogCard key={item.id} item={item} />
              ))}
            </div>
          </section>
        )}
      </div>
    </PageWrapper>
  );
}
