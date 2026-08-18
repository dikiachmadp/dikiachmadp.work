import type { AboutProfileData } from "@/lib/db/about";
import Tag from "@/components/ui/Tag";
import { cn } from "@/lib/utils";

interface ExperienceSectionProps {
  aboutData: AboutProfileData;
}

/**
 * Experience rows, the certifications list (only rendered when there is at
 * least one), and the two skill cards in the About page's right column.
 */
export default function ExperienceSection({
  aboutData,
}: ExperienceSectionProps) {
  return (
    <>
      <h2 className="font-hand mt-[30px] mb-3.5 text-[26px]">
        {aboutData.experienceTitle}
      </h2>
      <div className="flex flex-col gap-3">
        {aboutData.experience.map((entry) => (
          <div
            key={entry.id}
            className="ink-border grid grid-cols-1 items-center gap-4 bg-(--paper) px-[18px] py-3.5 transition-all duration-[0.22s] ease-out hover:-translate-x-[3px] hover:-translate-y-[3px] hover:shadow-[5px_5px_0_var(--line)] sm:grid-cols-[170px_1fr]"
            style={{ borderRadius: "20px 8px 22px 9px / 9px 22px 8px 20px" }}
          >
            <span className="font-tech text-[11px] tracking-[0.1em] text-(--soft)">
              {entry.year}
            </span>
            <span>
              <strong className="font-hand text-[19px]">{entry.title}</strong>
              <span className="text-[14px] text-(--soft)">
                {" "}
                — {entry.subtitle}
              </span>
            </span>
          </div>
        ))}
      </div>

      {/* Sertifikasi belum tentu ada — kemungkinan besar kosong sampai
          ditambah lewat admin, jadi blok ini tidak dirender sama sekali
          selagi kosong, bukan menjanjikan judul tanpa isi. */}
      {aboutData.certifications.length > 0 && (
        <>
          <h2 className="font-hand mt-[30px] mb-3.5 text-[26px]">
            {aboutData.certificationsTitle}
          </h2>
          <div className="flex flex-col gap-3">
            {aboutData.certifications.map((entry) => {
              const body = (
                <>
                  <span className="font-tech text-[11px] tracking-[0.1em] text-(--soft)">
                    {entry.year}
                  </span>
                  <span>
                    <strong className="font-hand text-[19px]">
                      {entry.title}
                    </strong>
                    <span className="text-[14px] text-(--soft)">
                      {" "}
                      — {entry.subtitle}
                    </span>
                  </span>
                </>
              );
              const rowClass =
                "ink-border grid grid-cols-1 items-center gap-4 bg-(--paper) px-[18px] py-3.5 transition-all duration-[0.22s] ease-out hover:-translate-x-[3px] hover:-translate-y-[3px] hover:shadow-[5px_5px_0_var(--line)] sm:grid-cols-[170px_1fr]";
              const rowStyle = {
                borderRadius: "20px 8px 22px 9px / 9px 22px 8px 20px",
              };

              return entry.url ? (
                <a
                  key={entry.id}
                  href={entry.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={rowClass}
                  style={rowStyle}
                >
                  {body}
                </a>
              ) : (
                <div key={entry.id} className={rowClass} style={rowStyle}>
                  {body}
                </div>
              );
            })}
          </div>
        </>
      )}

      <h2 className="font-hand mt-[30px] mb-3.5 text-[26px]">
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
            <div className="mb-2.5 text-[10px] font-bold tracking-[0.18em] text-(--soft) uppercase">
              {group.category}
            </div>
            <div className="flex flex-wrap gap-[7px]">
              {group.items.map((item) => (
                <Tag
                  key={item}
                  className="bg-(--paper) text-[12px] font-semibold tracking-normal text-(--ink) normal-case"
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
