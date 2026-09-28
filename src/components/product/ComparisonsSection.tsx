import Image from "next/image";
import Markdown from "@/components/logbook/Markdown";
import SectionShell, { type SectionTone } from "./SectionShell";
import BeforeAfterSlider from "./BeforeAfterSlider";
import type { LocalizedBlockOf } from "@/schemas/product-blocks";
import type { UiLabels } from "@/types/content";

type ComparisonBlock = LocalizedBlockOf<"comparison">;
type ComparisonItem = ComparisonBlock["items"][number];

/**
 * Bukti sebelum/sesudah. Sepasang gambar lengkap tampil sebagai pembagi yang
 * bisa digeser; item yang hanya punya salah satunya tetap tampil sebagai satu
 * bingkai; item tanpa gambar sama sekali dirender sebagai teks saja — sebagian
 * perbaikan memang tidak bisa ditunjukkan dalam satu tangkapan layar, dan itu
 * bukan alasan untuk menyembunyikannya.
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
        {/* Bingkai tunggal ini masih berasio tetap: tanpa pasangan untuk
            dibandingkan, kotak yang seragam justru lebih tenang dibaca. */}
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
  const t = ui.products;
  const beforeLabel = item.beforeLabel || t.beforeLabel;
  const afterLabel = item.afterLabel || t.afterLabel;
  const hasPair = Boolean(item.beforeImage && item.afterImage);
  const single = item.beforeImage || item.afterImage;

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

      {hasPair ? (
        <BeforeAfterSlider
          beforeImage={item.beforeImage}
          afterImage={item.afterImage}
          beforeLabel={beforeLabel}
          afterLabel={afterLabel}
          title={item.title}
          hint={t.compareHint}
          sliderLabel={t.compareSlider}
        />
      ) : (
        single && (
          <div className="sm:max-w-[520px]">
            <Frame
              src={single}
              alt={`${item.title} — ${item.beforeImage ? beforeLabel : afterLabel}`}
              label={item.beforeImage ? beforeLabel : afterLabel}
            />
          </div>
        )
      )}
    </article>
  );
}

export default function ComparisonsSection({
  block,
  ui,
  tone,
}: {
  block: ComparisonBlock;
  ui: UiLabels;
  tone?: SectionTone;
}) {
  return (
    <SectionShell
      id={block.id}
      heading={block.heading}
      intro={block.intro}
      tone={tone}
    >
      <div className="flex flex-col gap-12">
        {block.items.map((item, index) => (
          <Comparison key={`${item.title}-${index}`} item={item} ui={ui} />
        ))}
      </div>
    </SectionShell>
  );
}
