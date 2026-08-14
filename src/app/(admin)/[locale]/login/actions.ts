"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/admin-allowlist";
import { env } from "@/lib/env";
import {
  clientIp,
  getLoginEmailLimiter,
  getLoginLimiter,
} from "@/lib/ratelimit";

const THROTTLED = "Too many attempts. Try again in a few minutes.";

export async function login(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const locale = (formData.get("locale") as string) || "en";

  const throttled = () =>
    redirect(`/${locale}/login?error=${encodeURIComponent(THROTTLED)}`);

  const ip = clientIp(await headers());
  const { success: ipAllowed } = await getLoginLimiter().limit(ip);
  if (!ipAllowed) throttled();

  // Batas kedua per akun. Tanpa ini penebak password cukup berpindah IP untuk
  // menghabiskan percobaan sebanyak yang dia mau terhadap satu email.
  if (email) {
    const { success: emailAllowed } = await getLoginEmailLimiter().limit(
      email.toLowerCase(),
    );
    if (!emailAllowed) throttled();
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    // Pesan asli Supabase membedakan "user tidak ada" dari "password salah",
    // jadi jangan diteruskan ke URL — cukup catat di server.
    console.error("Login failed:", error.message);
    redirect(
      `/${locale}/login?error=${encodeURIComponent(
        "Invalid email or password.",
      )}`,
    );
  }

  // requireUser() juga menyaring, tapi menolak di sini berarti sesi non-admin
  // tidak pernah sempat terbit sama sekali.
  if (!isAdminEmail(email, env.ADMIN_EMAILS)) {
    await supabase.auth.signOut();
    redirect(
      `/${locale}/login?error=${encodeURIComponent(
        "This account is not allowed to access the dashboard.",
      )}`,
    );
  }

  redirect(`/${locale}/dashboard`);
}
