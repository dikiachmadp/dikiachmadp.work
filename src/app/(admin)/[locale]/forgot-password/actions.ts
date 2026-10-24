"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { allowRequest, clientIp, getLoginLimiter } from "@/lib/ratelimit";
import { SITE_URL } from "@/lib/site-url";

export async function requestPasswordReset(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const locale = String(formData.get("locale") ?? "en");

  const headerList = await headers();
  // Jalur ini justru satu-satunya jalan keluar ketika password memang terlupa,
  // jadi ia ikut fail-open: menutupnya saat limiter mati berarti mencabut
  // pintu darurat tepat ketika dibutuhkan.
  const { allowed } = await allowRequest(
    getLoginLimiter(),
    `reset:${clientIp(headerList)}`,
  );
  if (!allowed) {
    redirect(
      `/${locale}/forgot-password?error=${encodeURIComponent(
        "Too many attempts. Try again in a few minutes.",
      )}`,
    );
  }

  // Origin dari environment, bukan dari header `origin`/`host`: header itu ikut
  // dikirim penyerang, jadi `Host` palsu bisa mengarahkan tautan recovery milik
  // korban ke domain lain. Lihat @/lib/site-url.
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${SITE_URL}/${locale}/auth/callback?next=/${locale}/reset-password`,
  });

  if (error) {
    console.error("Password reset request failed:", error.message);
  }

  // Selalu balasan yang sama: apakah sebuah email terdaftar bukan informasi
  // yang boleh bocor ke siapa pun yang mencoba.
  redirect(`/${locale}/forgot-password?sent=1`);
}
