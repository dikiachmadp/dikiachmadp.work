import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import ProjectsExplorer from "@/components/interactive/ProjectsExplorer";
import { projectCategories } from "@/lib/categories";
import { UiSchema } from "@/schemas/content";
import idUi from "@/content/id/ui.json";
import type { Project } from "@/types/content";

const ui = UiSchema.parse(idUi);

function project(id: string, categoryKey: string): Project {
  return {
    id,
    slug: id,
    title: `Project ${id}`,
    categoryKey,
    year: "2026",
    date: "2026-01-01",
    client: "Klien",
    description: "Deskripsi",
    tags: [],
    coverImage: "",
    logoUrl: "",
    featured: false,
  };
}

const items = [
  project("a", "web-development"),
  project("b", "graphic-design"),
  project("c", "web-development"),
];

const render = () =>
  renderToStaticMarkup(
    <ProjectsExplorer
      projectsData={{ categories: projectCategories("id"), items }}
      uiLabels={ui}
      locale="id"
    />,
  );

/**
 * Yang bisa diperiksa dari render statis adalah kontrak yang dulu rusak:
 * chip berbahasa Indonesia, dan tidak ada satu pun label Inggris yang
 * tertinggal sebagai nilai. Perilaku kliknya diverifikasi di browser.
 */
describe("ProjectsExplorer di locale id", () => {
  it("labels the chips in Indonesian", () => {
    const html = render();

    expect(html).toContain("Website &amp; Pengembangan");
    expect(html).toContain("Penerbitan Akademik");
    expect(html).toContain("Solusi Digital");
  });

  // Dulu chip "All" adalah entri literal di dalam daftar kategori dan
  // dikecualikan lagi di beberapa tempat. Sekarang ia dirender terpisah dari
  // ui.json, jadi ikut berbahasa Indonesia.
  it("takes the all-categories chip from the dictionary", () => {
    expect(render()).toContain(ui.states.allCategories);
    expect(render()).not.toContain(">All<");
  });

  it("shows every project before any chip is clicked", () => {
    const html = render();

    for (const item of items) {
      expect(html).toContain(`/id/projects/${item.slug}`);
    }
  });

  // Kartu memakai label yang sama dengan chip, dicari dari kunci yang sama.
  // Kalau keduanya berbeda sumber, inilah yang lebih dulu menyimpang.
  it("labels the cards from the same key lookup as the chips", () => {
    const html = render();

    expect(html).toContain("Website &amp; Pengembangan · 2026");
    expect(html).not.toContain("Web &amp; Development · 2026");
  });

  /**
   * Chip aktif dulu hanya ditandai isian warna aksen — tidak terbaca pembaca
   * layar, dan warna saja bukan penanda yang cukup. Saat belum ada kategori
   * yang dipilih, yang berstatus ditekan hanya chip "semua".
   */
  it("announces which chip is pressed", () => {
    const html = render();

    expect(html.match(/aria-pressed="true"/g)).toHaveLength(1);
    expect(html.match(/aria-pressed="false"/g)).toHaveLength(
      projectCategories("id").length,
    );
  });
});
