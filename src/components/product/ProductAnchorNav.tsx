import Chip from "@/components/ui/Chip";
import type { LocalizedBlock } from "@/schemas/product-blocks";

/**
 * Baris jangkar ke blok-blok halaman jualan.
 *
 * Halaman ini bisa panjang — produk seperti OJS Restyle Kit melewati tujuh blok
 * sebelum sampai ke paket. Tanpa daftar isi, pembaca yang datang untuk satu hal
 * tertentu (harga, atau bukti) harus menggulir menembus sisanya.
 *
 * Labelnya diambil dari judul blok yang sudah dilokalkan, bukan dari daftar
 * label terpisah: satu tempat mengarang nama untuk hal yang sama sudah cukup,
 * dan dengan begini jangkarnya mustahil menyebut blok yang ternyata tidak
 * tayang di bahasa ini. Sasarannya `block.id`, uuid yang dicetak sekali di
 * penyunting dan tidak berubah lagi — jadi tautan jangkar tetap sah walau blok
 * dipindah atau judulnya diganti.
 */
export default function ProductAnchorNav({
  blocks,
  label,
}: {
  blocks: LocalizedBlock[];
  label: string;
}) {
  // Satu jangkar bukan daftar isi, cuma tombol yang membingungkan.
  if (blocks.length < 2) return null;

  return (
    <nav aria-label={label} className="mt-9 flex flex-wrap gap-2">
      {blocks.map((block, index) => (
        <Chip key={block.id} href={`#${block.id}`} mirrored={index % 2 === 1}>
          {block.heading}
        </Chip>
      ))}
    </nav>
  );
}
