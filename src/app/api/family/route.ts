import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, families } from "@/lib/db/schema";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { eq, and } from "drizzle-orm";
import { generateId, generateInviteCode } from "@/lib/utils";

// GET /api/family - Get current user's family
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Ensure user exists in our local database
    const existingUser = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!existingUser) {
      // Create user if they don't exist yet (first-time login)
      await db.insert(users).values({
        id: userId,
        role: "member",
        createdAt: new Date(),
      });
    }

    // Now get user with family
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      with: {
        family: true,
      },
    });

    if (!user?.familyId) {
      return NextResponse.json({ family: null, hasFamily: false });
    }

    // Get all family members
    const familyMembers = await db.query.users.findMany({
      where: eq(users.familyId, user.familyId),
    });

    // Enrich members with Clerk user data (name, email, avatar)
    const client = await clerkClient();
    const enrichedMembers = await Promise.all(
      familyMembers.map(async (member) => {
        try {
          const clerkUser = await client.users.getUser(member.id);
          return {
            ...member,
            name: clerkUser.fullName || clerkUser.username || "User",
            email: clerkUser.emailAddresses[0]?.emailAddress || "",
            avatar: clerkUser.imageUrl || null,
          };
        } catch {
          return {
            ...member,
            name: "User",
            email: "",
            avatar: null,
          };
        }
      })
    );

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

    // Check if user already has a family
    const existingUser = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (existingUser?.familyId) {
      return NextResponse.json({ error: "Already in a family" }, { status: 400 });
    }

    if (action === "create") {
      // Create new family
      if (!familyName || familyName.length < 2) {
        return NextResponse.json({ error: "Family name must be at least 2 characters" }, { status: 400 });
      }

      const now = new Date();
      const familyId = generateId();
      const code = generateInviteCode();

      // Create family
      await db.insert(families).values({
        id: familyId,
        name: familyName,
        inviteCode: code,
        createdAt: now,
        updatedAt: now,
      });

      // Update user as admin
      await db.update(users)
        .set({ familyId, role: "admin" })
        .where(eq(users.id, userId));

      const family = await db.query.families.findFirst({
        where: eq(families.id, familyId),
      });

      return NextResponse.json({ family, action: "created" }, { status: 201 });
    }

    if (action === "join") {
      // Join existing family with invite code
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

      // Check family member count
      const memberCount = await db.query.users.findMany({
        where: eq(users.familyId, family.id),
      });

      if (memberCount.length >= 3) {
        return NextResponse.json({ error: "Family is full (max 3 members)" }, { status: 400 });
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
export async function PATCH(request: NextRequest) {
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

    const body = await request.json();
    const { familyName } = body;

    if (familyName && familyName.length >= 2) {
      await db.update(families)
        .set({ name: familyName, updatedAt: new Date() })
        .where(eq(families.id, user.familyId));
    }

    const updatedFamily = await db.query.families.findFirst({
      where: eq(families.id, user.familyId),
    });

    return NextResponse.json({ family: updatedFamily });
  } catch (error) {
    console.error("Error updating family:", error);
    return NextResponse.json({ error: "Failed to update family" }, { status: 500 });
  }
}

// POST /api/family/invite - Generate new invite code (This would be in a separate route file or handled via a specialized handler)
// For this single-file route.ts, we only handle the main route. 
// Invite and Leave should be in their own files for proper Next.js route handling.
