import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { allocations, users } from "@/lib/db/schema";
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";

// GET /api/allocations - Fetch allocations for a period
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || new Date().toISOString().slice(0, 7);

    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { familyId: true },
    });

    if (!user?.familyId) {
      return NextResponse.json({ error: "No family found" }, { status: 400 });
    }

    const allocationsList = await db.query.allocations.findMany({
      where: eq(allocations.familyId, user.familyId),
    });

    return NextResponse.json({ allocations: allocationsList });
  } catch (error) {
    console.error("Error fetching allocations:", error);
    return NextResponse.json({ error: "Failed to fetch allocations" }, { status: 500 });
  }
}

// POST /api/allocations - Save allocations for a period
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { allocations: allocationsData, period } = body;

    if (!period || !allocationsData) {
      return NextResponse.json({ error: "Period and allocations required" }, { status: 400 });
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { familyId: true },
    });

    if (!user?.familyId) {
      return NextResponse.json({ error: "No family found" }, { status: 400 });
    }

    // Delete existing allocations for this period
    const existingAllocations = await db.query.allocations.findMany({
      where: eq(allocations.familyId, user.familyId),
    });
    
    for (const alloc of existingAllocations) {
      await db.delete(allocations).where(eq(allocations.id, alloc.id));
    }

    // Insert new allocations
    const newAllocations = [];
    for (const alloc of allocationsData) {
      if (alloc.amount > 0 && alloc.categoryId) {
        const [result] = await db.insert(allocations).values({
          id: crypto.randomUUID(),
          familyId: user.familyId,
          categoryId: alloc.categoryId,
          amount: String(alloc.amount),
          period,
        }).returning();
        newAllocations.push(result);
      }
    }

    return NextResponse.json({ allocations: newAllocations }, { status: 201 });
  } catch (error) {
    console.error("Error saving allocations:", error);
    return NextResponse.json({ error: "Failed to save allocations" }, { status: 500 });
  }
}