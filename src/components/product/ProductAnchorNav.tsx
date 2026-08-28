import Chip from "@/components/ui/Chip";
import { LANDING_SLOTS } from "@/schemas/product-landing";
import type {
  LandingSlot,
  LocalizedProductLanding,
} from "@/schemas/product-landing";

/**
 * Baris jangkar ke seksi-seksi halaman jualan.
 *
 * Halaman ini panjang — pada produk seperti OJS Restyle Kit ia melewati tujuh
 * seksi sebelum sampai ke paket. Tanpa daftar isi, pembaca yang datang untuk
 * satu hal tertentu (harga, atau bukti) harus menggulir menembus sisanya.
 *
 * Labelnya diambil dari judul seksi yang sudah dilokalkan, bukan dari daftar
 * label terpisah: satu tempat mengarang nama untuk hal yang sama sudah cukup,
 * dan dengan begini jangkarnya mustahil menyebut seksi yang ternyata tidak
 * tayang di bahasa ini.
 */
export default function ProductAnchorNav({
  landing,
  label,
}: {
  landing: LocalizedProductLanding;
  label: string;
}) {
  const anchors = LANDING_SLOTS.map((spec) => ({
    slot: spec.slot,
    heading: landing[spec.slot]?.heading,
  })).filter(
    (anchor): anchor is { slot: LandingSlot; heading: string } =>
      typeof anchor.heading === "string" && anchor.heading.trim() !== "",
  );

  // Satu jangkar bukan daftar isi, cuma tombol yang membingungkan.
  if (anchors.length < 2) return null;

  return (
    <nav aria-label={label} className="mt-9 flex flex-wrap gap-2">
      {anchors.map((anchor, index) => (
        <Chip
          key={anchor.slot}
          href={`#${anchor.slot}`}
          mirrored={index % 2 === 1}
        >
          {anchor.heading}
        </Chip>
      ))}
    </nav>
  );
}
