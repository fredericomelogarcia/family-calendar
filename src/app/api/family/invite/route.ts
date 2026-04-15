import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, families, invitations } from "@/lib/db/schema";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { eq, and, count } from "drizzle-orm";
import { generateId, generateInvitationToken } from "@/lib/utils";
import { Resend } from "resend";

const INVITATION_EXPIRY_DAYS = 7;
const MAX_FAMILY_MEMBERS = 6;

// GET /api/family/invites - Get pending invitations for the family
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's family
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { familyId: true, role: true },
    });

    if (!user?.familyId) {
      return NextResponse.json({ error: "Not in a family" }, { status: 404 });
    }

    // Get pending invitations for the family
    const familyInvitations = await db.query.invitations.findMany({
      where: and(
        eq(invitations.familyId, user.familyId),
        eq(invitations.status, "pending")
      ),
      with: {
        inviter: {
          columns: { id: true },
        },
      },
    });

    // Get inviter details from Clerk
    const inviterIds = [...new Set(familyInvitations.map((inv) => inv.invitedBy))];
    let inviterMap = new Map<string, { name: string; email: string }>();
    
    if (inviterIds.length > 0) {
      try {
        const client = await clerkClient();
        const clerkResponse = await client.users.getUserList({ userId: inviterIds });
        inviterMap = new Map(
          clerkResponse.data.map((u) => [
            u.id,
            {
              name: u.fullName || u.username || "Unknown",
              email: u.emailAddresses[0]?.emailAddress || "",
            },
          ])
        );
      } catch {
        // If Clerk call fails, use fallback
      }
    }

    const enrichedInvitations = familyInvitations.map((inv) => ({
      ...inv,
      inviterName: inviterMap.get(inv.invitedBy)?.name || "Unknown",
      inviterEmail: inviterMap.get(inv.invitedBy)?.email || "",
    }));

    return NextResponse.json({ invitations: enrichedInvitations });
  } catch (error) {
    console.error("Error fetching invitations:", error);
    return NextResponse.json({ error: "Failed to fetch invitations" }, { status: 500 });
  }
}

// POST /api/family/invite - Send an email invitation
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { email, familyId: providedFamilyId } = body;

    // Validate email
    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
    }

    // Get user details
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { familyId: true, role: true },
    });

    if (!user?.familyId) {
      return NextResponse.json({ error: "Not in a family" }, { status: 404 });
    }

    // Must be admin to invite
    if (user.role !== "admin") {
      return NextResponse.json({ error: "Only admins can invite members" }, { status: 403 });
    }

    // Check family size limit
    const [memberCountResult] = await db
      .select({ count: count() })
      .from(users)
      .where(eq(users.familyId, user.familyId));

    const memberCount = memberCountResult?.count ?? 0;

    // Also count pending invitations
    const [pendingInvitesResult] = await db
      .select({ count: count() })
      .from(invitations)
      .where(
        and(
          eq(invitations.familyId, user.familyId),
          eq(invitations.status, "pending")
        )
      );

    const totalPending = memberCount + (pendingInvitesResult?.count ?? 0);
    
    if (totalPending >= MAX_FAMILY_MEMBERS) {
      return NextResponse.json(
        { error: `Family already has ${MAX_FAMILY_MEMBERS} members or pending invites` },
        { status: 400 }
      );
    }

    // Check if user is already in this family
    const existingMember = await db.query.users.findFirst({
      where: eq(users.familyId, user.familyId),
    });

    // If this is a new family during creation, there's no existing member check needed
    // Otherwise, check if email is already in family
    if (!providedFamilyId && existingMember?.id) {
      // Get the family and check all member emails via Clerk
      try {
        const client = await clerkClient();
        const familyUsers = await db.query.users.findMany({
          where: eq(users.familyId, user.familyId),
          columns: { id: true },
        });
        
        const userIds = familyUsers.map((u) => u.id);
        const clerkUsers = await client.users.getUserList({ userId: userIds });
        
        const emailsInFamily = clerkUsers.data
          .flatMap((u) => u.emailAddresses.map((e) => e.emailAddress.toLowerCase()));
        
        if (emailsInFamily.includes(email.toLowerCase())) {
          return NextResponse.json(
            { error: "This user is already in your family" },
            { status: 400 }
          );
        }
      } catch {
        // If we can't verify, continue anyway
      }
    }

    // Check for existing pending invitation to this email
    const existingInvitation = await db.query.invitations.findFirst({
      where: and(
        eq(invitations.familyId, user.familyId),
        eq(invitations.email, email.toLowerCase()),
        eq(invitations.status, "pending")
      ),
    });

    if (existingInvitation) {
      return NextResponse.json(
        { error: "An invitation has already been sent to this email" },
        { status: 400 }
      );
    }

    // Create the invitation
    const invitationId = generateId();
    const token = generateInvitationToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + INVITATION_EXPIRY_DAYS);

    const [invitation] = await db.insert(invitations)
      .values({
        id: invitationId,
        familyId: user.familyId,
        email: email.toLowerCase(),
        invitedBy: userId,
        status: "pending",
        token,
        expiresAt,
      })
      .returning();

    // Get family and inviter details for email
    const family = await db.query.families.findFirst({
      where: eq(families.id, user.familyId),
      columns: { name: true, inviteCode: true },
    });

    // Get inviter details from Clerk
    const client = await clerkClient();
    const inviter = await client.users.getUser(userId);
    const inviterName = inviter.fullName || inviter.username || "Someone";

    // Send invitation email via Resend
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const acceptUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/invitations/accept?token=${token}`;

      await resend.emails.send({
        from: process.env.FROM_EMAIL || "Zawly Calendar <invites@zawly.app>",
        to: email.toLowerCase(),
        subject: `${inviterName} invited you to join ${family?.name || "their family"} on Zawly`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; background: #FAF9F7; border-radius: 12px;">
            <div style="background: #FFFFFF; border-radius: 12px; padding: 32px; border: 1px solid #E8E4DE; text-align: center;">
              <div style="width: 64px; height: 64px; background: #7C9A7E; border-radius: 16px; margin: 0 auto 24px; display: flex; align-items: center; justify-content: center;">
                <span style="color: white; font-size: 32px;">📅</span>
              </div>
              
              <h2 style="margin: 0 0 16px; color: #2D2A28; font-size: 24px; font-weight: 700;">Family Calendar Invitation</h2>
              
              <p style="margin: 0 0 24px; color: #6B6560; font-size: 16px; line-height: 1.6;">
                <strong style="color: #2D2A28;">${escapeHtml(inviterName)}</strong> has invited you to join 
                <strong style="color: #2D2A28;">${escapeHtml(family?.name || "their family")}</strong> on Zawly.
              </p>
              
              <a href="${acceptUrl}" 
                 style="display: inline-block; background: #7C9A7E; color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; margin-bottom: 16px;">
                Accept Invitation
              </a>
              
              <p style="margin: 16px 0 0; color: #A09A94; font-size: 13px;">
                This invitation expires in ${INVITATION_EXPIRY_DAYS} days.
              </p>
              
              <p style="margin: 24px 0 0; color: #A09A94; font-size: 12px;">
                Can't click the button? Copy this link:<br/>
                <code style="background: #F5F3EF; padding: 4px 8px; border-radius: 4px; word-break: break-all;">${acceptUrl}</code>
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
      // Don't fail the request if email fails - invitation is still created
    }

    return NextResponse.json({
      invitation: {
        ...invitation,
        expiresAt: expiresAt.toISOString(),
      },
      family: {
        name: family?.name || "",
      },
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating invitation:", error);
    return NextResponse.json({ error: "Failed to create invitation" }, { status: 500 });
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
