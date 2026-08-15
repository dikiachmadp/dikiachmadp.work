"use client";

import { useMemo, useState } from "react";
import { ProjectsData, UiLabels, Locale } from "@/types/content";
import ProjectCard from "@/components/ui/ProjectCard";
import Chip from "@/components/ui/Chip";

interface ProjectsExplorerProps {
  projectsData: ProjectsData;
  uiLabels: UiLabels;
  locale: Locale;
}

/** Category chips plus a free-text search, filtered client-side over title and tags. */
export default function ProjectsExplorer({
  projectsData,
  uiLabels,
  locale,
}: ProjectsExplorerProps) {
  // Sentinel "tanpa filter". Bukan literal `"All"` seperti sebelumnya: itu
  // label bahasa Inggris yang dipakai sebagai nilai, jadi ia ikut jadi bagian
  // kontrak yang tidak boleh diterjemahkan — persis jenis jebakan yang sedang
  // dibereskan di sini. `null` tidak bisa bentrok dengan kunci mana pun.
  const [categoryKey, setCategoryKey] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return projectsData.items.filter((p) => {
      const matchesCategory =
        categoryKey === null || p.categoryKey === categoryKey;
      const matchesQuery =
        !q ||
        p.title.toLowerCase().includes(q) ||
        p.tags.join(" ").toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
    });
  }, [projectsData.items, categoryKey, query]);

  return (
    <>
      <div className="mb-[30px] flex flex-wrap items-center justify-between gap-2.5 border-b-2 border-dashed border-(--line) pb-[22px]">
        <div className="flex flex-wrap gap-2">
          {/* Chip "semua" dirender terpisah, bukan sebagai entri palsu di dalam
              daftar kategori — dulu ia ikut di sana sebagai label "All" yang
              harus dikecualikan lagi di beberapa tempat. */}
          <Chip
            active={categoryKey === null}
            onClick={() => setCategoryKey(null)}
          >
            {uiLabels.states.allCategories}
          </Chip>
          {projectsData.categories.map((cat) => (
            <Chip
              key={cat.key}
              active={categoryKey === cat.key}
              onClick={() => setCategoryKey(cat.key)}
            >
              {cat.label}
            </Chip>
          ))}
        </div>

        <label
          className="ink-border flex w-full items-center gap-[9px] bg-(--paper) px-[15px] py-2 sm:w-auto sm:min-w-[250px]"
          style={{ borderRadius: "20px 9px 22px 8px / 8px 22px 9px 20px" }}
        >
          <span className="sr-only">{uiLabels.states.searchPlaceholder}</span>
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            aria-hidden
            className="shrink-0"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-3.5-3.5" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={uiLabels.states.searchPlaceholder}
            className="w-full flex-1 border-none bg-transparent text-[12px] font-semibold tracking-[0.05em] outline-none placeholder:text-(--soft)"
          />
        </label>
      </div>

      {visible.length > 0 ? (
        <div className="grid grid-cols-1 gap-[26px] sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((project) => (
            <ProjectCard key={project.id} project={project} locale={locale} />
          ))}
        </div>
      ) : (
        <div
          className="ink-border-dashed font-hand p-[70px] text-center text-[24px] text-(--soft)"
          style={{ borderRadius: "30px 12px 32px 13px / 13px 32px 12px 30px" }}
        >
          {uiLabels.states.empty}
        </div>
      )}
    </>
  );
}
