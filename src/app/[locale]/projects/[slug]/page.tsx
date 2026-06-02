import React from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, ArrowUpRight } from "lucide-react";
import { getDictionary } from "@/lib/dictionary";
import PageWrapper from "@/components/layout/PageWrapper";
import PageHeader from "@/components/layout/PageHeader";
import SectionWrapper from "@/components/layout/SectionWrapper";
import { cn, themeTransition } from "@/lib/utils";
import { Locale } from "@/types/content";

interface ProjectDetailPageProps {
  params: Promise<{
    locale: string;
    slug: string;
  }>;
}

export default async function ProjectDetailPage({
  params,
}: ProjectDetailPageProps) {
  const resolvedParams = await params;

  const validLocale =
    resolvedParams.locale === "en" || resolvedParams.locale === "id"
      ? (resolvedParams.locale as Locale)
      : "en";

  const dict = await getDictionary(validLocale);

  const project = dict.projects.items.find(
    (item) => item.slug === resolvedParams.slug,
  );

  if (!project) {
    notFound();
  }

  const isLive = project.isLivePreview && project.liveUrl;

  return (
    <PageWrapper>
      <PageHeader
        topTitle={`${project.category} · ${project.year}`}
        title={project.title}
        description={project.description}
      />

      <SectionWrapper
        id="project-detail-content"
        className="pt-4 pb-12 md:pb-20"
      >
        <div className="max-w-3xl mx-auto flex flex-col gap-8">
          <div className="w-full flex justify-center">
            {isLive ? (
              <div className="w-full max-w-240 aspect-9/16 md:aspect-video rounded-xl border-2 border-(--foreground) overflow-hidden relative">
                <div className="absolute z-10 opacity-90" />
                <iframe
                  src={project.liveUrl}
                  title={project.title}
                  className="w-full h-full border-none"
                  loading="lazy"
                />
              </div>
            ) : (
              <div className="w-full max-w-md border-4 border-(--foreground) rounded-(--button-radius) overflow-hidden aspect-square bg-(--card) relative">
                <Image
                  src={project.coverImage}
                  alt={project.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover"
                  priority
                />
              </div>
            )}
          </div>

          <div className="w-full border-2 border-(--foreground) bg-(--card) p-6 md:p-8 rounded-(--button-radius) shadow-[4px_4px_0px_0px_var(--foreground)] flex flex-col gap-2">
            <h4 className="text-xl text-(--foreground) tracking-widest">
              {validLocale === "id" ? "Tentang Proyek" : "About Project"}
            </h4>
            <p className="text-base font-medium leading-relaxed text-(--foreground) text-justify">
              {project.description}. Lorem ipsum dolor sit amet, consectetur
              adipiscing elit. Sed do eiusmod tempor incididunt ut labore et
              dolore magna aliqua. Ut enim ad minim veniam, quis nostrud
              exercitation ullamco laboris nisi ut aliquip ex ea commodo
              consequat.
            </p>
          </div>

          <div className="w-full border-2 border-(--foreground) bg-(--card) p-6 rounded-(--button-radius) flex flex-col sm:flex-row gap-6 justify-between items-start sm:items-center shadow-[4px_4px_0px_0px_var(--foreground)]">
            <div>
              <h4 className="text-[10px] font-black uppercase text-(--gray-medium) tracking-widest">
                Client
              </h4>
              <p className="font-bold text-base mt-0.5 text-(--foreground)">
                {project.client}
              </p>
            </div>

            <div className="sm:border-l-2 sm:border-(--border) sm:pl-6">
              <h4 className="text-[10px] font-black uppercase text-(--gray-medium) tracking-widest">
                Date Published
              </h4>
              <p className="font-bold text-base mt-0.5 text-(--foreground)">
                {project.date}
              </p>
            </div>

            <div className="sm:border-l-2 sm:border-(--border) sm:pl-6 max-w-xs">
              <h4 className="text-[10px] font-black uppercase text-(--gray-medium) tracking-widest mb-1.5">
                Tech Stack
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {project.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 border border-(--foreground) bg-(--background) text-(--foreground)"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="w-full flex flex-col sm:flex-row gap-4 justify-between items-center mt-4">
            <Link
              href={`/${validLocale}/projects`}
              className={cn(
                "w-full sm:w-1/2 flex items-center justify-center gap-2 px-5 py-3.5 border-2 border-(--foreground) bg-(--background) rounded-(--button-radius) font-bold uppercase tracking-widest text-xs transition-all duration-200 hover:-translate-x-0.5 hover:-translate-y-0.5 shadow-[4px_4px_0px_0px_var(--foreground)] hover:shadow-[5px_5px_0px_0px_var(--foreground)] outline-none text-center",
                themeTransition,
              )}
            >
              <ChevronLeft className="w-4 h-4" strokeWidth={3} />
              {validLocale === "id" ? "Kembali" : "Back to Projects"}
            </Link>

            {project.liveUrl ? (
              <a
                href={project.liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "w-full sm:w-1/2 flex items-center justify-center gap-2 px-5 py-3.5 border-2 border-(--foreground) bg-(--background) rounded-(--button-radius) font-bold uppercase tracking-widest text-xs transition-all duration-200 hover:-translate-x-0.5 hover:-translate-y-0.5 shadow-[4px_4px_0px_0px_var(--foreground)] hover:shadow-[5px_5px_0px_0px_var(--foreground)] outline-none cursor-pointer text-center",
                  themeTransition,
                )}
              >
                {validLocale === "id" ? "Kunjungi Situs" : "Visit Live Site"}
                <ArrowUpRight className="w-4 h-4" strokeWidth={3} />
              </a>
            ) : (
              <div className="hidden sm:block sm:w-1/2" />
            )}
          </div>
        </div>
      </SectionWrapper>
    </PageWrapper>
  );
}
