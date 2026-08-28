import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import Receipt from "@/components/documents/Receipt";
import { UiSchema } from "@/schemas/content";
import en from "@/content/en/ui.json";
import id from "@/content/id/ui.json";
import type { OrderWithProduct } from "@/lib/db/orders";
import type { Locale } from "@/types/content";

// Label asli, bukan fixture: kalau sebuah kunci hilang dari salah satu bahasa,
// test ini gagal di sini alih-alih tampil sebagai bagian dokumen yang kosong.
const UI = { en: UiSchema.parse(en), id: UiSchema.parse(id) };

function order(overrides: Partial<OrderWithProduct> = {}): OrderWithProduct {
  return {
    id: "o1",
    polarOrderId: "ord_1",
    polarCheckoutId: "chk_1",
    productId: "p1",
    email: "buyer@example.com",
    amount: 14_900_000,
    currency: "IDR",
    createdAt: new Date("2026-08-28T09:00:00Z"),
    orderNumber: "DAP-2026-0001",
    receiptToken: "tok",
    productTitle: "OJS Restyle Kit 3.3",
    locale: "id",
    receiptSentAt: null,
    product: { translations: [{ locale: "id", slug: "ojs-restyle-kit-3-3" }] },
    ...overrides,
  } as OrderWithProduct;
}

const render = (locale: Locale, overrides: Partial<OrderWithProduct> = {}) =>
  renderToStaticMarkup(
    <Receipt order={order(overrides)} locale={locale} ui={UI[locale]} />,
  );

describe("Receipt", () => {
  it("carries the dikiachmadp.work | Digital Products letterhead", () => {
    const html = render("id");
    expect(html).toContain("dikiachmadp.work");
    expect(html).toContain(UI.id.receipt.brandSuffix);
  });

  it("prints the receipt number, buyer and item", () => {
    const html = render("id");
    expect(html).toContain("DAP-2026-0001");
    expect(html).toContain("buyer@example.com");
    expect(html).toContain("OJS Restyle Kit 3.3");
  });

  /**
   * Polar mengirim setiap nominal dalam satuan terkecil mata uangnya, termasuk
   * rupiah yang di dunia nyata tidak punya sen. Salah membagi di sini
   * menghasilkan tanda terima yang menyatakan angka yang salah — kesalahan
   * paling merusak yang bisa dilakukan dokumen semacam ini.
   */
  it("renders 14_900_000 minor units of IDR as Rp149.000", () => {
    const html = render("id");
    expect(html).toContain("149.000");
    expect(html).not.toContain("14.900.000");
  });

  it("labels a zero-amount order as free rather than a currency zero", () => {
    const html = render("en", { amount: 0, locale: "en" });
    expect(html).toContain(UI.en.receipt.freeLabel);
    expect(html).not.toContain("$0.00");
  });

  /**
   * Polar adalah merchant of record dan dialah yang menerbitkan invoice pajak.
   * Dokumen ini konfirmasi pesanan, bukan invoice — dan itu harus tertulis,
   * bukan tersirat. Test ini yang menjaganya tidak hilang tanpa sengaja.
   */
  it("always discloses that Polar is the merchant of record", () => {
    for (const locale of ["en", "id"] as const) {
      const html = render(locale, { locale });
      expect(html).toContain("Polar Software Inc.");
      expect(html).toContain(UI[locale].receipt.title);
      expect(html).not.toContain("Invoice");
    }
  });

  it("names the product from the snapshot, not the live relation", () => {
    // Produk sudah dihapus: relasinya null, tapi tanda terimanya harus tetap
    // menyebutkan apa yang dibeli.
    const html = render("id", { product: null });
    expect(html).toContain("OJS Restyle Kit 3.3");
  });

  it("falls back to a placeholder when even the snapshot is empty", () => {
    const html = render("id", { productTitle: "", product: null });
    expect(html).toContain(UI.id.receipt.deletedProduct);
  });

  it("links back to the product only while it still exists", () => {
    expect(render("id")).toContain("/id/products/ojs-restyle-kit-3-3");
    expect(render("id", { product: null })).not.toContain("/id/products/");
  });

  /**
   * Tanggal dipancang ke UTC. Tanpa itu, tanda terima yang dibuka dari zona
   * waktu berbeda bisa menyebut tanggal transaksi yang berbeda pula.
   */
  it("pins the document date to UTC", () => {
    expect(render("id")).toContain("28 Agustus 2026");
    expect(render("en", { locale: "en" })).toContain("28 August 2026");
  });
});
