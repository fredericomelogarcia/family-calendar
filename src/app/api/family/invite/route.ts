import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, families } from "@/lib/db/schema";
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { generateInviteCode } from "@/lib/utils";

// POST /api/family/invite - Regenerate invite code
// Uses .returning() to avoid a second query
export async function POST() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only select columns we need for authorization
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { familyId: true, role: true },
    });

    if (!user?.familyId || user.role !== "admin") {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const newCode = generateInviteCode();

    // Single query: update + return
    const [updated] = await db.update(families)
      .set({ inviteCode: newCode, updatedAt: new Date() })
      .where(eq(families.id, user.familyId))
      .returning();

    return NextResponse.json({ inviteCode: updated?.inviteCode ?? newCode });
  } catch (error) {
    console.error("Error regenerating invite code:", error);
    return NextResponse.json({ error: "Failed to regenerate invite code" }, { status: 500 });
  }
}