import React from "react";
import { getDictionary } from "@/lib/dictionary";
import PageWrapper from "@/components/layout/PageWrapper";
import PageHeader from "@/components/layout/PageHeader";
import SectionWrapper from "@/components/layout/SectionWrapper";
import Link from "next/link";
import { ArrowUpRight, ShoppingBag, BookOpen } from "lucide-react";
import { Locale } from "@/types/content";

const typeConfig = {
  thoughts: {
    label: "Thoughts",
    Icon: BookOpen,
    color: "text-blue-400",
  },
  store: {
    label: "Store",
    Icon: ShoppingBag,
    color: "text-(--accent)",
  },
};

export default async function StudioPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const resolvedParams = await params;
  const validLocale =
    resolvedParams.locale === "en" || resolvedParams.locale === "id"
      ? (resolvedParams.locale as Locale)
      : "en";

  const dict = await getDictionary(validLocale);
  const header = dict.pageHeader.studio;

  return (
    <PageWrapper>
      <PageHeader
        topTitle={header.topTitle}
        title={header.title}
        description={header.description}
      />
      <SectionWrapper id="studio-items">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {dict.studio.items.map((item) => {
            const config = typeConfig[item.type];
            const isExternal = item.link.startsWith("http");
            return (
              <Link
                key={item.id}
                href={item.link}
                target={isExternal ? "_blank" : "_self"}
                rel={isExternal ? "noopener noreferrer" : ""}
                className="group block border-2 border-(--border) p-6 md:p-8 bg-(--card) hover:border-(--accent) hover:-translate-y-1 transition-all duration-200"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-2">
                    <config.Icon className={`w-4 h-4 ${config.color}`} />
                    <span
                      className={`text-xs font-black uppercase tracking-widest ${config.color}`}
                    >
                      {config.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black font-mono text-(--gray-medium)">
                      {item.id}
                    </span>
                    <ArrowUpRight className="w-5 h-5 text-(--gray-medium) group-hover:text-(--accent) group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
                  </div>
                </div>
                <h2 className="text-2xl md:text-3xl font-black uppercase leading-tight group-hover:text-(--accent) transition-colors">
                  {item.title}
                </h2>
              </Link>
            );
          })}
        </div>
      </SectionWrapper>
    </PageWrapper>
  );
}
