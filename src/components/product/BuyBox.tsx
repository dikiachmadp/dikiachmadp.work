import Button from "@/components/ui/Button";
import Tag from "@/components/ui/Tag";
import BuyPanel from "@/components/products/BuyPanel";
import AssuranceStrip from "./AssuranceStrip";
import type { DigitalProductDetail } from "@/lib/db/products";
import type { Locale, UiLabels } from "@/types/content";
import { priceLabel } from "@/lib/utils";

/**
 * Kartu beli — pusat gravitasi halaman ini, dan sekarang juga kepalanya.
 *
 * Judul dan ringkasan produk pindah ke dalam kartu ini. Keduanya berhenti jadi
 * kepala dokumen karena inilah yang dibaca pembeli lebih dulu, dan kartu yang
 * menuntut mata melompat ke luar dirinya untuk tahu barang apa yang dijual
 * bukan kartu yang berdiri sendiri. Judul di sini **tetap** `<h1>` halaman:
 * yang berpindah posisinya, bukan perannya — melepas `<h1>` akan merugikan
 * pembaca layar sekaligus membatalkan kerja metadata yang sudah dibayar.
 *
 * Daftar "apa yang kamu dapat" datang dari `deliverables` milik terjemahan
 * produk. Dulu ia dipinjam dari paket yang ditandai `recommended` di seksi
 * `tiers`, yang berarti produk satu berkas harus mengarang tabel paket hanya
 * supaya kartunya tidak kosong. Itulah keluhan yang memulai seluruh rombakan
 * ini.
 *
 * `id="buy"` adalah sasaran gulir tombol-tombol lain di halaman ini (bilah
 * lengket dan penutup halaman), supaya hanya ada satu `BuyPanel` di DOM dan
 * checkout tidak pernah bisa terbuka dua kali.
 */
export default function BuyBox({
  product,
  locale,
  ui,
}: {
  product: DigitalProductDetail;
  locale: Locale;
  ui: UiLabels;
}) {
  const t = ui.products;
  const price = priceLabel(
    product.price,
    product.currency,
    locale,
    t.freeLabel,
  );

  return (
    <aside
      id="buy"
      className="r-card-alt ink-border flat-5 flex scroll-mt-[calc(var(--nav-h)+20px)] flex-col gap-4 bg-(--paper) p-6 lg:sticky lg:top-[calc(var(--nav-h)+20px)]"
    >
      <div>
        <h1 className="font-hand m-0 text-[clamp(1.9rem,4vw,2.35rem)] leading-[1.05]">
          {product.title}
        </h1>
        <p className="m-0 mt-2.5 text-[14px] leading-[1.6] text-(--soft)">
          {product.summary}
        </p>
      </div>

      {price && (
        <div>
          <div className="micro">{locale === "id" ? "Harga" : "Price"}</div>
          <div className="font-hand mt-0.5 text-[38px] leading-[1.05]">
            {price}
          </div>
        </div>
      )}

      {product.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {product.tags.map((tag) => (
            <Tag key={tag} className="px-3 py-[5px]">
              {tag}
            </Tag>
          ))}
        </div>
      )}

      {product.deliverables.length > 0 && (
        <>
          <div className="dashed-rule" />
          <div>
            <div className="micro text-(--soft)">{t.whatYouGet}</div>
            <ul className="m-0 mt-2 flex list-none flex-col gap-1.5 p-0">
              {product.deliverables.map((entry) => (
                <li
                  key={entry}
                  className="flex items-start gap-2 text-[13px] leading-[1.5]"
                >
                  <span
                    aria-hidden="true"
                    className="font-tech shrink-0 text-(--accent-ink)"
                  >
                    ✓
                  </span>
                  {entry}
                </li>
              ))}
            </ul>
          </div>
        </>
      )}

      <div className="dashed-rule" />

      <BuyPanel
        slug={product.slug}
        locale={locale}
        labels={t}
        polarProductId={product.polarProductId}
        buyUrl={product.buyUrl}
        price={product.price}
        pwywEnabled={product.pwywEnabled}
        pwywMinAmount={product.pwywMinAmount}
      />

      {/* Tanpa `demoUrl` tidak ada tombol sama sekali — bukan tombol nonaktif
          dan bukan tautan mati. */}
      {product.demoUrl && (
        <Button
          href={product.demoUrl}
          target="_blank"
          rel="noopener noreferrer"
          variant="secondary"
          size="sm"
          fullWidth
          className="r-chip py-[11px] text-[13px]"
        >
          {t.demoBtn} ↗
        </Button>
      )}

      <div className="dashed-rule" />

      <AssuranceStrip ui={ui} />
    </aside>
  );
}
