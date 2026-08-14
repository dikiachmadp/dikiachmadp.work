import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/admin-allowlist";
import { env } from "@/lib/env";

const NOT_ADMIN = "This account is not allowed to access the dashboard.";

// Gerbang auth untuk halaman & server action admin. getUser() memvalidasi
// token ke Supabase Auth (bukan sekadar membaca cookie). Sesi yang valid saja
// tidak cukup: akun harus ada di ADMIN_EMAILS — lihat @/lib/admin-allowlist.
export async function requireUser(locale: string = "en") {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/login`);
  }

  if (!isAdminEmail(user.email, env.ADMIN_EMAILS)) {
    // Buang sesinya, jangan cuma tolak: tanpa ini akun non-admin tetap
    // memegang cookie yang valid dan bisa mencoba jalur lain.
    await supabase.auth.signOut();
    redirect(`/${locale}/login?error=${encodeURIComponent(NOT_ADMIN)}`);
  }

  return user;
}
