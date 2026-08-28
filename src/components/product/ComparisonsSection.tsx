import Image from "next/image";
import Markdown from "@/components/logbook/Markdown";
import SectionShell from "./SectionShell";
import type { LocalizedLandingSection } from "@/schemas/product-landing";
import type { UiLabels } from "@/types/content";

type ComparisonsData = LocalizedLandingSection<"proof">;
type ComparisonItem = ComparisonsData["items"][number];

/**
 * Pasangan gambar sebelum/sesudah. Item tanpa gambar dirender sebagai teks
 * saja — sebagian perbaikan memang tidak bisa ditunjukkan dalam satu tangkapan
 * layar, dan itu bukan alasan untuk menyembunyikannya.
 */
function Frame({
  src,
  alt,
  label,
}: {
  src: string;
  alt: string;
  label: string;
}) {
  return (
    <figure className="m-0">
      <div className="r-frame ink-border flat-3 bg-(--wash) p-2">
        <div className="r-frame-inner ink-border relative aspect-[16/10] overflow-hidden">
          <Image
            src={src}
            alt={alt}
            fill
            sizes="(max-width: 640px) 100vw, 460px"
            className="object-contain"
          />
        </div>
      </div>
      <figcaption className="mt-2 text-[13px] leading-[1.55] text-(--soft)">
        {label}
      </figcaption>
    </figure>
  );
}

function Comparison({ item, ui }: { item: ComparisonItem; ui: UiLabels }) {
  const hasImages = Boolean(item.beforeImage || item.afterImage);
  const t = ui.products;

  return (
    <article className="flex flex-col gap-4">
      {item.title.trim() !== "" && (
        <h3 className="font-hand m-0 text-[24px] leading-[1.15]">
          {item.title}
        </h3>
      )}
      {item.detail.trim() !== "" && (
        <Markdown className="text-[15px]">{item.detail}</Markdown>
      )}

      {hasImages && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {item.beforeImage && (
            <Frame
              src={item.beforeImage}
              alt={`${item.title} — ${item.beforeLabel || t.beforeLabel}`}
              label={item.beforeLabel || t.beforeLabel}
            />
          )}
          {item.afterImage && (
            <Frame
              src={item.afterImage}
              alt={`${item.title} — ${item.afterLabel || t.afterLabel}`}
              label={item.afterLabel || t.afterLabel}
            />
          )}
        </div>
      )}
    </article>
  );
}

export default function ComparisonsSection({
  id,
  section,
  ui,
}: {
  id: string;
  section: ComparisonsData;
  ui: UiLabels;
}) {
  return (
    <SectionShell id={id} heading={section.heading} intro={section.intro}>
      <div className="flex flex-col gap-11">
        {section.items.map((item, index) => (
          <Comparison key={`${item.title}-${index}`} item={item} ui={ui} />
        ))}
      </div>
    </SectionShell>
  );
}
