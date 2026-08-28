import SectionShell, { type SectionTone } from "./SectionShell";
import ProductGalleryShowcase from "./ProductGalleryShowcase";
import type { LocalizedLandingSection } from "@/schemas/product-landing";
import type { UiLabels } from "@/types/content";

type GalleryData = LocalizedLandingSection<"gallery">;

/**
 * Dulu seksi ini memakai ulang `ui/Gallery` milik Logbook dan Project apa
 * adanya, dengan alasan tidak perlu ada galeri kedua untuk dirawat. Alasan itu
 * kini sengaja dibalik: halaman ini menjual barang, bukan mendokumentasikan
 * pekerjaan, dan keduanya menuntut bentuk yang berbeda.
 *
 * `ui/Gallery` menampilkan satu gambar berasio tetap plus deret thumbnail —
 * cocok untuk menelusuri satu per satu. Pembeli ingin sebaliknya: melihat
 * banyak sekaligus, pada bentuk aslinya, lalu memperbesar yang menarik
 * perhatiannya. `ProductGalleryShowcase` melakukan itu, dan `ui/Gallery` tetap
 * tidak tersentuh untuk Logbook dan Project.
 */
export default function GallerySection({
  id,
  section,
  ui,
  tone,
}: {
  id: string;
  section: GalleryData;
  ui: UiLabels;
  tone?: SectionTone;
}) {
  const images = section.items.map((item, index) => ({
    id: item.image,
    url: item.image,
    alt: item.caption || `${section.heading} — ${index + 1}`,
    caption: item.caption || undefined,
  }));

  return (
    <SectionShell
      id={id}
      heading={section.heading}
      intro={section.intro}
      tone={tone}
    >
      <ProductGalleryShowcase images={images} title={section.heading} ui={ui} />
    </SectionShell>
  );
}
