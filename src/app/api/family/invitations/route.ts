import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, invitations } from "@/lib/db/schema";
import { auth } from "@clerk/nextjs/server";
import { eq, and } from "drizzle-orm";

// DELETE /api/family/invitations - Cancel an invitation
export async function DELETE(request: NextRequest) {
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

    // Must be admin to cancel invitations
    if (user.role !== "admin") {
      return NextResponse.json(
        { error: "Only admins can cancel invitations" },
        { status: 403 }
      );
    }

    // Find and verify the invitation belongs to this family
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
        { error: "Can only cancel pending invitations" },
        { status: 400 }
      );
    }

    // Delete the invitation
    await db.delete(invitations).where(eq(invitations.id, invitationId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error canceling invitation:", error);
    return NextResponse.json({ error: "Failed to cancel invitation" }, { status: 500 });
  }
}
