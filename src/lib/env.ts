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

const serverSchema = z.object({
  DATABASE_URL: z.string().min(1),
  // Koneksi langsung/session pooler untuk perintah DDL (prisma migrate).
  DIRECT_URL: z.string().min(1).optional(),
  ADMIN_EMAILS: adminEmails,
  RESEND_API_KEY: z.string().min(1),
  RESEND_FROM_EMAIL: z.string().min(1).optional(),
  CONTACT_EMAIL: z.email(),
  UPSTASH_REDIS_REST_URL: z.url(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1),
  // Diset di CI agar generateStaticParams melewati query DB saat build.
  SKIP_DB_STATIC_GEN: z.string().optional(),
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
