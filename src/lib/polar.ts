import "server-only";
import { Polar } from "@polar-sh/sdk";
import { env } from "@/lib/env";

/**
 * Nominal tip yang ditawarkan panel beli, dalam sen USD.
 *
 * Terendah $3, bukan $1: potongan Polar 5% + $0,50 flat berarti tip $1
 * kehilangan lebih dari separuhnya sebelum sampai. Nol tetap ada karena produk
 * gratis memang harus bisa diambil tanpa membayar apa pun.
 */
export const TIP_PRESETS = [0, 300, 500, 1000] as const;

/**
 * Batas atas nominal bebas, dalam sen ($1.000).
 *
 * Bukan untuk menolak kemurahan hati, tapi supaya angka salah ketik atau
 * payload iseng berhenti di sini alih-alih membuat checkout Polar yang aneh.
 */
export const MAX_TIP_AMOUNT = 100_000;

/**
 * Benar kalau kredensial Polar lengkap.
 *
 * Ketiganya opsional di src/lib/env.ts (lihat catatan di sana), jadi setiap
 * pemakai harus memeriksa sendiri sebelum menyentuh API. Tanpa ini panel beli
 * mati dan produk jatuh balik ke `buyUrl`.
 */
export function isPolarConfigured(): boolean {
  return Boolean(env.POLAR_ACCESS_TOKEN);
}

let client: Polar | undefined;

/**
 * Client Polar yang dibuat malas dan dipakai ulang — pola yang sama dengan
 * `getRedis()` di src/lib/ratelimit.ts. Mengonstruksinya di module scope membuat
 * modul ini melempar saat di-import, jauh dari penyebabnya, dan bisa
 * menggagalkan build di lingkungan yang memang tidak punya kredensial (CI).
 *
 * Melempar kalau dipanggil tanpa token; panggil `isPolarConfigured()` dulu.
 */
export function getPolar(): Polar {
  const accessToken = env.POLAR_ACCESS_TOKEN;
  if (!accessToken) {
    throw new Error("POLAR_ACCESS_TOKEN belum diset");
  }
  client ??= new Polar({ accessToken, server: env.POLAR_SERVER });
  return client;
}
