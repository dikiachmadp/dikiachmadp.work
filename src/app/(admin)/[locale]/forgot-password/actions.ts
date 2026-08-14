"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { clientIp, getLoginLimiter } from "@/lib/ratelimit";
import { SITE_URL } from "@/lib/site-url";

export async function requestPasswordReset(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const locale = String(formData.get("locale") ?? "en");

  const headerList = await headers();
  const { success } = await getLoginLimiter().limit(
    `reset:${clientIp(headerList)}`,
  );
  if (!success) {
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
