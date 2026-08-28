import Tag from "@/components/ui/Tag";
import BuyPanel from "@/components/products/BuyPanel";
import AssuranceStrip from "./AssuranceStrip";
import type { DigitalProductDetail } from "@/lib/db/products";
import type { Locale, UiLabels } from "@/types/content";
import { formatPrice } from "@/lib/utils";

/**
 * Kartu beli — pusat gravitasi halaman ini.
 *
 * Sebelumnya ini `<aside>` selebar 260px berisi harga kecil dan satu tombol.
 * Yang membuatnya terbaca sebagai toko bukan tombolnya, melainkan apa yang
 * mengelilinginya: harga yang benar-benar besar, daftar isi paket, dan janji
 * layanan. Semuanya diturunkan dari data yang sudah ada — daftar isi diambil
 * dari paket yang ditandai `recommended` di seksi `tiers`, jadi tidak ada satu
 * pun field baru yang harus diisi admin supaya kartu ini penuh.
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
  const price = formatPrice(product.price, product.currency, locale);

  // Paket yang disarankan mewakili "apa yang kamu dapat kalau membeli"; kalau
  // tidak ada yang ditandai, paket pertama sudah cukup mewakili.
  const tiers = product.landing.tiers?.items ?? [];
  const highlight = tiers.find((tier) => tier.recommended) ?? tiers[0];
  const includes = highlight?.includes.slice(0, 6) ?? [];

  return (
    <aside
      id="buy"
      className="r-card-alt ink-border flat-5 flex scroll-mt-[calc(var(--nav-h)+20px)] flex-col gap-4 bg-(--paper) p-6 lg:sticky lg:top-[calc(var(--nav-h)+20px)]"
    >
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

      <div className="dashed-rule" />

      <BuyPanel
        slug={product.slug}
        locale={locale}
        labels={t}
        polarProductId={product.polarProductId}
        buyUrl={product.buyUrl}
        pwywEnabled={product.pwywEnabled}
        pwywMinAmount={product.pwywMinAmount}
      />

      {includes.length > 0 && (
        <div>
          <div className="micro text-(--soft)">{t.whatYouGet}</div>
          <ul className="m-0 mt-2 flex list-none flex-col gap-1.5 p-0">
            {includes.map((entry) => (
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
      )}

      <div className="dashed-rule" />

      <AssuranceStrip ui={ui} />
    </aside>
  );
}
