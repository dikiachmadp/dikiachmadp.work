import ComparisonsSection from "./ComparisonsSection";
import FaqSection from "./FaqSection";
import GallerySection from "./GallerySection";
import ListSection from "./ListSection";
import TiersSection from "./TiersSection";
import VariantsSection from "./VariantsSection";
import {
  LANDING_SLOTS,
  isLandingEmpty,
  type LocalizedProductLanding,
} from "@/schemas/product-landing";
import type { UiLabels } from "@/types/content";

/**
 * Delapan seksi halaman jualan, urutannya diambil dari `LANDING_SLOTS` —
 * satu-satunya tempat urutan itu ditulis. Seksi yang kosong di bahasa ini
 * sudah dibuang lebih dulu oleh `localizeLanding`, jadi di sini cukup dilewati.
 *
 * Urutannya bukan sembarang: kail → bantahan keberatan → bukti → kelengkapan →
 * pilihan → sisa keraguan. Menaruh harga sebelum bukti adalah kesalahan yang
 * paling sering merusak halaman semacam ini, dan karena urutannya di kode,
 * tidak ada produk yang bisa salah menyusunnya.
 */
export default function ProductLanding({
  landing,
  ui,
}: {
  landing: LocalizedProductLanding;
  ui: UiLabels;
}) {
  if (isLandingEmpty(landing)) return null;

  return (
    <div className="mt-2">
      {LANDING_SLOTS.map((spec) => {
        const slot = spec.slot;

        switch (slot) {
          case "positioning":
          case "features":
          case "specs": {
            const section = landing[slot];
            return section ? (
              <ListSection
                key={slot}
                id={slot}
                section={section}
                layout={spec.layout ?? "points"}
                tone={spec.tone}
              />
            ) : null;
          }

          case "proof": {
            const section = landing[slot];
            return section ? (
              <ComparisonsSection
                key={slot}
                id={slot}
                section={section}
                ui={ui}
                tone={spec.tone}
              />
            ) : null;
          }

          case "variants": {
            const section = landing[slot];
            return section ? (
              <VariantsSection
                key={slot}
                id={slot}
                section={section}
                demoLabel={ui.products.demoBtn}
                tone={spec.tone}
              />
            ) : null;
          }

          case "tiers": {
            const section = landing[slot];
            return section ? (
              <TiersSection
                key={slot}
                id={slot}
                section={section}
                ui={ui}
                tone={spec.tone}
              />
            ) : null;
          }

          case "faq": {
            const section = landing[slot];
            return section ? (
              <FaqSection
                key={slot}
                id={slot}
                section={section}
                tone={spec.tone}
              />
            ) : null;
          }

          case "gallery": {
            const section = landing[slot];
            return section ? (
              <GallerySection
                key={slot}
                id={slot}
                section={section}
                ui={ui}
                tone={spec.tone}
              />
            ) : null;
          }
        }
      })}
    </div>
  );
}
