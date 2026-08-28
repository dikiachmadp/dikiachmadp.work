import Button from "@/components/ui/Button";
import SectionShell from "./SectionShell";
import { cn } from "@/lib/utils";
import type { LocalizedLandingSection } from "@/schemas/product-landing";
import type { UiLabels } from "@/types/content";

type TiersData = LocalizedLandingSection<"tiers">;

function EntryList({
  label,
  entries,
  struck,
}: {
  label: string;
  entries: string[];
  struck?: boolean;
}) {
  if (entries.length === 0) return null;
  return (
    <div>
      <div className="micro text-(--soft)">{label}</div>
      <ul className="m-0 mt-2 flex list-none flex-col gap-1.5 p-0">
        {entries.map((entry) => (
          <li
            key={entry}
            className={cn(
              "flex items-start gap-2 text-[14px] leading-[1.55]",
              struck && "text-(--soft) line-through decoration-1",
            )}
          >
            <span aria-hidden="true" className="font-tech shrink-0">
              {struck ? "×" : "✓"}
            </span>
            {entry}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function TiersSection({
  id,
  section,
  ui,
}: {
  id: string;
  section: TiersData;
  ui: UiLabels;
}) {
  const t = ui.products;

  return (
    <SectionShell id={id} heading={section.heading} intro={section.intro}>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {section.items.map((tier) => (
          <div
            key={tier.name}
            className={cn(
              "r-card ink-border relative flex flex-col gap-4 bg-(--paper) p-5",
              tier.recommended ? "flat-5" : "flat-3",
            )}
          >
            {tier.recommended && (
              <span className="r-tag ink-border absolute -top-3 right-4 bg-(--accent) px-2.5 py-1 text-[10px] font-bold tracking-[0.1em] uppercase">
                {t.recommendedBadge}
              </span>
            )}

            <div>
              <h3 className="font-hand m-0 text-[24px] leading-[1.15]">
                {tier.name}
              </h3>
              {tier.price.trim() !== "" && (
                <div className="font-hand mt-1 text-[30px] leading-[1.1]">
                  {tier.price}
                </div>
              )}
              {tier.priceNote.trim() !== "" && (
                <p className="m-0 mt-1 text-[12px] text-(--soft)">
                  {tier.priceNote}
                </p>
              )}
            </div>

            {tier.summary.trim() !== "" && (
              <p className="m-justify m-0 text-[14px] leading-[1.65] text-(--soft)">
                {tier.summary}
              </p>
            )}

            <EntryList label={t.includedLabel} entries={tier.includes} />
            <EntryList
              label={t.notIncludedLabel}
              entries={tier.excludes}
              struck
            />

            <div className="mt-auto pt-1">
              {/* Paket tanpa tautan checkout menampilkan tombol nonaktif,
                  bukan tautan yang membawa pembaca ke mana-mana. */}
              <Button
                href={tier.ctaUrl || undefined}
                disabled={tier.ctaUrl === ""}
                target="_blank"
                rel="noopener noreferrer"
                variant={tier.recommended ? "primary" : "secondary"}
                size="sm"
                fullWidth
                className="r-chip py-[11px] text-[13px]"
              >
                {tier.ctaLabel || t.buyBtn} ↗
              </Button>
            </div>
          </div>
        ))}
      </div>
    </SectionShell>
  );
}
