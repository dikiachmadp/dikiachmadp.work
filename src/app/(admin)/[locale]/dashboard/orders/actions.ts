"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/supabase/auth";
import { getOrderById, markReceiptSent } from "@/lib/db/orders";
import { sendReceiptEmail } from "@/lib/emails/receipt";
import { pageQuery } from "@/lib/pagination";

/**
 * Kirim ulang tanda terima.
 *
 * Jalur pemulihan untuk satu-satunya cara tanda terima bisa hilang: webhook
 * tercatat tapi Resend menolak. Karena `receiptSentAt` baru ditandai setelah
 * pengiriman berhasil, kolom kosong di daftar pesanan adalah tanda persis
 * kapan tombol ini perlu ditekan.
 *
 * Tidak ada penjaga "sudah pernah dikirim" di sini: kalau admin menekannya,
 * memang itu yang diminta — pembeli yang kehilangan emailnya pun tetap perlu
 * dilayani.
 */
export async function resendReceiptAction(id: string, formData: FormData) {
  const locale = (formData.get("formLocale") as string) || "en";
  await requireUser(locale);

  const order = await getOrderById(id);
  if (order) {
    await sendReceiptEmail(order);
    await markReceiptSent(order.id);
  }

  redirect(`/${locale}/dashboard/orders${pageQuery(formData.get("page"))}`);
}
