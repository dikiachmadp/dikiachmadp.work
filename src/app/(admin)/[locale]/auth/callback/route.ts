import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { safeNext } from "@/lib/safe-redirect";
import { SITE_URL } from "@/lib/site-url";

/**
 * Tempat mendarat untuk semua tautan email Supabase (recovery, magic link,
 * konfirmasi). Tanpa route ini tautan reset password mengarah ke halaman yang
 * tidak ada, sehingga akun yang lupa password tidak bisa dipulihkan sama
 * sekali.
 *
 * Supabase memakai salah satu dari dua bentuk tergantung konfigurasi project:
 * `?code=` (PKCE) atau `?token_hash=&type=` (OTP). Keduanya ditangani.
 *
 * Origin tujuan redirect diambil dari SITE_URL, bukan dari `request.url`.
 * Origin di request berasal dari header `Host` yang dikendalikan pengirim, jadi
 * request dengan Host palsu akan memantulkan pengguna ke domain lain — tepat
 * setelah sesinya menyala dan tepat setelah dia mengikuti tautan dari email
 * yang dia percaya. `safeNext()` sudah mengunci bagian path-nya; ini mengunci
 * bagian origin-nya. Lihat src/lib/site-url.ts, yang ditulis untuk alasan yang
 * persis sama pada tautan reset password.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ locale: string }> },
) {
  const { locale } = await params;
  // Segmen [locale] cocok dengan string apa pun, dan nilainya ikut masuk ke URL
  // redirect di bawah. Sempitkan seperti halaman-halaman lain melakukannya.
  const validLocale = locale === "id" ? "id" : "en";
  const { searchParams } = new URL(request.url);

  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  // `next` datang dari query, jadi tidak boleh dipercaya — lihat safeNext().
  const next = safeNext(searchParams.get("next"), validLocale);

  const supabase = await createClient();

  let failed: string | null = null;

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    failed = error?.message ?? null;
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });
    failed = error?.message ?? null;
  } else {
    failed = "missing-token";
  }

  if (failed) {
    console.error("Auth callback failed:", failed);
    return NextResponse.redirect(
      `${SITE_URL}/${validLocale}/login?error=${encodeURIComponent(
        "That link is invalid or has expired. Request a new one.",
      )}`,
    );
  }

  return NextResponse.redirect(`${SITE_URL}${next}`);
}
