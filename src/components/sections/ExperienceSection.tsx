import { AboutData } from "@/types/content";
import Tag from "@/components/ui/Tag";
import { cn } from "@/lib/utils";

interface ExperienceSectionProps {
  aboutData: AboutData;
}

/** Experience rows and the two skill cards in the About page's right column. */
export default function ExperienceSection({
  aboutData,
}: ExperienceSectionProps) {
  return (
    <>
      <h2 className="font-hand mb-3.5 mt-[30px] text-[26px]">
        {aboutData.experienceTitle}
      </h2>
      <div className="flex flex-col gap-3">
        {aboutData.experience.map((entry) => (
          <div
            key={`${entry.year}-${entry.role}`}
            className="ink-border grid grid-cols-1 items-center gap-4 bg-(--paper) px-[18px] py-3.5 transition-all duration-[0.22s] ease-out hover:-translate-x-[3px] hover:-translate-y-[3px] hover:shadow-[5px_5px_0_var(--line)] sm:grid-cols-[170px_1fr]"
            style={{ borderRadius: "20px 8px 22px 9px / 9px 22px 8px 20px" }}
          >
            <span className="font-tech text-[11px] tracking-[0.1em] text-(--soft)">
              {entry.year}
            </span>
            <span>
              <strong className="font-hand text-[19px]">{entry.role}</strong>
              <span className="text-[14px] text-(--soft)"> — {entry.place}</span>
            </span>
          </div>
        ))}
      </div>

      <h2 className="font-hand mb-3.5 mt-[30px] text-[26px]">
        {aboutData.skillsTitle}
      </h2>
      <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2">
        {aboutData.skills.map((group, i) => (
          <div
            key={group.category}
            className={cn(
              "ink-border flat-3 bg-(--wash) p-[18px]",
              i % 2 === 0 ? "r-card-alt" : "r-card",
            )}
          >
            <div className="mb-2.5 text-[10px] font-bold uppercase tracking-[0.18em] text-(--soft)">
              {group.category}
            </div>
            <div className="flex flex-wrap gap-[7px]">
              {group.items.map((item) => (
                <Tag
                  key={item}
                  className="bg-(--paper) text-[12px] font-semibold normal-case tracking-normal text-(--ink)"
                >
                  {item}
                </Tag>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
