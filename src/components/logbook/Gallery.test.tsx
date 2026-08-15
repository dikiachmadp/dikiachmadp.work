import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import Gallery from "@/components/logbook/Gallery";
import { UiSchema } from "@/schemas/content";
import en from "@/content/en/ui.json";
import id from "@/content/id/ui.json";
import type { LogbookImageItem } from "@/lib/db/logbook";

// Label asli, bukan fixture: kalau sebuah kunci hilang dari salah satu bahasa,
// test ini gagal di sini alih-alih tampil sebagai nama aksesibel kosong.
const ui = UiSchema.parse(en);

function images(count: number): LogbookImageItem[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `img-${i}`,
    url: `/g/${i}.webp`,
    alt: `Gambar ${i + 1}`,
    caption: i === 0 ? "Keterangan pertama" : undefined,
  }));
}

const render = (count: number) =>
  renderToStaticMarkup(
    <Gallery images={images(count)} title="Sebuah pos" ui={ui} />,
  );

describe("Gallery", () => {
  /**
   * "Nol gambar = tidak dirender sama sekali" adalah keputusan desain, bukan
   * detail: pos tanpa gambar tidak boleh menyisakan bingkai kosong di tengah
   * tulisan.
   */
  it("renders nothing at all when the post has no images", () => {
    expect(render(0)).toBe("");
  });

  it("shows one large image and no thumbnail row for a single image", () => {
    const html = render(1);

    expect(html).toContain('alt="Gambar 1"');
    expect(html).not.toContain("aria-current");
  });

  it("adds a thumbnail row from the second image onward", () => {
    const html = render(3);

    expect(html).toContain('aria-label="Show image 2"');
    expect(html).toContain('aria-label="Show image 3"');
  });

  // Thumbnail aktif ditandai `aria-current`, dan hanya satu; warna border saja
  // tidak terbaca pembaca layar.
  it("marks exactly one thumbnail as current", () => {
    const html = render(4);

    expect(html.match(/aria-current="true"/g)).toHaveLength(1);
    // Yang tidak aktif dibiarkan tanpa atribut, bukan aria-current="false".
    expect(html).not.toContain('aria-current="false"');
  });

  it("names the gallery after the post it belongs to", () => {
    expect(render(2)).toContain('aria-label="Gallery for Sebuah pos"');
  });

  it("shows the caption of the image on display", () => {
    expect(render(2)).toContain("Keterangan pertama");
  });

  // Thumbnail mengulang gambar yang namanya sudah dibacakan tombolnya, jadi
  // alt kosong — kalau tidak, pembaca layar membacanya dua kali.
  it("leaves thumbnail images out of the accessibility tree", () => {
    expect(render(2)).toContain('alt=""');
  });
});

/**
 * Fase i18n sebelumnya menutup kebocoran nama aksesibel berbahasa Inggris di
 * situs berbahasa Indonesia. Galeri ini menambah enam kunci baru sekaligus,
 * jadi keduanya diperiksa punya bentuk yang sama.
 */
describe("label galeri ada di kedua bahasa", () => {
  it("parses both ui.json files against the schema", () => {
    expect(() => UiSchema.parse(en)).not.toThrow();
    expect(() => UiSchema.parse(id)).not.toThrow();
  });

  it("does not leave an Indonesian label identical to the English one", () => {
    const enA11y = UiSchema.parse(en).a11y;
    const idA11y = UiSchema.parse(id).a11y;

    for (const key of [
      "logbookGallery",
      "enlargeImage",
      "imageDialog",
      "previousImage",
      "nextImage",
      "showImage",
    ] as const) {
      expect(idA11y[key], `a11y.${key} belum diterjemahkan`).not.toBe(
        enA11y[key],
      );
    }
  });
});
