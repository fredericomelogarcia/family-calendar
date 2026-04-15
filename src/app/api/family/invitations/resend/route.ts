import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, families, invitations } from "@/lib/db/schema";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { eq, and } from "drizzle-orm";
import { Resend } from "resend";

const INVITATION_EXPIRY_DAYS = 7;

// POST /api/family/invitations/resend - Resend a pending invitation
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { invitationId } = body;

    if (!invitationId) {
      return NextResponse.json({ error: "Invitation ID is required" }, { status: 400 });
    }

    // Get user's family and role
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { familyId: true, role: true },
    });

    if (!user?.familyId) {
      return NextResponse.json({ error: "Not in a family" }, { status: 404 });
    }

    // Must be admin to resend invitations
    if (user.role !== "admin") {
      return NextResponse.json(
        { error: "Only admins can resend invitations" },
        { status: 403 }
      );
    }

    // Find the invitation in this family
    const invitation = await db.query.invitations.findFirst({
      where: and(
        eq(invitations.id, invitationId),
        eq(invitations.familyId, user.familyId)
      ),
    });

    if (!invitation) {
      return NextResponse.json({ error: "Invitation not found" }, { status: 404 });
    }

    if (invitation.status !== "pending") {
      return NextResponse.json(
        { error: "Can only resend pending invitations" },
        { status: 400 }
      );
    }

    // Generate new token and update expiry
    const { generateInvitationToken } = await import("@/lib/utils");
    const newToken = generateInvitationToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + INVITATION_EXPIRY_DAYS);

    // Update invitation with new token and expiry
    const [updatedInvitation] = await db.update(invitations)
      .set({
        token: newToken,
        expiresAt,
        updatedAt: new Date(),
      })
      .where(eq(invitations.id, invitationId))
      .returning();

    // Get family and inviter details
    const family = await db.query.families.findFirst({
      where: eq(families.id, user.familyId),
      columns: { name: true },
    });

    const client = await clerkClient();
    const inviter = await client.users.getUser(userId);
    const inviterName = inviter.fullName || inviter.username || "Someone";

    // Send new invitation email
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invite?token=${newToken}`;

      await resend.emails.send({
        from: process.env.FROM_EMAIL || "Zawly Calendar <invites@zawly.app>",
        to: invitation.email.toLowerCase(),
        subject: `${inviterName} resent your invitation to join ${family?.name || "their family"} on Zawly`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; background: #FAF9F7; border-radius: 12px;">
            <div style="background: #FFFFFF; border-radius: 12px; padding: 32px; border: 1px solid #E8E4DE; text-align: center;">
              <div style="width: 64px; height: 64px; background: #7C9A7E; border-radius: 16px; margin: 0 auto 24px; display: flex; align-items: center; justify-content: center;">
                <span style="color: white; font-size: 32px;">📅</span>
              </div>
              
              <h2 style="margin: 0 0 16px; color: #2D2A28; font-size: 24px; font-weight: 700;">Family Calendar Invitation</h2>
              
              <p style="margin: 0 0 24px; color: #6B6560; font-size: 16px; line-height: 1.6;">
                <strong style="color: #2D2A28;">${escapeHtml(inviterName)}</strong> has resent your invitation to join 
                <strong style="color: #2D2A28;">${escapeHtml(family?.name || "their family")}</strong> on Zawly.
              </p>
              
              <a href="${inviteUrl}" 
                 style="display: inline-block; background: #7C9A7E; color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; margin-bottom: 16px;">
                Accept Invitation
              </a>
              
              <p style="margin: 16px 0 0; color: #A09A94; font-size: 13px;">
                This invitation expires in ${INVITATION_EXPIRY_DAYS} days.
              </p>
              
              <p style="margin: 24px 0 0; color: #A09A94; font-size: 12px;">
                Can't click the button? Copy this link:<br/>
                <code style="background: #F5F3EF; padding: 4px 8px; border-radius: 4px; word-break: break-all;">${inviteUrl}</code>
              </p>
            </div>
            
            <p style="text-align: center; color: #A09A94; font-size: 12px; margin-top: 16px;">
              If you weren't expecting this invitation, you can safely ignore this email.
            </p>
          </div>
        `,
      });
    } catch (emailError) {
      console.error("Failed to send invitation email:", emailError);
      // Still return success since invitation is updated
    }

    return NextResponse.json({
      success: true,
      invitation: {
        ...updatedInvitation,
        expiresAt: expiresAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Error resending invitation:", error);
    return NextResponse.json({ error: "Failed to resend invitation" }, { status: 500 });
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
