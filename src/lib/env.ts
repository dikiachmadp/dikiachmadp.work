import "server-only";
import { z } from "zod";
import { parseAdminEmails } from "@/lib/admin-allowlist";

// Daftar email yang boleh masuk dasbor, dipisah koma. Punya akun Supabase saja
// tidak cukup: anon key ada di bundle browser, jadi tanpa allowlist ini siapa
// pun yang berhasil mendaftar otomatis jadi admin.
const adminEmails = z
  .string()
  .transform(parseAdminEmails)
  .refine((emails) => emails.length > 0, "Minimal satu email admin");

/**
 * Opsional yang benar-benar opsional.
 *
 * `z.string().min(1).optional()` saja tidak cukup: `.optional()` hanya
 * memaafkan `undefined`, sedangkan variabel yang ditulis tanpa nilai
 * (`POLAR_ACCESS_TOKEN=`) sampai ke sini sebagai string kosong dan jatuh di
 * `.min(1)`. Karena skema ini melempar saat di-import, satu baris kosong hasil
 * menyalin .env.example akan menjatuhkan seluruh situs — persis kebalikan dari
 * yang dimaksud "opsional". String kosong di sini berarti "tidak diset".
 */
const optionalString = z
  .string()
  .optional()
  .transform((value) => (value?.trim() ? value : undefined));

const serverSchema = z.object({
  DATABASE_URL: z.string().min(1),
  // Koneksi langsung/session pooler untuk perintah DDL (prisma migrate).
  DIRECT_URL: optionalString,
  ADMIN_EMAILS: adminEmails,
  RESEND_API_KEY: z.string().min(1),
  RESEND_FROM_EMAIL: optionalString,
  CONTACT_EMAIL: z.email(),
  UPSTASH_REDIS_REST_URL: z.url(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1),
  // Diset di CI agar generateStaticParams melewati query DB saat build.
  SKIP_DB_STATIC_GEN: z.string().optional(),

  // --- Polar (checkout on-site) ---
  //
  // Sengaja opsional, tidak seperti kredensial di atas. Skema ini melempar saat
  // di-import, jadi menjadikannya wajib berarti satu variabel yang lupa diset di
  // Vercel menjatuhkan seluruh situs demi satu panel di halaman produk. Yang
  // memutuskan sendiri adalah route checkout dan webhook, lewat
  // `isPolarConfigured()` di src/lib/polar.ts — tanpa ketiganya panel beli mati,
  // sisa situs tetap normal.
  POLAR_ACCESS_TOKEN: optionalString,
  POLAR_WEBHOOK_SECRET: optionalString,
  // Default production: sandbox harus dipilih secara sadar, bukan kebetulan.
  POLAR_SERVER: optionalString.pipe(
    z.enum(["sandbox", "production"]).default("production"),
  ),
});

// Integrasi Supabase–Vercel menyuntikkan POSTGRES_* dan tidak pernah membuat
// DATABASE_URL/DIRECT_URL. Terima keduanya supaya kredensial tidak perlu
// disalin dua kali (salinan manual jadi basi begitu integrasi merotasinya).
// Nama milik kita menang, jadi .env lokal tetap berkuasa.
const parsed = serverSchema.safeParse({
  ...process.env,
  DATABASE_URL: process.env.DATABASE_URL ?? process.env.POSTGRES_PRISMA_URL,
  DIRECT_URL: process.env.DIRECT_URL ?? process.env.POSTGRES_URL_NON_POOLING,
});

if (!parsed.success) {
  const detail = parsed.error.issues
    .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
    .join("\n");
  throw new Error(
    `Variabel environment server tidak valid atau belum lengkap (lihat .env.example):\n${detail}`,
  );
}

export const env = parsed.data;
