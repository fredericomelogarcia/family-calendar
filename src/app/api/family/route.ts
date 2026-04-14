import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, families } from "@/lib/db/schema";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { eq, count } from "drizzle-orm";
import { generateId, generateInviteCode } from "@/lib/utils";

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

    return NextResponse.json({
      family: user.family,
      members: enrichedMembers,
      hasFamily: true,
      currentUserRole: user.role,
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

      return NextResponse.json({ family, action: "created" }, { status: 201 });
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