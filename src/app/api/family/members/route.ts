import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { auth } from "@clerk/nextjs/server";
import { eq, and } from "drizzle-orm";

// DELETE /api/family/members - Remove a member from the family (admin only)
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { memberId } = body;

    if (!memberId) {
      return NextResponse.json({ error: "Member ID is required" }, { status: 400 });
    }

    if (memberId === userId) {
      return NextResponse.json({ error: "Cannot remove yourself. Use leave family instead." }, { status: 400 });
    }

    // Single query: get current user with only authorization columns
    const currentUser = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { familyId: true, role: true },
    });

    if (!currentUser?.familyId || currentUser.role !== "admin") {
      return NextResponse.json({ error: "Only family admins can remove members" }, { status: 403 });
    }

    // Single query: verify member exists in same family (compound condition)
    // No need for a separate findFirst — we can delete with the compound WHERE
    // and check affected rows. But for a clear 404, verify first.
    const memberToRemove = await db.query.users.findFirst({
      where: and(eq(users.id, memberId), eq(users.familyId, currentUser.familyId)),
      columns: { id: true },
    });

    if (!memberToRemove) {
      return NextResponse.json({ error: "Member not found in your family" }, { status: 404 });
    }

    // Remove member from family
    await db.update(users)
      .set({ familyId: null, role: "member" })
      .where(eq(users.id, memberId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing member:", error);
    return NextResponse.json({ error: "Failed to remove member" }, { status: 500 });
  }
}