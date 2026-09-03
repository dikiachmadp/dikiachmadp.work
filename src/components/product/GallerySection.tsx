import SectionShell, { type SectionTone } from "./SectionShell";
import ProductGalleryShowcase from "./ProductGalleryShowcase";
import type { LocalizedBlockOf } from "@/schemas/product-blocks";
import type { UiLabels } from "@/types/content";

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
  block,
  ui,
  tone,
}: {
  block: LocalizedBlockOf<"gallery">;
  ui: UiLabels;
  tone?: SectionTone;
}) {
  const images = block.items.map((item, index) => ({
    id: item.image,
    url: item.image,
    alt: item.caption || `${block.heading} — ${index + 1}`,
    caption: item.caption || undefined,
  }));

  return (
    <SectionShell
      id={block.id}
      heading={block.heading}
      intro={block.intro}
      tone={tone}
    >
      <ProductGalleryShowcase images={images} title={block.heading} ui={ui} />
    </SectionShell>
  );
}
