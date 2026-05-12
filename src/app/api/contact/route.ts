import { NextResponse } from "next/server";
import { Resend } from "resend";

// Initialize Resend with the API Key from your .env.local file
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    // 1. Extract data from the incoming request body
    const body = await request.json();
    const { name, email, subject, message } = body;

    // 2. Perform basic validation
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Name, email, and message are required fields." },
        { status: 400 },
      );
    }

    // 3. Send the email using Resend (Content completely in English)
    const data = await resend.emails.send({
      from: "Portfolio Contact Form <onboarding@resend.dev>", // Default Resend testing email
      to: process.env.CONTACT_EMAIL as string, // Your email address from .env.local
      subject: `New Contact Inquiry: ${subject || "No Subject"}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h2 style="color: #111; border-bottom: 2px solid #eaeaea; padding-bottom: 10px;">
            New Message from Your Portfolio
          </h2>
          <p style="font-size: 16px;">You have received a new contact form submission. Here are the details:</p>
          
          <table style="width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 15px;">
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #ddd; width: 80px;"><strong>Name:</strong></td>
              <td style="padding: 10px 0; border-bottom: 1px solid #ddd;">${name}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #ddd;"><strong>Email:</strong></td>
              <td style="padding: 10px 0; border-bottom: 1px solid #ddd;">
                <a href="mailto:${email}" style="color: #0066cc; text-decoration: none;">${email}</a>
              </td>
            </tr>
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #ddd;"><strong>Subject:</strong></td>
              <td style="padding: 10px 0; border-bottom: 1px solid #ddd;">${subject || "N/A"}</td>
            </tr>
          </table>
          
          <h3 style="margin-top: 30px; color: #111;">Message:</h3>
          <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; border: 1px solid #eee; font-size: 15px; line-height: 1.6;">
            <p style="white-space: pre-wrap; margin: 0;">${message}</p>
          </div>
          
          <p style="margin-top: 40px; font-size: 12px; color: #888; text-align: center;">
            This email was automatically generated from your portfolio website's contact form.
          </p>
        </div>
      `,
    });

    // 4. Return success response to the frontend
    return NextResponse.json(
      { message: "Message sent successfully!", data },
      { status: 200 },
    );
  } catch (error) {
    console.error("Failed to send email:", error);
    // Return error response to the frontend
    return NextResponse.json(
      { error: "An unexpected error occurred while sending the message." },
      { status: 500 },
    );
  }
}
