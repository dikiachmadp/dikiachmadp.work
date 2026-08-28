import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    order: {
      upsert: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
    digitalProductTranslation: {
      findMany: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/prisma";
import { recordOrder, type RecordOrderInput } from "@/lib/db/orders";

function input(overrides: Partial<RecordOrderInput> = {}): RecordOrderInput {
  return {
    polarOrderId: "ord_1",
    polarCheckoutId: "chk_1",
    productId: "p1",
    email: "buyer@example.com",
    amount: 500,
    currency: "USD",
    locale: "id",
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(prisma.digitalProductTranslation.findMany).mockResolvedValue([
    { locale: "en", title: "OJS Restyle Kit 3.3" },
    { locale: "id", title: "OJS Restyle Kit 3.3 (ID)" },
  ] as never);
});

describe("recordOrder", () => {
  /**
   * Inti idempotensinya: Polar menjamin pengiriman *setidaknya* sekali, jadi
   * event yang sama wajar datang dua kali. `create` akan melempar unique
   * violation di percobaan kedua dan membuat Polar mengulang selamanya.
   */
  it("keys on polarOrderId so a replayed webhook cannot duplicate the row", async () => {
    await recordOrder(input());

    expect(prisma.order.upsert).toHaveBeenCalledTimes(1);
    const call = vi.mocked(prisma.order.upsert).mock.calls[0][0];
    expect(call.where).toEqual({ polarOrderId: "ord_1" });
  });

  it("does not repeat polarOrderId in the update payload", async () => {
    await recordOrder(input());

    const call = vi.mocked(prisma.order.upsert).mock.calls[0][0];
    // Menulis ulang kunci uniknya tidak ada gunanya dan bisa membingungkan
    // pembaca berikutnya; sisa kolomnya sengaja tetap ditulis supaya koreksi
    // dari Polar ikut masuk.
    expect(call.update).not.toHaveProperty("polarOrderId");
    expect(call.update).toMatchObject({ amount: 500, currency: "USD" });
  });

  it("stores a free download as amount 0", async () => {
    await recordOrder(input({ amount: 0 }));

    const call = vi.mocked(prisma.order.upsert).mock.calls[0][0];
    expect(call.create).toMatchObject({ amount: 0 });
  });

  /**
   * Polar mengirim `idr`/`usd`, sementara kolom yang sama di DigitalProduct
   * berisi huruf besar. Dua ejaan untuk satu mata uang akan memecah laporan
   * pemasukan nanti.
   */
  it("normalises the currency Polar sends to upper case", async () => {
    await recordOrder(input({ currency: "idr", amount: 14_900_000 }));

    const call = vi.mocked(prisma.order.upsert).mock.calls[0][0];
    expect(call.create).toMatchObject({ currency: "IDR" });
    // Juga di cabang update, kalau tidak webhook yang diulang justru
    // mengembalikan ejaan huruf kecilnya.
    expect(call.update).toMatchObject({ currency: "IDR" });
  });

  it("accepts an order that is not tied to a known product", async () => {
    await recordOrder(input({ productId: null }));

    const call = vi.mocked(prisma.order.upsert).mock.calls[0][0];
    expect(call.create).toMatchObject({ productId: null });
  });
  /**
   * Nomor dan token tanda terima diisi DEFAULT di basis data, bukan di sini.
   * Kalau salah satunya sampai muncul di payload — cabang mana pun — webhook
   * yang diulang bisa menerbitkan ulang token, dan tautan tanda terima yang
   * sudah ada di kotak masuk pembeli langsung mati.
   */
  it("never writes the receipt number or token itself", async () => {
    await recordOrder(input());

    const call = vi.mocked(prisma.order.upsert).mock.calls[0][0];
    for (const payload of [call.create, call.update]) {
      expect(payload).not.toHaveProperty("orderNumber");
      expect(payload).not.toHaveProperty("receiptToken");
    }
  });

  /**
   * Judul produk dan bahasa dokumen adalah potret keadaan saat transaksi.
   * Menulisnya ulang saat webhook diulang berarti tanda terima yang sudah
   * dikirim berubah isinya kalau judul produknya sejak itu diganti.
   */
  it("writes the product title and locale snapshot only when the row is created", async () => {
    await recordOrder(input());

    const call = vi.mocked(prisma.order.upsert).mock.calls[0][0];
    expect(call.create).toMatchObject({
      productTitle: "OJS Restyle Kit 3.3 (ID)",
      locale: "id",
    });
    expect(call.update).not.toHaveProperty("productTitle");
    expect(call.update).not.toHaveProperty("locale");
  });

  it("falls back to any translation when the buyer's language is missing", async () => {
    vi.mocked(prisma.digitalProductTranslation.findMany).mockResolvedValue([
      { locale: "en", title: "English only" },
    ] as never);

    await recordOrder(input({ locale: "id" }));

    const call = vi.mocked(prisma.order.upsert).mock.calls[0][0];
    // Judul dalam bahasa yang keliru masih jauh lebih baik daripada tanda
    // terima yang tidak menyebutkan barang apa pun.
    expect(call.create).toMatchObject({ productTitle: "English only" });
  });

  it("records an empty product title when the order has no product", async () => {
    await recordOrder(input({ productId: null }));

    const call = vi.mocked(prisma.order.upsert).mock.calls[0][0];
    expect(call.create).toMatchObject({ productTitle: "" });
    // Tidak ada gunanya menanyakan terjemahan produk yang tidak ada.
    expect(prisma.digitalProductTranslation.findMany).not.toHaveBeenCalled();
  });
});
