/**
 * Allowlist admin dasbor.
 *
 * `NEXT_PUBLIC_SUPABASE_ANON_KEY` ikut ter-bundle ke browser (memang harus),
 * jadi "punya sesi Supabase" bukan bukti kewenangan: siapa pun yang berhasil
 * mendaftar akan lolos pemeriksaan sesi. Kewenangan ditentukan di sini.
 *
 * Modul ini sengaja bebas dependensi dan tanpa `server-only` supaya bisa
 * dipakai middleware (`src/proxy.ts`) maupun kode server biasa.
 */

export function parseAdminEmails(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

/** Allowlist kosong berarti tidak ada yang berwenang — gagal tertutup. */
export function isAdminEmail(
  email: string | null | undefined,
  allowlist: readonly string[],
): boolean {
  if (!email || allowlist.length === 0) return false;
  return allowlist.includes(email.trim().toLowerCase());
}
