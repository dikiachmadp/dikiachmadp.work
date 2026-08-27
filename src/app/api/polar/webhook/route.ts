import { Webhooks } from "@polar-sh/nextjs";
import { NextResponse } from "next/server";
import { Resend } from "resend";
import { env } from "@/lib/env";
import { recordOrder } from "@/lib/db/orders";

/**
 * Endpoint webhook Polar, berlangganan `order.paid`.
 *
 * Adapter `Webhooks` yang memverifikasi tanda tangan atas body mentah — itu
 * sebabnya route ini tidak boleh membaca `request.json()` sendiri. Matcher di
 * src/proxy.ts sudah mengecualikan /api, jadi request ini tidak lewat
 * middleware auth.
 */

function sanitizeHtml(str: string): string {
  return str.replace(/[<>&"']/g, (char) => {
    switch (char) {
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case "&":
        return "&amp;";
      case '"':
        return "&quot;";
      case "'":
        return "&#39;";
      default:
        return char;
    }
  });
}

async function notify(email: string, amount: number, currency: string) {
  const resend = new Resend(env.RESEND_API_KEY);
  const fromAddress =
    env.RESEND_FROM_EMAIL || "Portfolio Contact Form <onboarding@resend.dev>";

  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount / 100);

  const { error } = await resend.emails.send({
    from: fromAddress,
    to: env.CONTACT_EMAIL,
    subject:
      amount > 0
        ? `New order: ${formatted}`
        : "New order: free download claimed",
    html: `
        <div style="font-family: sans-serif; line-height: 1.6; color: #333;">
          <h2>Someone bought something</h2>
          <p><strong>Amount:</strong> ${formatted}</p>
          <p><strong>Buyer:</strong> ${email ? sanitizeHtml(email) : "(no email on the order)"}</p>
          <p>Polar handles the file delivery — nothing to do here.</p>
        </div>
      `,
  });

  if (error) throw new Error(error.message);
}

const handler = Webhooks({
  webhookSecret: env.POLAR_WEBHOOK_SECRET ?? "",
  onOrderPaid: async ({ data }) => {
    /**
     * `email` opsional di model SDK karena tipe pelanggannya dipakai bersama
     * konteks lain; order yang benar-benar dibayar selalu punya alamat. String
     * kosong dipilih daripada kolom nullable supaya pembaca nanti tidak perlu
     * membedakan "belum ada" dari "tidak pernah ada" — kalau sampai kosong,
     * email notifikasinya yang akan mengatakannya.
     */
    const email = data.customer.email ?? "";

    /**
     * Dua jalur yang sengaja dibuat mandiri, sama seperti route kontak: catatan
     * transaksi tidak boleh hilang hanya karena email notifikasi gagal, dan
     * sebaliknya. Keduanya menelan error, karena melempar dari sini membuat
     * Polar mengulang webhook yang sebenarnya sudah tercatat.
     */
    try {
      await recordOrder({
        polarOrderId: data.id,
        polarCheckoutId: data.checkoutId ?? null,
        productId:
          typeof data.metadata?.productId === "string"
            ? data.metadata.productId
            : null,
        email,
        amount: data.totalAmount,
        currency: data.currency,
      });
    } catch (error) {
      console.error("Order not stored:", error);
    }

    try {
      await notify(email, data.totalAmount, data.currency);
    } catch (error) {
      console.error("Order notification email failed:", error);
    }
  },
});

export async function POST(request: Request) {
  if (!env.POLAR_WEBHOOK_SECRET) {
    // Tanpa secret, tanda tangan tidak bisa diverifikasi. Menerima payload apa
    // adanya berarti siapa pun bisa mengarang order; menolak lebih aman.
    return NextResponse.json(
      { error: "Webhook is not configured." },
      { status: 503 },
    );
  }
  return handler(request as Parameters<typeof handler>[0]);
}
