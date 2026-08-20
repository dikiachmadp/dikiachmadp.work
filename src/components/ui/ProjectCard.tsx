import Image from "next/image";
import Link from "next/link";
import { Project, Locale } from "@/types/content";
import Tag from "@/components/ui/Tag";
import { cn, fill } from "@/lib/utils";
import { uiDictionary } from "@/lib/ui-dictionary";
import { categoryLabel } from "@/lib/categories";

interface ProjectCardProps {
  project: Project;
  locale: Locale;
  /** Featured cards also carry the client's logo blob. */
  showLogo?: boolean;
  className?: string;
}

export default function ProjectCard({
  project,
  locale,
  showLogo,
  className,
}: ProjectCardProps) {
  const hasCover = Boolean(project.coverImage);
  const category = categoryLabel(locale, project.categoryKey);
  const meta = `${category} · ${project.year}`;

  return (
    <Link
      href={`/${locale}/projects/${project.slug}`}
      className={cn(
        "r-card ink-border flat-3 lift-card flex flex-col overflow-hidden bg-(--paper)",
        className,
      )}
    >
      <div
        className={cn(
          "relative flex aspect-[16/10] items-center justify-center overflow-hidden border-b-2 border-(--line) bg-(--wash)",
          !hasCover && "crosshatch",
        )}
      >
        {hasCover ? (
          <Image
            src={project.coverImage}
            alt={project.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1180px) 50vw, 376px"
            className="object-cover"
          />
        ) : (
          <span className="font-tech text-[10px] tracking-[0.2em] text-(--soft) uppercase">
            {fill(uiDictionary(locale).a11y.projectShot, {
              category: category.toLowerCase(),
            })}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col px-[18px] pt-4 pb-[18px]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="micro">{meta}</div>
            <h3 className="font-hand mt-1 text-[23px] leading-[1.1]">
              {project.title}
            </h3>
          </div>
          {showLogo && (
            <span
              className="ink-border flex h-[38px] w-[38px] shrink-0 items-center justify-center overflow-hidden bg-(--wash)"
              style={{
                borderRadius: "52% 48% 51% 49% / 49% 52% 48% 51%",
              }}
            >
              {project.logoUrl ? (
                <Image
                  src={project.logoUrl}
                  alt=""
                  width={26}
                  height={26}
                  className="h-[26px] w-[26px] object-contain"
                />
              ) : (
                <span className="font-hand text-[15px]">
                  {project.title.charAt(0)}
                </span>
              )}
            </span>
          )}
        </div>

        {project.description && (
          <p className="m-justify mt-2 line-clamp-3 text-[13px] leading-[1.6] text-(--soft)">
            {project.description}
          </p>
        )}

        <div className="mt-auto flex flex-wrap gap-[7px] pt-3.5">
          {project.tags.map((tag) => (
            <Tag key={tag}>{tag}</Tag>
          ))}
        </div>
      </div>
    </Link>
  );
}
