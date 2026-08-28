import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/env", () => ({
  env: {
    RESEND_API_KEY: "re_test",
    RESEND_FROM_EMAIL: "dikiachmadp.work <hi@dikiachmadp.work>",
    CONTACT_EMAIL: "owner@example.com",
  },
}));
vi.mock("@/lib/site-url", () => ({ SITE_URL: "https://dikiachmadp.work" }));

const send = vi.fn().mockResolvedValue({ error: null });
vi.mock("resend", () => ({
  Resend: class {
    emails = { send };
  },
}));

import { sendReceiptEmail, type ReceiptEmailOrder } from "@/lib/emails/receipt";

function order(overrides: Partial<ReceiptEmailOrder> = {}): ReceiptEmailOrder {
  return {
    email: "buyer@example.com",
    locale: "id",
    orderNumber: "DAP-2026-0001",
    receiptToken: "abc123",
    productTitle: "OJS Restyle Kit 3.3",
    amount: 14_900_000,
    currency: "IDR",
    ...overrides,
  };
}

const payload = () => send.mock.calls[0][0];

beforeEach(() => {
  vi.clearAllMocks();
  send.mockResolvedValue({ error: null });
});

describe("sendReceiptEmail", () => {
  it("puts the receipt number in the subject", async () => {
    await sendReceiptEmail(order());
    expect(payload().subject).toContain("DAP-2026-0001");
  });

  it("links to the receipt in the buyer's own language", async () => {
    await sendReceiptEmail(order());
    expect(payload().html).toContain(
      "https://dikiachmadp.work/id/orders/abc123",
    );

    vi.clearAllMocks();
    await sendReceiptEmail(order({ locale: "en" }));
    expect(payload().html).toContain(
      "https://dikiachmadp.work/en/orders/abc123",
    );
  });

  /** Bahasa yang tidak dikenal tidak boleh menggagalkan tanda terima. */
  it("falls back to English for an unknown locale", async () => {
    await sendReceiptEmail(order({ locale: "de" }));
    expect(payload().html).toContain("/en/orders/abc123");
  });

  /**
   * Email HTML dirangkai dengan tangan — tidak ada React yang meloloskan
   * interpolasi dengan sendirinya. Judul produk berasal dari basis data dan
   * bisa berisi apa saja.
   */
  it("escapes untrusted text before it reaches the HTML body", async () => {
    await sendReceiptEmail(
      order({ productTitle: '<script>alert("x")</script>' }),
    );
    const { html } = payload();
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("renders IDR minor units as rupiah, not as hundreds of millions", async () => {
    await sendReceiptEmail(order());
    expect(payload().html).toContain("149.000");
  });

  it("says free rather than a currency zero for a free download", async () => {
    await sendReceiptEmail(order({ amount: 0, locale: "en" }));
    expect(payload().html).toContain("Free");
  });

  it("replies to the owner so questions do not vanish", async () => {
    await sendReceiptEmail(order());
    expect(payload().replyTo).toBe("owner@example.com");
  });

  /**
   * Polar tidak selalu menyertakan alamat pelanggan. Itu bukan kondisi galat —
   * tidak ada yang bisa dikirimi, dan webhook tidak boleh menganggapnya gagal.
   */
  it("reports not-sent instead of throwing when there is no address", async () => {
    const result = await sendReceiptEmail(order({ email: "" }));
    expect(result.sent).toBe(false);
    expect(send).not.toHaveBeenCalled();
  });

  /** Kegagalan Resend harus terlihat pemanggilnya, bukan ditelan diam-diam. */
  it("throws when Resend rejects", async () => {
    send.mockResolvedValue({ error: { message: "domain not verified" } });
    await expect(sendReceiptEmail(order())).rejects.toThrow(
      "domain not verified",
    );
  });
  /**
   * `onboarding@resend.dev` adalah alamat sandbox yang hanya boleh mengirim ke
   * pemilik akun Resend. Memakainya untuk tanda terima berarti kiriman ke
   * pembeli pasti ditolak — dan merek yang tampil bukan merek yang dimaksud.
   */
  it("refuses to send from the Resend sandbox address", async () => {
    const { env } = await import("@/lib/env");
    const original = env.RESEND_FROM_EMAIL;
    (env as { RESEND_FROM_EMAIL?: string }).RESEND_FROM_EMAIL = "";

    const result = await sendReceiptEmail(order());

    expect(result).toMatchObject({ sent: false, reason: "no-sender" });
    expect(send).not.toHaveBeenCalled();
    (env as { RESEND_FROM_EMAIL?: string }).RESEND_FROM_EMAIL = original;
  });
});
