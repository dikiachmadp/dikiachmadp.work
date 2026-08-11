import { PolicyData, PageHeaderData, Locale } from "@/types/content";
import PageHeader from "@/components/layout/PageHeader";
import Chip from "@/components/ui/Chip";

interface PolicyDocumentProps {
  policy: PolicyData;
  header: PageHeaderData["legal"];
  tabs: { key: "legal" | "privacy"; label: string; href: string }[];
  active: "legal" | "privacy";
}

/**
 * Legal and Privacy share one layout: mono "last updated" line, heading, intro,
 * the two tab chips, then sections as dashed left-border blocks.
 */
export default function PolicyDocument({
  policy,
  header,
  tabs,
  active,
}: PolicyDocumentProps) {
  const sections =
    policy.sections?.map((s) => ({ heading: s.heading, content: s.content })) ??
    policy.points?.map((p) => ({ heading: p.title, content: p.content })) ??
    [];

  return (
    <div className="mx-auto w-full max-w-[820px] px-[22px] pt-[52px]">
      <PageHeader
        topTitle={header.topTitle}
        title={header.title}
        description={header.description}
        eyebrowStyle="mono"
        className="mb-7"
      />

      <div className="mb-[30px] flex gap-2.5">
        {tabs.map((tab) => (
          <Chip key={tab.key} href={tab.href} active={tab.key === active}>
            {tab.label}
          </Chip>
        ))}
      </div>

      <div className="flex flex-col gap-[22px]">
        {sections.map((section) => (
          <div
            key={section.heading}
            className="border-l-2 border-dashed border-(--line) pl-5"
          >
            <h2 className="font-hand mb-2 text-[22px]">{section.heading}</h2>
            {section.content.split("\n\n").map((paragraph, i) => (
              <p
                key={i}
                className="m-0 mb-3 text-[15px] leading-[1.75] text-(--soft) last:mb-0"
              >
                {paragraph}
              </p>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function policyTabs(locale: Locale, labels: [string, string]) {
  return [
    { key: "legal" as const, label: labels[0], href: `/${locale}/legal` },
    { key: "privacy" as const, label: labels[1], href: `/${locale}/privacy` },
  ];
}
