import { NextResponse } from "next/server";
import { Resend } from "resend";
import { z } from "zod";
import { env } from "@/lib/env";
import { createContactSubmission } from "@/lib/db/contact";
import { clientIp, getContactLimiter } from "@/lib/ratelimit";

const ContactRequestSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  email: z.string().email("Invalid email address"),
  subject: z.string().max(300).optional().default("No Subject"),
  message: z.string().min(1, "Message is required").max(5000),
  // Honeypot: field ini disembunyikan dari manusia di ContactForm, jadi hanya
  // bot pengisi-semua-field yang mengirimnya terisi.
  website: z.string().optional(),
});

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

export async function POST(request: Request) {
  const { success } = await getContactLimiter().limit(
    clientIp(request.headers),
  );
  if (!success) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 },
    );
  }

  try {
    const body = await request.json();

    const validation = ContactRequestSchema.safeParse(body);
    if (!validation.success) {
      // Detail isu Zod membocorkan bentuk schema tanpa menolong pengirim yang
      // sah — form sudah memvalidasi sendiri di klien.
      return NextResponse.json(
        { error: "Invalid input data" },
        { status: 400 },
      );
    }

    const { name, email, subject, message, website } = validation.data;

    // Balas seperti berhasil supaya bot tidak belajar bahwa jebakannya ketahuan.
    if (website) {
      return NextResponse.json(
        { message: "Message sent successfully!" },
        { status: 200 },
      );
    }

    // Dua jalur yang sengaja dibuat mandiri: pesan hanya benar-benar hilang
    // kalau keduanya gagal. Database punya try sendiri karena Supabase free
    // tier berhenti setelah ~7 hari tidak aktif (lihat docs/operations.md) —
    // sebelumnya kegagalan di sini jatuh ke catch luar sebagai 500 dan email
    // notifikasinya tidak pernah sempat terkirim.
    let stored = true;
    try {
      await createContactSubmission({ name, email, subject, message });
    } catch (error) {
      stored = false;
      console.error("Contact submission not stored:", error);
    }

    const safeName = sanitizeHtml(name);
    const safeEmail = sanitizeHtml(email);
    const safeSubject = sanitizeHtml(subject);
    const safeMessage = sanitizeHtml(message);

    const resend = new Resend(env.RESEND_API_KEY);
    const fromAddress =
      env.RESEND_FROM_EMAIL || "Portfolio Contact Form <onboarding@resend.dev>";

    // Kegagalan email tidak boleh membuat pengirim mengira pesannya tidak
    // terkirim selama barisnya sudah tersimpan, jadi ditangani terpisah.
    let delivered = true;
    try {
      await sendNotification({
        resend,
        fromAddress,
        safeName,
        safeEmail,
        safeSubject,
        safeMessage,
        // Tanpa penanda ini sebuah pesan yang gagal disimpan tampak biasa saja
        // di inbox, padahal email itulah satu-satunya salinan yang tersisa.
        unstored: !stored,
      });
    } catch (error) {
      delivered = false;
      console.error("Contact notification email failed:", error);
    }

    // Kedua jalur gagal: pesannya benar-benar hilang, jadi jangan katakan
    // berhasil — biar pengirim tahu dan bisa menghubungi lewat jalur lain.
    if (!stored && !delivered) {
      return NextResponse.json(
        { error: "An unexpected error occurred." },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { message: "Message sent successfully!" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Failed to handle contact submission:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 },
    );
  }
}

async function sendNotification({
  resend,
  fromAddress,
  safeName,
  safeEmail,
  safeSubject,
  safeMessage,
  unstored,
}: {
  resend: Resend;
  fromAddress: string;
  safeName: string;
  safeEmail: string;
  safeSubject: string;
  safeMessage: string;
  unstored: boolean;
}) {
  const warning = unstored
    ? `<p style="border: 2px solid #b91c1c; padding: 10px; color: #b91c1c;">
         <strong>Not saved to the database.</strong> This email is the only
         copy — it will not appear in the dashboard inbox.
       </p>`
    : "";

  const { error } = await resend.emails.send({
    from: fromAddress,
    to: env.CONTACT_EMAIL,
    subject: `New Contact Inquiry: ${safeSubject}`,
    html: `
        <div style="font-family: sans-serif; line-height: 1.6; color: #333;">
          <h2>New Message from Your Portfolio</h2>
          ${warning}
          <p><strong>Name:</strong> ${safeName}</p>
          <p><strong>Email:</strong> ${safeEmail}</p>
          <p><strong>Subject:</strong> ${safeSubject}</p>
          <h3>Message:</h3>
          <div style="background: #f4f4f4; padding: 15px; border-radius: 5px;">
            ${safeMessage.replace(/\n/g, "<br />")}
          </div>
        </div>
      `,
  });

  if (error) {
    throw new Error(error.message);
  }
}
