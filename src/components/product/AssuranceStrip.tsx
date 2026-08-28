import type { UiLabels } from "@/types/content";

/**
 * Empat janji yang berlaku sama untuk setiap produk digital di sini, jadi
 * teksnya tinggal di kamus alih-alih ikut diisi ulang per produk di kolom
 * `landing`. Inilah yang di toko mana pun mengubah "halaman berisi tautan
 * bayar" jadi "halaman tempat orang berani bayar".
 */
export default function AssuranceStrip({ ui }: { ui: UiLabels }) {
  const a = ui.products.assurance;
  const items = [
    a.instantDownload,
    a.securePayment,
    a.receiptByEmail,
    a.unlimitedUse,
  ];

  return (
    <ul className="m-0 flex list-none flex-wrap gap-1.5 p-0">
      {items.map((label) => (
        <li
          key={label}
          className="r-tag ink-border flex items-center gap-1.5 bg-(--wash) px-2.5 py-[5px] text-[11px] leading-[1.3] font-bold"
        >
          <span aria-hidden="true" className="text-(--accent-ink)">
            ✓
          </span>
          {label}
        </li>
      ))}
    </ul>
  );
}
