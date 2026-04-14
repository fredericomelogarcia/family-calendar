import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, families, events } from "@/lib/db/schema";
import { auth } from "@clerk/nextjs/server";
import { eq, and, ne, count } from "drizzle-orm";

// DELETE /api/family/leave - Leave current family
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only select columns we need
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { familyId: true, role: true },
    });

    if (!user?.familyId) {
      return NextResponse.json({ error: "Not in a family" }, { status: 400 });
    }

    const familyId = user.familyId;

    // If admin, handle succession
    if (user.role === "admin") {
      // COUNT other members instead of loading them all
      const [otherCount] = await db
        .select({ count: count() })
        .from(users)
        .where(and(eq(users.familyId, familyId), ne(users.id, userId)));

      if ((otherCount?.count ?? 0) > 0) {
        let body: any = {};
        try {
          body = await request.json();
        } catch {
          // No body provided
        }
        const { newAdminId } = body;

        if (!newAdminId) {
          return NextResponse.json({ error: "You must choose a new admin before leaving" }, { status: 400 });
        }

        // Single query: verify the new admin is in the same family and promote them
        // Only select columns needed for verification
        const newAdmin = await db.query.users.findFirst({
          where: and(eq(users.id, newAdminId), eq(users.familyId, familyId)),
          columns: { id: true },
        });

        if (!newAdmin) {
          return NextResponse.json({ error: "Selected user is not in your family" }, { status: 400 });
        }

        // Promote the selected member to admin
        await db.update(users)
          .set({ role: "admin" })
          .where(eq(users.id, newAdminId));
      }
      // If admin is the only member, they can leave freely and the family will be deleted
    }

    // Remove user from family
    await db.update(users)
      .set({ familyId: null, role: "member" })
      .where(eq(users.id, userId));

    // COUNT remaining members instead of loading all rows
    const [remaining] = await db
      .select({ count: count() })
      .from(users)
      .where(eq(users.familyId, familyId));

    // If no members left, clean up the family and its events
    if ((remaining?.count ?? 0) === 0) {
      // Delete events then family — order matters for FK constraints
      await db.delete(events).where(eq(events.familyId, familyId));
      await db.delete(families).where(eq(families.id, familyId));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error leaving family:", error);
    return NextResponse.json({ error: "Failed to leave family" }, { status: 500 });
  }
}