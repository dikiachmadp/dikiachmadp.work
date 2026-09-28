import Markdown from "@/components/logbook/Markdown";
import SectionShell, { type SectionTone } from "./SectionShell";
import type { LocalizedBlockOf } from "@/schemas/product-blocks";

/**
 * Satu bentuk data, tiga tata letak. `positioning`, `features`, dan `specs`
 * dulunya tiga seksi terpisah yang datanya identik; kini satu jenis blok yang
 * tata letaknya dipilih pemilik lewat `style`.
 */
export default function ListSection({
  block,
  tone,
}: {
  block: LocalizedBlockOf<"list">;
  tone?: SectionTone;
}) {
  const layout = block.style;

  return (
    <SectionShell
      id={block.id}
      heading={block.heading}
      intro={block.intro}
      tone={tone}
    >
      {layout === "specs" ? (
        <dl className="ink-border r-card m-0 grid grid-cols-1 gap-px overflow-hidden bg-(--line) sm:grid-cols-2">
          {block.items.map((item) => (
            <div key={item.label} className="bg-(--paper) px-5 py-4">
              <dt className="micro text-(--soft)">{item.label}</dt>
              <dd className="m-0 mt-1 text-[15px] leading-[1.6]">
                {item.detail}
              </dd>
            </div>
          ))}
        </dl>
      ) : layout === "cards" ? (
        <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2">
          {block.items.map((item) => (
            <div
              key={item.label}
              className="r-card ink-border flat-3 bg-(--paper) px-5 py-[18px]"
            >
              <h3 className="font-hand m-0 text-[21px] leading-[1.15]">
                {item.label}
              </h3>
              <p className="m-justify mt-2 mb-0 text-[14px] leading-[1.65] text-(--soft)">
                {item.detail}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <ol className="m-0 flex list-none flex-col gap-4 p-0">
          {block.items.map((item, index) => (
            <li key={item.label} className="flex items-start gap-4">
              <span
                aria-hidden="true"
                className="font-tech r-chip ink-border flex h-8 w-8 shrink-0 items-center justify-center bg-(--wash) text-[13px] font-bold"
              >
                {index + 1}
              </span>
              <div className="min-w-0">
                <h3 className="font-hand m-0 text-[20px] leading-[1.15]">
                  {item.label}
                </h3>
                <Markdown className="mt-1 text-[15px]">{item.detail}</Markdown>
              </div>
            </li>
          ))}
        </ol>
      )}
    </SectionShell>
  );
}
