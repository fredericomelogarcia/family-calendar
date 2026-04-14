import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, families, events } from "@/lib/db/schema";
import { auth } from "@clerk/nextjs/server";
import { eq, count } from "drizzle-orm";

// DELETE /api/user/delete - Clean up local data before account deletion
// This should be called BEFORE Clerk's user.delete() to ensure
// the local DB is cleaned up properly (family transfer, orphan cleanup, etc.)
export async function DELETE() {
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

    if (!user) {
      return NextResponse.json({ success: true });
    }

    // If user is in a family, handle the departure
    if (user.familyId) {
      // Remove user from family
      await db.update(users)
        .set({ familyId: null, role: "member" })
        .where(eq(users.id, userId));

      // COUNT remaining members instead of loading all rows
      const [remaining] = await db
        .select({ count: count() })
        .from(users)
        .where(eq(users.familyId, user.familyId));

      if ((remaining?.count ?? 0) === 0) {
        // No members left — delete family and its events
        // Order matters for FK constraints
        await db.delete(events).where(eq(events.familyId, user.familyId));
        await db.delete(families).where(eq(families.id, user.familyId));
      } else if (user.role === "admin") {
        // Promote the first remaining member to admin
        // Only select the id column — we need just one
        const firstMember = await db.query.users.findFirst({
          where: eq(users.familyId, user.familyId),
          columns: { id: true },
          orderBy: (users, { asc }) => [asc(users.createdAt)],
        });

        if (firstMember) {
          await db.update(users)
            .set({ role: "admin" })
            .where(eq(users.id, firstMember.id));
        }
      }
    }

    // Delete the user from local DB
    await db.delete(users).where(eq(users.id, userId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error cleaning up user data:", error);
    return NextResponse.json({ error: "Failed to clean up account data" }, { status: 500 });
  }
}