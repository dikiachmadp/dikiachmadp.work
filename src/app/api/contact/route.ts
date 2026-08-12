import { NextResponse } from "next/server";
import { Resend } from "resend";
import { z } from "zod";
import { env } from "@/lib/env";
import { createContactSubmission } from "@/lib/db/contact";
import { getContactLimiter } from "@/lib/ratelimit";

const ContactRequestSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  email: z.string().email("Invalid email address"),
  subject: z.string().max(300).optional().default("No Subject"),
  message: z.string().min(1, "Message is required").max(5000),
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
  const ip = request.headers.get("x-forwarded-for") ?? "127.0.0.1";

  const { success } = await getContactLimiter().limit(ip);
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
      return NextResponse.json(
        { error: "Invalid input data", details: validation.error.format() },
        { status: 400 },
      );
    }

    const { name, email, subject, message } = validation.data;

    // Simpan dulu, baru kirim email. Kalau Resend sedang bermasalah, pesannya
    // tetap tersimpan dan muncul di inbox dasbor — sebelumnya hilang total.
    await createContactSubmission({ name, email, subject, message });

    const safeName = sanitizeHtml(name);
    const safeEmail = sanitizeHtml(email);
    const safeSubject = sanitizeHtml(subject);
    const safeMessage = sanitizeHtml(message);

    const resend = new Resend(env.RESEND_API_KEY);
    const fromAddress =
      env.RESEND_FROM_EMAIL ||
      "Portfolio Contact Form <onboarding@resend.dev>";

    // Pesan sudah tersimpan; kegagalan email tidak boleh membuat pengirim
    // mengira pesannya tidak terkirim, jadi ditangani terpisah.
    try {
      await sendNotification({
        resend,
        fromAddress,
        safeName,
        safeEmail,
        safeSubject,
        safeMessage,
      });
    } catch (error) {
      console.error("Message stored but email failed:", error);
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
}: {
  resend: Resend;
  fromAddress: string;
  safeName: string;
  safeEmail: string;
  safeSubject: string;
  safeMessage: string;
}) {
  const { error } = await resend.emails.send({
    from: fromAddress,
    to: env.CONTACT_EMAIL,
    subject: `New Contact Inquiry: ${safeSubject}`,
    html: `
        <div style="font-family: sans-serif; line-height: 1.6; color: #333;">
          <h2>New Message from Your Portfolio</h2>
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
