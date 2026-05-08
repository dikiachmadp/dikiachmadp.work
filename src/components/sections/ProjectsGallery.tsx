"use client";

import { useState } from "react";
import { ProjectsData, SectionsData, UiLabels, Locale } from "@/types/content";
import ProjectCard from "@/components/ui/ProjectCard";
import Button from "@/components/ui/Button";

interface ProjectsGalleryProps {
  projectsData: ProjectsData;
  sectionsData?: SectionsData;
  uiLabels?: UiLabels;
  locale: Locale;
  featuredOnly?: boolean;
}

export default function ProjectsGallery({
  projectsData,
  sectionsData,
  uiLabels,
  locale,
  featuredOnly = false,
}: ProjectsGalleryProps) {
  const [activeCategory] = useState("All");

  const section = sectionsData?.featuredProjects;
  const buttonLabel =
    section?.buttonLabel && uiLabels
      ? uiLabels.buttons[section.buttonLabel] || section.buttonLabel
      : "";

  const displayItems = featuredOnly
    ? projectsData.items.filter((p) => p.featured)
    : projectsData.items;

  const filteredItems =
    activeCategory === "All"
      ? displayItems
      : displayItems.filter((p) => p.category === activeCategory);

  return (
    <div className="flex flex-col gap-12">
      {/* 1. Section Header dengan Fluid Typography */}
      {section && (
        <div className="flex flex-col text-center md:text-start max-w-3xl">
          <h2
            className="tracking-wide leading-[0.9]"
            style={{
              fontSize: "var(--text-section-title)",
              fontFamily: "var(--font-display)",
            }}
          >
            {section.title}
          </h2>
          <p
            className="text-(--gray-medium) font-medium leading-relaxed"
            style={{ fontSize: "var(--text-desc)" }}
          >
            {section.description}
          </p>
        </div>
      )}

      {/* 2. Grid Projects */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredItems.map((project, index) => (
          <ProjectCard key={project.id} project={project} index={index} />
        ))}
      </div>

      {/* 3. Button (Sekarang Berada di Bawah Section) */}
      {featuredOnly && (
        <div className="flex justify-center">
          <Button
            href={`/${locale}/projects`}
            variant="primary"
            className="min-w-52"
          >
            {buttonLabel}
          </Button>
        </div>
      )}
    </div>
  );
}
