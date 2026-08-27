import { NextResponse } from "next/server";
import { z } from "zod";
import { getProductBySlug } from "@/lib/db/products";
import { getPolar, isPolarConfigured, MAX_TIP_AMOUNT } from "@/lib/polar";
import { clientIp, getCheckoutLimiter } from "@/lib/ratelimit";
import { SITE_URL } from "@/lib/site-url";

const CheckoutRequestSchema = z.object({
  slug: z.string().min(1).max(200),
  locale: z.enum(["en", "id"]),
  /**
   * Sen. Hanya berarti untuk produk pay-what-you-want; diabaikan diam-diam
   * kalau produknya berharga tetap, supaya klien yang basi tidak jadi error.
   */
  amount: z.number().int().min(0).max(MAX_TIP_AMOUNT).optional(),
});

/**
 * Route handler tidak punya batas ukuran body bawaan — `bodySizeLimit` di
 * next.config.ts hanya berlaku untuk server action. Payload sah di sini paling
 * banyak sekitar 250 byte; 2 KB memberi kelonggaran besar sambil tetap menutup
 * body megabyte-an sebelum sempat diurai. Alasan lengkapnya ada di
 * src/app/api/contact/route.ts.
 */
const MAX_BODY_BYTES = 2 * 1024;

function isBodyTooLarge(headers: Headers): boolean {
  const length = Number(headers.get("content-length"));
  return !Number.isFinite(length) || length <= 0 || length > MAX_BODY_BYTES;
}

export async function POST(request: Request) {
  if (!isPolarConfigured()) {
    // Bukan 500: konfigurasi yang belum lengkap bukan kerusakan, dan panel beli
    // di klien memang sudah siap jatuh balik ke tautan toko eksternal.
    return NextResponse.json(
      { error: "Checkout is not available." },
      { status: 503 },
    );
  }

  const { success } = await getCheckoutLimiter().limit(
    clientIp(request.headers),
  );
  if (!success) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 },
    );
  }

  if (isBodyTooLarge(request.headers)) {
    return NextResponse.json({ error: "Payload too large." }, { status: 413 });
  }

  try {
    const validation = CheckoutRequestSchema.safeParse(await request.json());
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input data" },
        { status: 400 },
      );
    }

    const { slug, locale, amount } = validation.data;

    /**
     * Produk dicari dari database, dan `polarProductId` diambil dari baris itu
     * — tidak pernah dari body request. Kalau klien boleh menyebut produk Polar
     * mana pun, siapa saja bisa membuka checkout produk berbayar orang lain
     * lewat endpoint ini.
     */
    const product = await getProductBySlug(locale, slug);
    if (!product?.polarProductId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    /**
     * `amount` hanya diteruskan untuk produk pay-what-you-want. Mengirimnya ke
     * produk berharga tetap membuat Polar menolak seluruh sesi, jadi lebih baik
     * dijatuhkan diam-diam di sini.
     */
    const tip =
      product.pwywEnabled && amount !== undefined
        ? Math.max(amount, product.pwywMinAmount)
        : undefined;

    const checkout = await getPolar().checkouts.create({
      products: [product.polarProductId],
      ...(tip !== undefined && { amount: tip }),
      /**
       * Wajib supaya iframe checkout boleh dipasang di halaman ini; host-nya
       * juga harus di-allowlist di Polar > Settings > Preferences > Embedding.
       */
      embedOrigin: SITE_URL,
      // {CHECKOUT_ID} disubstitusi Polar saat pembeli diarahkan balik.
      successUrl: `${SITE_URL}/${locale}/products/${slug}/thanks?checkout_id={CHECKOUT_ID}`,
      metadata: { productId: product.id, locale },
    });

    return NextResponse.json({ url: checkout.url }, { status: 200 });
  } catch (error) {
    console.error("Failed to create checkout session:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 },
    );
  }
}
