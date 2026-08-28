import Markdown from "@/components/logbook/Markdown";
import SectionShell from "./SectionShell";
import type { LocalizedLandingSection } from "@/schemas/product-landing";

type FaqData = LocalizedLandingSection<"faq">;

/**
 * `<details>`/`<summary>` asli, bukan akordeon buatan sendiri: keyboard,
 * pembaca layar, dan Ctrl+F peramban sudah menanganinya tanpa satu baris pun
 * JavaScript klien.
 */
export default function FaqSection({
  id,
  section,
}: {
  id: string;
  section: FaqData;
}) {
  return (
    <SectionShell id={id} heading={section.heading} intro={section.intro}>
      <div className="flex flex-col gap-2.5">
        {section.items.map((item) => (
          <details
            key={item.question}
            className="r-card ink-border group bg-(--paper) px-5 py-4"
          >
            <summary className="flex cursor-pointer list-none items-start justify-between gap-4 text-[15px] font-bold">
              {item.question}
              <span
                aria-hidden="true"
                className="font-tech shrink-0 text-(--soft) group-open:rotate-45"
              >
                +
              </span>
            </summary>
            <Markdown className="mt-3 text-[15px]">{item.answer}</Markdown>
          </details>
        ))}
      </div>
    </SectionShell>
  );
}
