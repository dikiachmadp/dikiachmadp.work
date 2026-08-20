import type { AboutProfileData } from "@/lib/db/about";
import { cn } from "@/lib/utils";

interface ExperienceSectionProps {
  aboutData: AboutProfileData;
}

/**
 * Experience rows and the certifications list (only rendered when there is
 * at least one) in the About page's right column. Skills live in the left
 * sidebar instead — see about/page.tsx.
 */
export default function ExperienceSection({
  aboutData,
}: ExperienceSectionProps) {
  return (
    <>
      <h2 className="font-hand mb-3.5 text-[26px]">
        {aboutData.experienceTitle}
      </h2>
      <div className="flex flex-col gap-3">
        {aboutData.experience.map((entry, i) => (
          <div
            key={entry.id}
            className={cn(
              "ink-border flat-3 lift-card-sm grid grid-cols-1 items-center gap-4 bg-(--paper) px-[18px] py-3.5 sm:grid-cols-[170px_1fr]",
              i % 2 === 0 ? "r-card-alt" : "r-card",
              i % 2 === 1 && "lift-card-sm-cw",
            )}
          >
            <span className="flex items-center gap-2.5">
              <span
                className="ink-border block h-3 w-3 shrink-0 bg-(--accent-ink)"
                style={{
                  borderRadius: "54% 46% 48% 52% / 50% 52% 48% 50%",
                }}
                aria-hidden
              />
              <span className="font-tech text-[11px] tracking-[0.1em] text-(--soft)">
                {entry.year}
              </span>
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
          <div className="dashed-rule my-9" />

          <h2 className="font-hand mb-3.5 text-[26px]">
            {aboutData.certificationsTitle}
          </h2>
          <div className="flex flex-col gap-3">
            {aboutData.certifications.map((entry, i) => {
              const body = (
                <>
                  <span className="flex items-center gap-2.5">
                    <span
                      className="ink-border block h-3 w-3 shrink-0 bg-(--accent-ink)"
                      style={{
                        borderRadius: "54% 46% 48% 52% / 50% 52% 48% 50%",
                      }}
                      aria-hidden
                    />
                    <span className="font-tech text-[11px] tracking-[0.1em] text-(--soft)">
                      {entry.year}
                    </span>
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
              const rowClass = cn(
                "ink-border flat-3 lift-card-sm grid grid-cols-1 items-center gap-4 bg-(--paper) px-[18px] py-3.5 sm:grid-cols-[170px_1fr]",
                i % 2 === 0 ? "r-card-alt" : "r-card",
                i % 2 === 1 && "lift-card-sm-cw",
              );

              return entry.url ? (
                <a
                  key={entry.id}
                  href={entry.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={rowClass}
                >
                  {body}
                </a>
              ) : (
                <div key={entry.id} className={rowClass}>
                  {body}
                </div>
              );
            })}
          </div>
        </>
      )}
    </>
  );
}
