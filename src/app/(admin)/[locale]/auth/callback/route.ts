import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

/**
 * Tempat mendarat untuk semua tautan email Supabase (recovery, magic link,
 * konfirmasi). Tanpa route ini tautan reset password mengarah ke halaman yang
 * tidak ada, sehingga akun yang lupa password tidak bisa dipulihkan sama
 * sekali.
 *
 * Supabase memakai salah satu dari dua bentuk tergantung konfigurasi project:
 * `?code=` (PKCE) atau `?token_hash=&type=` (OTP). Keduanya ditangani.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ locale: string }> },
) {
  const { locale } = await params;
  const { searchParams, origin } = new URL(request.url);

  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? `/${locale}/dashboard`;

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
      `${origin}/${locale}/login?error=${encodeURIComponent(
        "That link is invalid or has expired. Request a new one.",
      )}`,
    );
  }

  return NextResponse.redirect(`${origin}${next}`);
}
