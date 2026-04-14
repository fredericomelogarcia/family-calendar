import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { Resend } from "resend";
import { z } from "zod/v4";

const contactSchema = z.object({
  subject: z
    .string()
    .min(3, "Subject must be at least 3 characters")
    .max(200, "Subject must be under 200 characters"),
  body: z
    .string()
    .min(10, "Message must be at least 10 characters")
    .max(5000, "Message must be under 5000 characters"),
});

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const raw = await request.json();
    const parsed = contactSchema.safeParse(raw);

    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return NextResponse.json(
        { error: firstError?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const { subject, body } = parsed.data;

    // Fetch user info from Clerk for the email template
    const client = await clerkClient();
    const clerkUser = await client.users.getUser(userId);
    const userName =
      clerkUser.fullName || clerkUser.username || "Zawly User";
    const userEmail =
      clerkUser.emailAddresses[0]?.emailAddress || "No email on file";

    const resend = new Resend(process.env.RESEND_API_KEY);

    const fromAddress =
      process.env.CONTACT_FROM_EMAIL ||
      "Zawly Calendar <noreply@zawly.app>";

    const { data, error } = await resend.emails.send({
      from: fromAddress,
      to: process.env.CONTACT_EMAIL as string,
      subject: `[Zawly Contact] ${subject}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; background: #FAF9F7; border-radius: 12px;">
          <div style="background: #FFFFFF; border-radius: 12px; padding: 32px; border: 1px solid #E8E4DE;">
            <h2 style="margin: 0 0 24px; color: #2D2A28; font-size: 20px;">New Contact Message</h2>

            <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
              <tr>
                <td style="padding: 8px 0; color: #6B6560; font-size: 14px; width: 80px; vertical-align: top;">Name</td>
                <td style="padding: 8px 0; color: #2D2A28; font-size: 14px; font-weight: 600;">${escapeHtml(userName)}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6B6560; font-size: 14px; vertical-align: top;">Email</td>
                <td style="padding: 8px 0; color: #2D2A28; font-size: 14px; font-weight: 600;">
                  <a href="mailto:${escapeHtml(userEmail)}" style="color: #7C9A7E; text-decoration: none;">${escapeHtml(userEmail)}</a>
                </td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6B6560; font-size: 14px; vertical-align: top;">Subject</td>
                <td style="padding: 8px 0; color: #2D2A28; font-size: 14px; font-weight: 600;">${escapeHtml(subject)}</td>
              </tr>
            </table>

            <div style="background: #F5F3EF; border-radius: 8px; padding: 16px; margin-top: 8px;">
              <p style="margin: 0 0 8px; color: #6B6560; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Message</p>
              <p style="margin: 0; color: #2D2A28; font-size: 14px; white-space: pre-wrap; line-height: 1.6;">${escapeHtml(body)}</p>
            </div>
          </div>

          <p style="text-align: center; color: #A09A94; font-size: 12px; margin-top: 16px;">
            Sent from the Zawly Calendar Support page
          </p>
        </div>
      `,
    });

    if (error) {
      console.error("Resend error:", error);
      return NextResponse.json(
        { error: "Failed to send message" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error sending contact email:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}