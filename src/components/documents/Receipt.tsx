/**
 * Dipakai ulang, bukan ditulis ulang: pemformat itu memancang zona waktunya ke
 * UTC. Tanggal pada dokumen transaksi tidak boleh bergeser sehari tergantung
 * dari mana ia dibuka, dan tanggal di halaman ini harus sama persis dengan yang
 * ada di email tanda terimanya.
 */
import { formatPublishedAt } from "@/components/logbook/PostCard";
import type { OrderWithProduct } from "@/lib/db/orders";
import type { Locale, UiLabels } from "@/types/content";
import { formatCents } from "@/lib/utils";

/**
 * Dokumen tanda terima atas nama dikiachmadp.work | Digital Products.
 *
 * **Bukan invoice pajak, dan tidak berpura-pura begitu.** Polar Software Inc.
 * adalah merchant of record untuk setiap penjualan di sini — secara hukum
 * Polar-lah penjualnya, dan Polar pula yang menerbitkan invoice resminya.
 * Menerbitkan dokumen berjudul "Invoice" atas nama sendiri untuk transaksi yang
 * sama akan menciptakan dua invoice untuk satu penjualan. Yang dikerjakan
 * dokumen ini adalah pekerjaan yang memang belum dilakukan siapa pun:
 * memberikan konfirmasi pesanan yang membawa identitas penjual yang benar-benar
 * dikenal pembeli. Catatan merchant of record ada di kakinya, bukan
 * disembunyikan.
 *
 * Angka dan judul barangnya dari cuplikan di baris Order, bukan dari relasi
 * produknya — dokumen transaksi menyatakan apa yang berlaku saat uangnya
 * berpindah, bukan apa yang berlaku hari ini.
 */
function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-2 py-2">
      <span className="micro text-(--soft)">{label}</span>
      <span className="text-[14px] font-bold">{value}</span>
    </div>
  );
}

export default function Receipt({
  order,
  locale,
  ui,
}: {
  order: OrderWithProduct;
  locale: Locale;
  ui: UiLabels;
}) {
  const t = ui.receipt;
  const item = order.productTitle || t.deletedProduct;
  const total =
    order.amount > 0
      ? formatCents(order.amount, order.currency, locale)
      : t.freeLabel;

  const slug = order.product?.translations.find(
    (translation) => translation.locale === locale,
  )?.slug;

  return (
    <article className="r-panel ink-border flat-5 doc-sheet bg-(--paper) px-7 py-8 sm:px-10 sm:py-10">
      <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="font-hand text-[30px] leading-none">
            dikiachmadp.work
          </div>
          <div className="font-note text-[21px] leading-tight text-(--accent-ink)">
            | {t.brandSuffix}
          </div>
        </div>
        <div className="text-right">
          <div className="font-tech text-[11px] tracking-[0.2em] text-(--soft) uppercase">
            {t.title}
          </div>
          <div className="font-tech mt-1 text-[15px] font-bold tracking-[0.08em]">
            {order.orderNumber}
          </div>
        </div>
      </header>

      <div className="dashed-rule" />

      <section className="py-2">
        <Row
          label={t.dateLabel}
          value={formatPublishedAt(order.createdAt, locale)}
        />
        <Row label={t.billedToLabel} value={order.email || "—"} />
      </section>

      <div className="dashed-rule" />

      <section className="py-5">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <span className="micro text-(--soft)">{t.itemLabel}</span>
          <span className="micro text-(--soft)">{t.amountLabel}</span>
        </div>
        <div className="mt-2 flex flex-wrap items-baseline justify-between gap-3">
          <span className="font-hand text-[22px] leading-tight">{item}</span>
          <span className="text-[15px] font-bold">{total}</span>
        </div>
      </section>

      <div className="dashed-rule" />

      <section className="flex flex-wrap items-baseline justify-between gap-3 py-5">
        <span className="micro text-(--soft)">{t.totalLabel}</span>
        <span className="font-hand text-[32px] leading-none">{total}</span>
      </section>

      <div className="dashed-rule" />

      <footer className="pt-5">
        <p className="m-justify m-0 text-[12px] leading-[1.6] text-(--soft)">
          {t.deliveryNote}
        </p>
        <p className="m-justify mt-2 mb-0 text-[12px] leading-[1.6] text-(--soft)">
          {t.paymentNote}
        </p>
        {slug && (
          <a
            href={`/${locale}/products/${slug}`}
            className="mt-4 inline-block text-[12px] font-bold text-(--accent-ink) underline print:hidden"
          >
            {t.viewProduct} →
          </a>
        )}
      </footer>
    </article>
  );
}
