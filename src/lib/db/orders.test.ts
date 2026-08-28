import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    order: {
      upsert: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
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
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
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
});
