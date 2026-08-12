import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Gerbang auth untuk halaman & server action admin. getUser() memvalidasi
// token ke Supabase Auth (bukan sekadar membaca cookie).
export async function requireUser(locale: string = "en") {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/login`);
  }

  return user;
}
