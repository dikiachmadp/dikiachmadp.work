import React from "react";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ChevronLeft, ArrowUpRight } from "lucide-react";
import { Metadata } from "next";
import { getDictionary } from "@/lib/dictionary";
import { createMetadata } from "@/lib/metadata";
import PageWrapper from "@/components/layout/PageWrapper";
import PageHeader from "@/components/layout/PageHeader";
import SectionWrapper from "@/components/layout/SectionWrapper";
import Button from "@/components/ui/Button";
import { Locale } from "@/types/content";

interface ProjectDetailPageProps {
  params: Promise<{
    locale: string;
    slug: string;
  }>;
}

export async function generateMetadata({
  params,
}: ProjectDetailPageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const validLocale = (locale === "id" ? "id" : "en") as Locale;
  const dict = await getDictionary(validLocale);
  const project = dict.projects.items.find((item) => item.slug === slug);

  if (!project) {
    return { title: "Project Not Found" };
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
  const resolvedParams = await params;

  const validLocale =
    resolvedParams.locale === "en" || resolvedParams.locale === "id"
      ? (resolvedParams.locale as Locale)
      : "en";

  const dict = await getDictionary(validLocale);
  const project = dict.projects.items.find(
    (item) => item.slug === resolvedParams.slug,
  );

  if (!project) notFound();

  const t = dict.ui.projectDetail;

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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 flex flex-col gap-8">
            <div className="group relative bg-(--foreground) rounded-(--button-radius) w-full">
              <div className="relative w-full aspect-video bg-(--card) border-2 border-(--foreground) rounded-(--button-radius) overflow-hidden transition-all duration-300 ease-out translate-x-0 translate-y-0 group-hover:-translate-x-1.5 group-hover:-translate-y-1.5 flex justify-center cursor-default">
                <Image
                  src={project.coverImage}
                  alt={project.title}
                  fill
                  sizes="(max-width: 1024px) 100vw, 66vw"
                  className="object-cover"
                  priority
                />
              </div>
            </div>

            {project.gallery && project.gallery.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {project.gallery.slice(0, 2).map((imgUrl, idx) => (
                  <div
                    key={idx}
                    className="group relative bg-(--foreground) rounded-(--button-radius) w-full"
                  >
                    <div className="relative w-full aspect-video bg-(--card) border-2 border-(--foreground) rounded-(--button-radius) overflow-hidden transition-all duration-300 ease-out translate-x-0 translate-y-0 group-hover:-translate-x-1.5 group-hover:-translate-y-1.5 cursor-default">
                      <Image
                        src={imgUrl}
                        alt={`${project.title} ${t.galleryLabel} ${idx + 1}`}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="group relative bg-(--foreground) rounded-(--button-radius) w-full">
              <div className="relative h-full p-6 md:p-10 bg-(--background) border-2 border-(--foreground) rounded-(--button-radius) transition-all duration-300 ease-out translate-x-0 translate-y-0 group-hover:-translate-x-1.5 group-hover:-translate-y-1.5 cursor-default flex flex-col gap-4">
                <h3
                  className="text-2xl tracking-wide text-(--foreground) mb-2"
                  style={{
                    fontFamily:
                      "var(--font-heading), var(--font-heading), cursive",
                  }}
                >
                  {t.aboutProject}
                </h3>

                <div className="prose prose-lg dark:prose-invert max-w-none text-(--foreground) text-justify space-y-4">
                  {project.contentBlocks && project.contentBlocks.length > 0 ? (
                    project.contentBlocks.map((paragraph, index) => (
                      <p key={index} className="leading-relaxed font-medium">
                        {paragraph}
                      </p>
                    ))
                  ) : (
                    <p className="leading-relaxed font-medium">
                      {project.description}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 lg:sticky lg:top-24 flex flex-col gap-8">
            <div className="group relative bg-(--foreground) rounded-(--button-radius) w-full">
              <div className="relative h-full p-6 bg-(--background) border-2 border-(--foreground) rounded-(--button-radius) transition-all duration-300 ease-out translate-x-0 translate-y-0 group-hover:-translate-x-1.5 group-hover:-translate-y-1.5 cursor-default flex flex-col gap-5">
                <div className="flex flex-col pb-4 border-b-2 border-(--border)">
                  <h4
                    className="tracking-wide text-(--foreground)"
                    style={{ fontSize: "var(--text-desc)" }}
                  >
                    {t.client}
                  </h4>
                  <p className="var(--text-desc) text-(--foreground)">
                    {project.client}
                  </p>
                </div>

                {project.role && (
                  <div className="flex flex-col pb-4 border-b-2 border-(--border)">
                    <h4
                      className="tracking-wide text-(--foreground)"
                      style={{ fontSize: "var(--text-desc)" }}
                    >
                      {t.role}
                    </h4>
                    <p className="var(--text-desc) text-(--foreground)">
                      {project.role}
                    </p>
                  </div>
                )}

                {project.duration && (
                  <div className="flex flex-col pb-4 border-b-2 border-(--border)">
                    <h4
                      className="tracking-wide text-(--foreground)"
                      style={{ fontSize: "var(--text-desc)" }}
                    >
                      {t.duration}
                    </h4>
                    <p className="var(--text-desc) text-(--foreground)">
                      {project.duration}
                    </p>
                  </div>
                )}

                {project.tools && project.tools.length > 0 && (
                  <div className="flex flex-col pb-4 border-b-2 border-(--border)">
                    <h4
                      className="tracking-wide text-(--foreground)"
                      style={{ fontSize: "var(--text-desc)" }}
                    >
                      {t.tools}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {project.tools.map((tool) => (
                        <span
                          key={tool}
                          className="tracking-wide px-2 py-1 border border-(--border) text-(--foreground)"
                          style={{
                            fontSize: "calc(var(--text-ui-label) * 0.9)",
                          }}
                        >
                          {tool}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex flex-col">
                  <h4
                    className="tracking-wide text-(--foreground)"
                    style={{ fontSize: "var(--text-desc)" }}
                  >
                    {t.techStack}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {project.tags.map((tag) => (
                      <span
                        key={tag}
                        className="tracking-wide px-2 py-1 border border-(--foreground) bg-(--foreground) text-(--background) rounded-sm"
                        style={{ fontSize: "calc(var(--text-ui-label) * 0.9)" }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              {project.liveUrl && (
                <Button
                  variant="primary"
                  size="md"
                  href={project.liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full"
                >
                  <span className="flex items-center gap-2">
                    {t.visitBtn}
                    <ArrowUpRight className="w-4 h-4" strokeWidth={3} />
                  </span>
                </Button>
              )}

              <Button
                variant="primary"
                size="md"
                href={`/${validLocale}/projects`}
                className="w-full"
              >
                <span className="flex items-center justify-center gap-2 w-full">
                  <ChevronLeft className="w-4 h-4" strokeWidth={3} />
                  {t.backBtn}
                </span>
              </Button>
            </div>
          </div>
        </div>
      </SectionWrapper>
    </PageWrapper>
  );
}
