import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, families } from "@/lib/db/schema";
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { generateInviteCode } from "@/lib/utils";

// POST /api/family/invite - Regenerate invite code
export async function POST() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user?.familyId || user.role !== "admin") {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    // Generate new invite code
    const newCode = generateInviteCode();

    await db.update(families)
      .set({ inviteCode: newCode, updatedAt: new Date() })
      .where(eq(families.id, user.familyId));

    return NextResponse.json({ inviteCode: newCode });
  } catch (error) {
    console.error("Error regenerating invite code:", error);
    return NextResponse.json({ error: "Failed to regenerate invite code" }, { status: 500 });
  }
}