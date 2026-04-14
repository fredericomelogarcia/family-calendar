import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, families, events } from "@/lib/db/schema";
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";

// DELETE /api/family/leave - Leave current family
export async function DELETE() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user?.familyId) {
      return NextResponse.json({ error: "Not in a family" }, { status: 400 });
    }

    // Remove user from family
    await db.update(users)
      .set({ familyId: null, role: "member" })
      .where(eq(users.id, userId));

    // Check if any members remain in the family
    const remainingMembers = await db.query.users.findMany({
      where: eq(users.familyId, user.familyId),
    });

    // If no members left, clean up the family and its events
    if (remainingMembers.length === 0) {
      // Delete family events
      await db.delete(events)
        .where(eq(events.familyId, user.familyId));

      // Delete family
      await db.delete(families)
        .where(eq(families.id, user.familyId));
    } else {
      // If the leaving user was admin, promote the first remaining member
      if (user.role === "admin") {
        await db.update(users)
          .set({ role: "admin" })
          .where(eq(users.id, remainingMembers[0].id));
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error leaving family:", error);
    return NextResponse.json({ error: "Failed to leave family" }, { status: 500 });
  }
}