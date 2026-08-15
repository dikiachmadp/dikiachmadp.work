import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { revalidatePath } from "next/cache";
import { revalidateLogbookPaths } from "@/lib/db/revalidate";

function revalidated(): string[] {
  return vi.mocked(revalidatePath).mock.calls.map(([path]) => path);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("revalidateLogbookPaths", () => {
  it("refreshes both indexes and the Studio page that lists posts", () => {
    revalidateLogbookPaths();

    expect(revalidated()).toEqual(
      expect.arrayContaining([
        "/en/logbook",
        "/id/logbook",
        "/en/studio",
        "/id/studio",
        "/sitemap.xml",
      ]),
    );
  });

  /**
   * `revalidateProjectPaths(data.slug)` dipanggil dengan slug **baru** saat
   * update, jadi URL lama tetap tersaji dari cache sampai ISR kedaluwarsa.
   * Ini test yang menjaga celah itu tidak ikut terwarisi.
   */
  it("revalidates the old slug as well as the new one on a rename", () => {
    revalidateLogbookPaths({
      slugs: [{ locale: "en", slug: "judul-baru" }],
      previousSlugs: [{ locale: "en", slug: "judul-lama" }],
    });

    expect(revalidated()).toContain("/en/logbook/judul-baru");
    expect(revalidated()).toContain("/en/logbook/judul-lama");
  });

  // `deleteProjectAction` memanggil revalidasi tanpa slug sama sekali, jadi
  // halaman yang baru dihapus tetap tersaji. Penghapusan di sini mengirim slug
  // lamanya.
  it("revalidates the slugs of a deleted post", () => {
    revalidateLogbookPaths({
      previousSlugs: [
        { locale: "en", slug: "gone" },
        { locale: "id", slug: "hilang" },
      ],
    });

    expect(revalidated()).toContain("/en/logbook/gone");
    expect(revalidated()).toContain("/id/logbook/hilang");
  });

  // Slug per bahasa berarti EN dan ID bisa memakai slug yang sama; keduanya
  // tetap dua path berbeda.
  it("treats the same slug in two languages as two paths", () => {
    revalidateLogbookPaths({
      slugs: [
        { locale: "en", slug: "sama" },
        { locale: "id", slug: "sama" },
      ],
    });

    expect(revalidated()).toContain("/en/logbook/sama");
    expect(revalidated()).toContain("/id/logbook/sama");
  });

  it("does not revalidate the same path twice when the slug is unchanged", () => {
    revalidateLogbookPaths({
      slugs: [{ locale: "en", slug: "tetap" }],
      previousSlugs: [{ locale: "en", slug: "tetap" }],
    });

    expect(
      revalidated().filter((path) => path === "/en/logbook/tetap"),
    ).toHaveLength(1);
  });
});
