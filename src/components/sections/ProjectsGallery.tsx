"use client";

import { useState, useMemo } from "react";
import { ProjectsData, SectionsData, UiLabels, Locale } from "@/types/content";
import ProjectCard from "@/components/ui/ProjectCard";
import Button from "@/components/ui/Button";
import { cn, themeTransition } from "@/lib/utils";
import { Search, ChevronDown } from "lucide-react";

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
  const [searchQuery, setSearchQuery] = useState("");

  const section = sectionsData?.featuredProjects;
  const buttonLabel =
    section?.buttonLabel && uiLabels
      ? uiLabels.buttons[
          section.buttonLabel as keyof typeof uiLabels.buttons
        ] || section.buttonLabel
      : "";

  const filteredItems = useMemo(() => {
    const baseItems = featuredOnly
      ? projectsData.items.filter((p) => p.featured)
      : projectsData.items;

    if (featuredOnly) return baseItems;

    return baseItems.filter((project) => {
      const matchesCategory =
        activeCategory === "All" || project.category === activeCategory;
      const matchesSearch =
        project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.tags.some((tag) =>
          tag.toLowerCase().includes(searchQuery.toLowerCase()),
        );
      return matchesCategory && matchesSearch;
    });
  }, [featuredOnly, projectsData.items, activeCategory, searchQuery]);

  return (
    <div className="flex flex-col gap-12 -mt-4 md:-mt-12">
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

      {!featuredOnly && uiLabels && (
        <div className="flex flex-col md:row-end-2 gap-8 justify-between md:justify-start items-center md:items-start border-b-2 border-(--border) pb-12">
          <div className="w-full md:w-auto order-2 md:order-1">
            <div className="block md:hidden relative group">
              <div className="absolute inset-0 bg-(--foreground) rounded-lg transition-all duration-200" />
              <div
                className={cn(
                  "relative flex items-center bg-(--background) border-2 border-(--foreground) rounded-lg px-4",
                  themeTransition,
                )}
              >
                <select
                  value={activeCategory}
                  onChange={(e) => setActiveCategory(e.target.value)}
                  className="w-full bg-transparent py-3 outline-none text-[10px] font-bold uppercase tracking-widest text-(--foreground) appearance-none cursor-pointer"
                >
                  <option value="All">{uiLabels.states.allCategories}</option>
                  {projectsData.categories
                    .filter((c) => c !== "All")
                    .map((category) => (
                      <option
                        key={category}
                        value={category}
                        className="bg-(--background)"
                      >
                        {category}
                      </option>
                    ))}
                </select>
                <ChevronDown
                  className="absolute right-4 w-4 h-4 text-(--foreground) pointer-events-none"
                  strokeWidth={3}
                />
              </div>
            </div>

            <div className="hidden md:flex flex-wrap gap-4 items-center justify-center md:justify-start">
              {[
                "All",
                ...projectsData.categories.filter((c) => c !== "All"),
              ].map((category) => {
                const isActive = activeCategory === category;
                return (
                  <button
                    key={category}
                    onClick={() => setActiveCategory(category)}
                    className="w-full md:w-auto group relative outline-none"
                  >
                    <div
                      className={cn(
                        "absolute inset-0 rounded-lg bg-(--foreground) transition-all duration-200",
                        isActive
                          ? "opacity-100"
                          : "opacity-0 group-hover:opacity-100",
                      )}
                    />
                    <div
                      className={cn(
                        "relative flex h-10 px-6 items-center justify-center rounded-lg uppercase transition-all duration-200 text-[10px] font-bold tracking-widest border-2",
                        themeTransition,
                        isActive
                          ? "bg-(--background) text-(--foreground) border-(--foreground) -translate-x-1 -translate-y-1"
                          : "bg-(--background) text-(--foreground) border-(--foreground) group-hover:-translate-x-1 group-hover:-translate-y-1",
                      )}
                    >
                      {category === "All"
                        ? uiLabels.states.allCategories
                        : category}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="relative w-full md:w-96 group order-1 md:order-2">
            <div className="absolute inset-0 bg-(--foreground) rounded-lg transition-all duration-200" />
            <div
              className={cn(
                "relative flex items-center bg-(--background) border-2 border-(--foreground) rounded-lg transition-all duration-200 px-4",
                "group-focus-within:-translate-x-1 group-focus-within:-translate-y-1",
              )}
            >
              <Search className="w-4 h-4 text-(--foreground)" strokeWidth={3} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={uiLabels.states.searchPlaceholder}
                className="w-full bg-transparent py-3 pl-3 outline-none text-[10px] font-bold uppercase tracking-widest text-(--foreground) placeholder:text-(--gray-medium)"
              />
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredItems.length > 0 ? (
          filteredItems.map((project, index) => (
            <ProjectCard key={project.id} project={project} index={index} />
          ))
        ) : (
          <div className="col-span-full py-20 text-center border-2 border-dashed border-(--border) rounded-lg">
            <p className="font-display uppercase text-2xl tracking-tighter italic text-(--gray-medium)">
              {uiLabels?.states.empty}
            </p>
          </div>
        )}
      </div>

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
