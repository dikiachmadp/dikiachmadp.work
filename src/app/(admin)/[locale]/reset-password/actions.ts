"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function updatePassword(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  const locale = String(formData.get("locale") ?? "en");

  const fail = (message: string) =>
    redirect(`/${locale}/reset-password?error=${encodeURIComponent(message)}`);

  if (password.length < 8) {
    fail("Password must be at least 8 characters.");
  }
  if (password !== confirm) {
    fail("The two passwords do not match.");
  }

  const supabase = await createClient();

  // Sesi di sini berasal dari tautan recovery yang sudah ditukar di
  // /auth/callback; tanpa sesi itu updateUser akan ditolak Supabase.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    fail("Your reset link has expired. Request a new one.");
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    console.error("Password update failed:", error.message);
    fail(error.message);
  }

  redirect(`/${locale}/dashboard`);
}
