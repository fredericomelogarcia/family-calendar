import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, families, invitations } from "@/lib/db/schema";
import { auth } from "@clerk/nextjs/server";
import { eq, and } from "drizzle-orm";

// GET /api/invitations/accept - Accept an invitation via token
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      // Store the token in the URL and redirect to sign-in
      const token = request.nextUrl.searchParams.get("token");
      const callbackUrl = encodeURIComponent(`/api/invitations/accept?token=${token}`);
      return NextResponse.redirect(new URL(`/sign-in?redirect_url=${callbackUrl}`, request.url));
    }

    const token = request.nextUrl.searchParams.get("token");
    if (!token) {
      return NextResponse.json({ error: "Invitation token is required" }, { status: 400 });
    }

    // Find the invitation
    const invitation = await db.query.invitations.findFirst({
      where: eq(invitations.token, token),
    });

    if (!invitation) {
      return NextResponse.redirect(new URL("/dashboard?error=invalid_invitation", request.url));
    }

    if (invitation.status === "accepted") {
      return NextResponse.redirect(new URL("/dashboard?error=already_accepted", request.url));
    }

    if (invitation.status === "declined") {
      return NextResponse.redirect(new URL("/dashboard?error=invitation_declined", request.url));
    }

    // Check if invitation expired
    if (new Date() > new Date(invitation.expiresAt)) {
      // Update status to expired
      await db.update(invitations)
        .set({ status: "expired", updatedAt: new Date() })
        .where(eq(invitations.id, invitation.id));
      return NextResponse.redirect(new URL("/dashboard?error=invitation_expired", request.url));
    }

    // Check if user exists in our database, create if not (first time login)
    const existingUser = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { familyId: true },
    });

    if (existingUser?.familyId) {
      return NextResponse.redirect(new URL("/dashboard?error=already_in_family", request.url));
    }

    // Verify the family still exists
    const family = await db.query.families.findFirst({
      where: eq(families.id, invitation.familyId),
    });

    if (!family) {
      return NextResponse.redirect(new URL("/dashboard?error=family_not_found", request.url));
    }

    // If user doesn't exist in DB, create them first
    if (!existingUser) {
      await db.insert(users).values({
        id: userId,
        familyId: invitation.familyId,
        role: "member",
      });
    } else {
      // Update user to join family
      await db.update(users)
        .set({ familyId: invitation.familyId, role: "member" })
        .where(eq(users.id, userId));
    }

    // Update invitation status
    await db.update(invitations)
      .set({ 
        status: "accepted", 
        acceptedAt: new Date(),
        updatedAt: new Date() 
      })
      .where(eq(invitations.id, invitation.id));

    return NextResponse.redirect(new URL("/dashboard?success=joined_family", request.url));
  } catch (error) {
    console.error("Error accepting invitation:", error);
    return NextResponse.redirect(new URL("/dashboard?error=failed_to_join", request.url));
  }
}

// POST /api/invitations/accept - Accept an invitation via API (for POST requests)
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json({ error: "Invitation token is required" }, { status: 400 });
    }

    // Find the invitation
    const invitation = await db.query.invitations.findFirst({
      where: eq(invitations.token, token),
    });

    if (!invitation) {
      return NextResponse.json({ error: "Invalid invitation" }, { status: 404 });
    }

    if (invitation.status !== "pending") {
      return NextResponse.json(
        { error: "Invitation is no longer valid" },
        { status: 400 }
      );
    }

    // Check if invitation expired
    if (new Date() > new Date(invitation.expiresAt)) {
      await db.update(invitations)
        .set({ status: "expired", updatedAt: new Date() })
        .where(eq(invitations.id, invitation.id));
      return NextResponse.json({ error: "Invitation has expired" }, { status: 400 });
    }

    // Check if user is already in a family
    const existingUser = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { familyId: true },
    });

    if (existingUser?.familyId) {
      return NextResponse.json(
        { error: "You are already in a family" },
        { status: 400 }
      );
    }

    // Verify the family still exists
    const family = await db.query.families.findFirst({
      where: eq(families.id, invitation.familyId),
    });

    if (!family) {
      return NextResponse.json({ error: "Family not found" }, { status: 404 });
    }

    // Update invitation status and user
    await Promise.all([
      db.update(invitations)
        .set({ 
          status: "accepted", 
          acceptedAt: new Date(),
          updatedAt: new Date() 
        })
        .where(eq(invitations.id, invitation.id)),
      db.update(users)
        .set({ familyId: invitation.familyId, role: "member" })
        .where(eq(users.id, userId)),
    ]);

    return NextResponse.json({ 
      success: true,
      family: {
        id: family.id,
        name: family.name,
      },
    });
  } catch (error) {
    console.error("Error accepting invitation:", error);
    return NextResponse.json({ error: "Failed to accept invitation" }, { status: 500 });
  }
}
