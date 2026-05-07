"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ProjectsData, SectionsData, UiLabels, Locale } from "@/types/content";
import ProjectCard from "@/components/ui/ProjectCard";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

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
  const [activeCategory, setActiveCategory] = useState("All");

  const section = sectionsData?.featuredProjects;
  const buttonLabel = section?.buttonLabel && uiLabels
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
    <div>
      {/* Section Header (only when sectionsData is provided) */}
      {section && (
        <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-10 pb-8 border-b-2 border-(--border)">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-(--gray-medium) mb-2">Portfolio</p>
            <h2 className="text-3xl md:text-5xl font-black uppercase leading-[0.9] tracking-tighter">
              {section.title}
            </h2>
          </div>
          <div className="flex flex-col gap-3 md:items-end">
            <p className="max-w-xs text-sm font-medium text-(--gray-medium) md:text-right">
              {section.description}
            </p>
            {section.showButton && buttonLabel && (
              <Link
                href={`/${locale}/projects`}
                className="group inline-flex items-center gap-2 text-sm font-black uppercase tracking-widest text-(--accent) hover:underline underline-offset-4"
              >
                {buttonLabel}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Category Filter (only when not featuredOnly) */}
      {!featuredOnly && (
        <div className="flex flex-wrap gap-2 mb-8">
          {projectsData.categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "px-4 py-2 text-xs font-black uppercase tracking-widest border-2 transition-all duration-150",
                activeCategory === cat
                  ? "bg-(--accent) text-white border-(--accent)"
                  : "bg-transparent text-(--foreground) border-(--border) hover:border-(--accent) hover:text-(--accent)"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Grid */}
      <motion.div
        layout
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
      >
        <AnimatePresence mode="popLayout">
          {filteredItems.map((project, index) => (
            <motion.div
              key={project.id}
              layout
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.3 }}
            >
              <ProjectCard project={project} index={index} />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {filteredItems.length === 0 && (
        <div className="py-20 text-center">
          <p className="text-sm font-bold uppercase tracking-widest text-(--gray-medium)">
            No projects found.
          </p>
        </div>
      )}
    </div>
  );
}
