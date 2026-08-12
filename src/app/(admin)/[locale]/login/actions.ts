"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getLoginLimiter } from "@/lib/ratelimit";

export async function login(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const locale = (formData.get("locale") as string) || "en";

  const ip = (await headers()).get("x-forwarded-for") ?? "127.0.0.1";
  const { success } = await getLoginLimiter().limit(ip);
  if (!success) {
    redirect(
      `/${locale}/login?error=${encodeURIComponent(
        "Too many attempts. Try again in a few minutes.",
      )}`,
    );
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

  redirect(`/${locale}/dashboard`);
}
