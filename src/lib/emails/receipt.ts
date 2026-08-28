import "server-only";
import { Resend } from "resend";
import { env } from "@/lib/env";
import { getDictionary } from "@/lib/dictionary";
import { SITE_URL } from "@/lib/site-url";
import { escapeHtml } from "@/lib/emails/escape";
import { fill, formatCents } from "@/lib/utils";
import type { Locale } from "@/types/content";

/**
 * Email tanda terima untuk pembeli.
 *
 * Ini yang membuat sebuah transaksi meninggalkan jejak atas nama
 * dikiachmadp.work: sebelum ini pembeli hanya menerima email otomatis Polar,
 * dan pemilik situs satu-satunya yang mendapat pemberitahuan.
 *
 * CSS-nya ditulis inline dan warnanya literal, bukan lewat token tema. Klien
 * email tidak bisa diandalkan untuk custom property maupun `<style>`, dan sama
 * sekali tidak untuk Google Fonts — jadi tampilannya *mendekati* bahasa visual
 * situs (kertas hangat, tinta gelap, satu aksen teal, tepi tegas) dengan
 * tumpukan font sistem, bukan menirunya persis. Dokumen yang persis ada di
 * halaman tanda terima, dan ke sanalah tombolnya menuju.
 */

const PAPER = "#fbfaf6";
const INK = "#16150f";
const SOFT = "#6e6c62";
const ACCENT = "#0d7c6f";
const FONT =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

export type ReceiptEmailOrder = {
  email: string;
  locale: string;
  orderNumber: string;
  receiptToken: string;
  productTitle: string;
  amount: number;
  currency: string;
};

function buildHtml(
  order: ReceiptEmailOrder,
  locale: Locale,
  t: Awaited<ReturnType<typeof getDictionary>>["ui"]["receipt"],
): string {
  const url = `${SITE_URL}/${locale}/orders/${order.receiptToken}`;
  const item = order.productTitle || t.deletedProduct;
  const total =
    order.amount > 0
      ? formatCents(order.amount, order.currency, locale)
      : t.freeLabel;

  return `
<div style="margin:0;padding:24px;background:${PAPER};font-family:${FONT};color:${INK};line-height:1.6;">
  <div style="max-width:560px;margin:0 auto;border:2px solid ${INK};background:${PAPER};padding:28px;">
    <div style="font-size:20px;font-weight:700;letter-spacing:-0.01em;">dikiachmadp.work</div>
    <div style="font-size:13px;color:${ACCENT};font-weight:700;margin-bottom:22px;">| ${escapeHtml(t.brandSuffix)}</div>

    <h1 style="margin:0 0 10px;font-size:22px;font-weight:700;">${escapeHtml(t.emailHeading)}</h1>
    <p style="margin:0 0 22px;font-size:14px;color:${SOFT};">${escapeHtml(t.emailBody)}</p>

    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;font-size:14px;">
      <tr>
        <td style="padding:8px 0;border-bottom:1px dashed ${SOFT};color:${SOFT};">${escapeHtml(t.numberLabel)}</td>
        <td style="padding:8px 0;border-bottom:1px dashed ${SOFT};text-align:right;font-weight:700;">${escapeHtml(order.orderNumber)}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;border-bottom:1px dashed ${SOFT};color:${SOFT};">${escapeHtml(t.itemLabel)}</td>
        <td style="padding:8px 0;border-bottom:1px dashed ${SOFT};text-align:right;font-weight:700;">${escapeHtml(item)}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;color:${SOFT};">${escapeHtml(t.totalLabel)}</td>
        <td style="padding:8px 0;text-align:right;font-weight:700;font-size:17px;">${escapeHtml(total)}</td>
      </tr>
    </table>

    <div style="margin:26px 0 20px;">
      <a href="${url}" style="display:inline-block;background:${ACCENT};color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;padding:13px 26px;border:2px solid ${INK};">${escapeHtml(t.emailCta)}</a>
    </div>

    <p style="margin:0 0 8px;font-size:12px;color:${SOFT};">${escapeHtml(t.deliveryNote)}</p>
    <p style="margin:0;font-size:12px;color:${SOFT};">${escapeHtml(t.paymentNote)}</p>
  </div>

  <p style="max-width:560px;margin:14px auto 0;font-size:11px;color:${SOFT};text-align:center;">${escapeHtml(t.emailFooter)}</p>
</div>`;
}

/**
 * Melempar kalau Resend menolak. Pemanggilnya (webhook) yang memutuskan apa
 * artinya kegagalan itu — di sana kegagalan email sengaja tidak menggagalkan
 * pencatatan transaksinya.
 */
export async function sendReceiptEmail(order: ReceiptEmailOrder) {
  // Order tanpa alamat tidak bisa dikirimi apa pun. Bukan kesalahan: kolomnya
  // memang bisa kosong kalau Polar tidak menyertakan email pelanggan.
  if (!order.email) return { sent: false as const, reason: "no-address" };

  /**
   * Tidak ada jatuh-balik ke `onboarding@resend.dev` di sini, berbeda dari
   * email pemberitahuan pemilik di route webhook.
   *
   * Alamat bawaan Resend itu alamat sandbox: ia hanya boleh mengirim ke
   * pemilik akun Resend-nya sendiri. Pemberitahuan pemilik memang ditujukan ke
   * sana, jadi ia lolos; tanda terima ditujukan ke pembeli, jadi ia akan
   * ditolak — dan seandainya lolos sekalipun, tanda terima "bermerek" yang
   * datang dari onboarding@resend.dev justru merusak hal yang ingin
   * dibangunnya. Lebih baik berhenti di sini dengan alasan yang jelas: baris
   * ordernya tetap tak bertanda kirim, dan dasbor menampilkannya sebagai
   * "not sent" sampai domainnya diverifikasi dan RESEND_FROM_EMAIL diisi.
   */
  if (!env.RESEND_FROM_EMAIL) {
    console.error(
      "RESEND_FROM_EMAIL belum diset; tanda terima tidak dikirim ke pembeli.",
    );
    return { sent: false as const, reason: "no-sender" };
  }

  const locale = (order.locale === "id" ? "id" : "en") as Locale;
  const dict = await getDictionary(locale);
  const t = dict.ui.receipt;

  const resend = new Resend(env.RESEND_API_KEY);
  const { error } = await resend.emails.send({
    from: env.RESEND_FROM_EMAIL || "dikiachmadp.work <onboarding@resend.dev>",
    to: order.email,
    // Alamat pemilik ikut dibalas kalau pembeli menekan "reply" — pertanyaan
    // soal pesanan tidak boleh mendarat di kotak surat yang tidak dibaca.
    replyTo: env.CONTACT_EMAIL,
    subject: fill(t.emailSubject, { number: order.orderNumber }),
    html: buildHtml(order, locale, t),
  });

  if (error) throw new Error(error.message);
  return { sent: true as const, reason: "ok" };
}
