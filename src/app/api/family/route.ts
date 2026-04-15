import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, families, invitations } from "@/lib/db/schema";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { eq, count, and } from "drizzle-orm";
import { generateId, generateInviteCode, generateInvitationToken } from "@/lib/utils";
import { Resend } from "resend";

const MAX_FAMILY_MEMBERS = 6;
const INVITATION_EXPIRY_DAYS = 7;

// GET /api/family - Get current user's family
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Single query: get user with family via relation
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      with: {
        family: true,
      },
    });

    // If user doesn't exist yet, create them (first-time login)
    if (!user) {
      await db.insert(users).values({
        id: userId,
        role: "member",
      });

      return NextResponse.json({ family: null, hasFamily: false });
    }

    if (!user.familyId) {
      return NextResponse.json({ family: null, hasFamily: false });
    }

    // Single query: get all family members (only columns we need)
    const familyMembers = await db.query.users.findMany({
      where: eq(users.familyId, user.familyId),
      columns: { id: true, role: true, familyId: true, createdAt: true },
    });

    // Batch Clerk call: fetch all member profiles in one request (not N+1)
    const client = await clerkClient();
    const memberIds = familyMembers.map(m => m.id);

    let enrichedMembers;
    try {
      // getUserList fetches all users in one API call — no N+1
      const clerkResponse = await client.users.getUserList({ userId: memberIds });
      const clerkUsersMap = new Map(
        clerkResponse.data.map((u) => [u.id, u])
      );

      enrichedMembers = familyMembers.map(member => {
        const clerkUser = clerkUsersMap.get(member.id);
        return {
          ...member,
          name: clerkUser?.fullName || clerkUser?.username || "User",
          email: clerkUser?.emailAddresses[0]?.emailAddress || "",
          avatar: clerkUser?.imageUrl || null,
        };
      });
    } catch {
      // If Clerk batch call fails, fall back to basic data
      enrichedMembers = familyMembers.map(member => ({
        ...member,
        name: "User",
        email: "",
        avatar: null,
      }));
    }

    // Return member count, family, and members
    return NextResponse.json({
      family: user.family,
      members: enrichedMembers,
      hasFamily: true,
      currentUserRole: user.role,
      memberCount: familyMembers.length,
    });
  } catch (error) {
    console.error("Error fetching family:", error);
    return NextResponse.json({ error: "Failed to fetch family" }, { status: 500 });
  }
}

// POST /api/family - Create or join a family
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { action, familyName, inviteCode } = body;

    // Only select the columns we need to check
    const existingUser = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { familyId: true },
    });

    if (existingUser?.familyId) {
      return NextResponse.json({ error: "Already in a family" }, { status: 400 });
    }

    if (action === "create") {
      if (!familyName || familyName.length < 2) {
        return NextResponse.json({ error: "Family name must be at least 2 characters" }, { status: 400 });
      }

      // Extract inviteEmails from the request
      const { inviteEmails } = body;
      const emailsToInvite = Array.isArray(inviteEmails) 
        ? inviteEmails.filter((e: string) => typeof e === "string" && e.includes("@")).slice(0, MAX_FAMILY_MEMBERS - 1)
        : [];

      const familyId = generateId();
      const code = generateInviteCode();

      // Single query: insert + return the created family
      const [family] = await db.insert(families).values({
        id: familyId,
        name: familyName,
        inviteCode: code,
      }).returning();

      // Update user as admin
      await db.update(users)
        .set({ familyId, role: "admin" })
        .where(eq(users.id, userId));

      // Create invitations for provided emails
      const createdInvitations = [];
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + INVITATION_EXPIRY_DAYS);

      for (const email of emailsToInvite) {
        try {
          const invitationId = generateId();
          const token = generateInvitationToken();

          const [invitation] = await db.insert(invitations).values({
            id: invitationId,
            familyId,
            email: email.toLowerCase(),
            invitedBy: userId,
            status: "pending",
            token,
            expiresAt,
          }).returning();

          // Send invitation email
          try {
            const resend = new Resend(process.env.RESEND_API_KEY);
            const acceptUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/invitations/accept?token=${token}`;
            const client = await clerkClient();
            const inviter = await client.users.getUser(userId);
            const inviterName = inviter.fullName || inviter.username || "Someone";

            await resend.emails.send({
              from: process.env.FROM_EMAIL || "Zawly Calendar <invites@zawly.app>",
              to: email.toLowerCase(),
              subject: `${inviterName} invited you to join ${familyName} on Zawly`,
              html: `
                <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; background: #FAF9F7; border-radius: 12px;">
                  <div style="background: #FFFFFF; border-radius: 12px; padding: 32px; border: 1px solid #E8E4DE; text-align: center;">
                    <div style="width: 64px; height: 64px; background: #7C9A7E; border-radius: 16px; margin: 0 auto 24px; display: flex; align-items: center; justify-content: center;">
                      <span style="color: white; font-size: 32px;">📅</span>
                    </div>
                    <h2 style="margin: 0 0 16px; color: #2D2A28; font-size: 24px; font-weight: 700;">Family Calendar Invitation</h2>
                    <p style="margin: 0 0 24px; color: #6B6560; font-size: 16px; line-height: 1.6;">
                      <strong style="color: #2D2A28;">${escapeHtml(inviterName)}</strong> has invited you to join 
                      <strong style="color: #2D2A28;">${escapeHtml(familyName)}</strong> on Zawly.
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
            console.error(`Failed to send invitation email to ${email}:`, emailError);
          }

          createdInvitations.push({
            ...invitation,
            acceptUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/invitations/accept?token=${token}`,
          });
        } catch (err) {
          console.error(`Failed to create invitation for ${email}:`, err);
        }
      }

      return NextResponse.json({ 
        family, 
        action: "created",
        invitations: createdInvitations,
        invitationCount: createdInvitations.length,
      }, { status: 201 });
    }

    if (action === "join") {
      if (!inviteCode || inviteCode.length !== 6) {
        return NextResponse.json({ error: "Invalid invite code" }, { status: 400 });
      }

      // Find family by invite code
      const family = await db.query.families.findFirst({
        where: eq(families.inviteCode, inviteCode.toUpperCase()),
      });

      if (!family) {
        return NextResponse.json({ error: "Invalid invite code" }, { status: 404 });
      }

      // COUNT instead of loading all member rows
      const [memberCountResult] = await db
        .select({ count: count() })
        .from(users)
        .where(eq(users.familyId, family.id));

      if ((memberCountResult?.count ?? 0) >= 6) {
        return NextResponse.json({ error: "Family is full (max 6 members)" }, { status: 400 });
      }

      // Update user
      await db.update(users)
        .set({ familyId: family.id, role: "member" })
        .where(eq(users.id, userId));

      return NextResponse.json({ family, action: "joined" });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error with family action:", error);
    return NextResponse.json({ error: "Failed to process family action" }, { status: 500 });
  }
}

// PATCH /api/family - Update family
// Uses .returning() to avoid a second query
export async function PATCH(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only select what we need to authorize
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { familyId: true, role: true },
    });

    if (!user?.familyId || user.role !== "admin") {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const body = await request.json();
    const { familyName } = body;

    if (familyName && familyName.length >= 2) {
      // Single query: update + return
      const [updatedFamily] = await db.update(families)
        .set({ name: familyName, updatedAt: new Date() })
        .where(eq(families.id, user.familyId))
        .returning();

      return NextResponse.json({ family: updatedFamily });
    }

    // If no update was made, fetch current state
    const family = await db.query.families.findFirst({
      where: eq(families.id, user.familyId),
    });

    return NextResponse.json({ family });
  } catch (error) {
    console.error("Error updating family:", error);
    return NextResponse.json({ error: "Failed to update family" }, { status: 500 });
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