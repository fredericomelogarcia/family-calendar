import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { income, users } from "@/lib/db/schema";
import { auth } from "@clerk/nextjs/server";
import { eq, and } from "drizzle-orm";

// GET /api/income - Fetch income for family
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { familyId: true },
    });

    if (!user?.familyId) {
      return NextResponse.json({ error: "No family found" }, { status: 400 });
    }

    const incomeList = await db.query.income.findMany({
      where: eq(income.familyId, user.familyId),
      orderBy: (income, { desc }) => [desc(income.date)],
    });

    return NextResponse.json({ income: incomeList });
  } catch (error) {
    console.error("Error fetching income:", error);
    return NextResponse.json({ error: "Failed to fetch income" }, { status: 500 });
  }
}

// POST /api/income - Create income
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { source, amount, date, period } = body;

    if (!source || !amount || !date) {
      return NextResponse.json({ error: "Source, amount, and date are required" }, { status: 400 });
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { familyId: true },
    });

    if (!user?.familyId) {
      return NextResponse.json({ error: "No family found" }, { status: 400 });
    }

    const [newIncome] = await db.insert(income).values({
      id: crypto.randomUUID(),
      familyId: user.familyId,
      userId,
      source,
      amount: String(amount),
      date: date,
      period: period || "monthly",
    }).returning();

    return NextResponse.json({ income: newIncome }, { status: 201 });
  } catch (error) {
    console.error("Error creating income:", error);
    return NextResponse.json({ error: "Failed to create income" }, { status: 500 });
  }
}

// PATCH /api/income - Update income
export async function PATCH(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, source, amount, date, period } = body;

    if (!id || !source || !amount || !date) {
      return NextResponse.json({ error: "ID, source, amount, and date are required" }, { status: 400 });
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { familyId: true },
    });

    if (!user?.familyId) {
      return NextResponse.json({ error: "No family found" }, { status: 400 });
    }

    const [updatedIncome] = await db.update(income)
      .set({
        source,
        amount: String(amount),
        date,
        period: period || "monthly",
        updatedAt: new Date(),
      })
      .where(and(eq(income.id, id), eq(income.familyId, user.familyId)))
      .returning();

    if (!updatedIncome) {
      return NextResponse.json({ error: "Income not found" }, { status: 404 });
    }

    return NextResponse.json({ income: updatedIncome });
  } catch (error) {
    console.error("Error updating income:", error);
    return NextResponse.json({ error: "Failed to update income" }, { status: 500 });
  }
}

// DELETE /api/income - Delete income
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Income ID required" }, { status: 400 });
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { familyId: true },
    });

    if (!user?.familyId) {
      return NextResponse.json({ error: "No family found" }, { status: 400 });
    }

    const [deleted] = await db.delete(income)
      .where(and(eq(income.id, id), eq(income.familyId, user.familyId)))
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: "Income not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting income:", error);
    return NextResponse.json({ error: "Failed to delete income" }, { status: 500 });
  }
}
