import ComparisonsSection from "./ComparisonsSection";
import FaqSection from "./FaqSection";
import GallerySection from "./GallerySection";
import ListSection from "./ListSection";
import TiersSection from "./TiersSection";
import VariantsSection from "./VariantsSection";
import type { SectionTone } from "./SectionShell";
import type { LocalizedBlock } from "@/schemas/product-blocks";
import type { UiLabels } from "@/types/content";

/**
 * Blok halaman jualan, dirender dalam urutan yang dipilih pemiliknya.
 *
 * Pendahulunya merender delapan slot bernama dengan urutan yang dikunci kode.
 * Urutan itu memang menjamin halaman tersusun masuk akal, tapi juga berarti
 * produk yang punya sesuatu lain untuk dikatakan tidak punya tempat untuk
 * mengatakannya. Sekarang urutannya data, dan itu memang pertukaran yang
 * disengaja.
 *
 * Yang tetap milik kode adalah rupanya. Nada latar berselang-seling dihitung
 * dari indeks blok, bukan disimpan: bagaimanapun pemilik menyusun ulang
 * blok-baloknya, selang-selingnya tetap benar dan halaman tidak pernah terbaca
 * sebagai satu kolom artikel panjang.
 *
 * Blok yang kosong di bahasa ini sudah dibuang lebih dulu oleh
 * `localizeBlocks()` di lapisan akses data, jadi di sini tidak ada yang perlu
 * disaring lagi.
 */
export default function ProductLanding({
  blocks,
  ui,
}: {
  blocks: LocalizedBlock[];
  ui: UiLabels;
}) {
  if (blocks.length === 0) return null;

  return (
    <div className="mt-2">
      {blocks.map((block, index) => {
        const tone: SectionTone = index % 2 === 0 ? "plain" : "wash";

        switch (block.kind) {
          case "list":
            return <ListSection key={block.id} block={block} tone={tone} />;
          case "comparison":
            return (
              <ComparisonsSection
                key={block.id}
                block={block}
                ui={ui}
                tone={tone}
              />
            );
          case "variants":
            return (
              <VariantsSection
                key={block.id}
                block={block}
                demoLabel={ui.products.demoBtn}
                tone={tone}
              />
            );
          case "tiers":
            return (
              <TiersSection key={block.id} block={block} ui={ui} tone={tone} />
            );
          case "faq":
            return <FaqSection key={block.id} block={block} tone={tone} />;
          case "gallery":
            return (
              <GallerySection
                key={block.id}
                block={block}
                ui={ui}
                tone={tone}
              />
            );
        }
      })}
    </div>
  );
}
