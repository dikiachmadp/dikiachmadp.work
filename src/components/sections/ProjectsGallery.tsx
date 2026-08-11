import { ProjectsData, SectionsData, UiLabels, Locale } from "@/types/content";
import ProjectCard from "@/components/ui/ProjectCard";
import SectionHeading from "@/components/ui/SectionHeading";
import Button from "@/components/ui/Button";

interface ProjectsGalleryProps {
  projectsData: ProjectsData;
  sectionsData: SectionsData;
  uiLabels: UiLabels;
  locale: Locale;
}

/** The three featured cards on the home page. */
export default function ProjectsGallery({
  projectsData,
  sectionsData,
  uiLabels,
  locale,
}: ProjectsGalleryProps) {
  const featured = projectsData.items.filter((p) => p.featured);
  const section = sectionsData.featuredProjects;

  if (featured.length === 0) return null;

  return (
    <>
      <SectionHeading
        eyebrow={section.eyebrow}
        title={section.title}
        action={
          section.showButton ? (
            <Button
              href={`/${locale}/projects`}
              variant="secondary"
              size="sm"
              mirrored
            >
              {uiLabels.buttons.viewAllWork} →
            </Button>
          ) : null
        }
      />
      <div className="grid grid-cols-1 gap-[26px] sm:grid-cols-2 lg:grid-cols-3">
        {featured.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            locale={locale}
            showLogo
          />
        ))}
      </div>
    </>
  );
}
