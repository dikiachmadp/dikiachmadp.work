"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getLoginLimiter } from "@/lib/ratelimit";

export async function requestPasswordReset(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const locale = String(formData.get("locale") ?? "en");

  const headerList = await headers();
  const ip = headerList.get("x-forwarded-for") ?? "127.0.0.1";
  const { success } = await getLoginLimiter().limit(`reset:${ip}`);
  if (!success) {
    redirect(
      `/${locale}/forgot-password?error=${encodeURIComponent(
        "Too many attempts. Try again in a few minutes.",
      )}`,
    );
  }

  // Origin dari request, supaya tautan tetap benar di preview maupun produksi.
  const origin =
    headerList.get("origin") ??
    `https://${headerList.get("host") ?? "dikiachmadp.work"}`;

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/${locale}/auth/callback?next=/${locale}/reset-password`,
  });

  if (error) {
    console.error("Password reset request failed:", error.message);
  }

  // Selalu balasan yang sama: apakah sebuah email terdaftar bukan informasi
  // yang boleh bocor ke siapa pun yang mencoba.
  redirect(`/${locale}/forgot-password?sent=1`);
}
