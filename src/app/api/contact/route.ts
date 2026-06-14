import { NextResponse } from "next/server";
import { Resend } from "resend";
import { z } from "zod";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const ContactRequestSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  email: z.string().email("Invalid email address"),
  subject: z.string().max(300).optional().default("No Subject"),
  message: z.string().min(1, "Message is required").max(5000),
});

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const ratelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(3, "1 h"),
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

  const { success } = await ratelimit.limit(ip);
  if (!success) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 },
    );
  }

  if (
    !process.env.RESEND_API_KEY ||
    !process.env.CONTACT_EMAIL ||
    !process.env.UPSTASH_REDIS_REST_URL ||
    !process.env.UPSTASH_REDIS_REST_TOKEN
  ) {
    console.error("Missing email or redis environment variables");
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 },
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

    const safeName = sanitizeHtml(name);
    const safeEmail = sanitizeHtml(email);
    const safeSubject = sanitizeHtml(subject);
    const safeMessage = sanitizeHtml(message);

    const resend = new Resend(process.env.RESEND_API_KEY);
    const fromAddress =
      process.env.RESEND_FROM_EMAIL ||
      "Portfolio Contact Form <onboarding@resend.dev>";

    const data = await resend.emails.send({
      from: fromAddress,
      to: process.env.CONTACT_EMAIL as string,
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
    return NextResponse.json(
      { message: "Message sent successfully!", data },
      { status: 200 },
    );
  } catch (error) {
    console.error("Failed to send email:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 },
    );
  }
}
