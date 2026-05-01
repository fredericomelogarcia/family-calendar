import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { expenses, users } from "@/lib/db/schema";
import { auth } from "@clerk/nextjs/server";
import { eq, and } from "drizzle-orm";

// GET /api/expenses - Fetch expenses
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

    const expensesList = await db.query.expenses.findMany({
      where: eq(expenses.familyId, user.familyId),
      orderBy: (expenses, { desc }) => [desc(expenses.date)],
    });

    return NextResponse.json({ expenses: expensesList });
  } catch (error) {
    console.error("Error fetching expenses:", error);
    return NextResponse.json({ error: "Failed to fetch expenses" }, { status: 500 });
  }
}

// POST /api/expenses - Create expense
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { categoryId, amount, description, date, period } = body;

    if (!amount || !date) {
      return NextResponse.json({ error: "Amount and date are required" }, { status: 400 });
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { familyId: true },
    });

    if (!user?.familyId) {
      return NextResponse.json({ error: "No family found" }, { status: 400 });
    }

    const [newExpense] = await db.insert(expenses).values({
      id: crypto.randomUUID(),
      familyId: user.familyId,
      userId,
      categoryId: categoryId || null,
      amount: String(amount),
      description: description || null,
      date: date,
      period: period || "monthly",
    }).returning();

    return NextResponse.json({ expense: newExpense }, { status: 201 });
  } catch (error) {
    console.error("Error creating expense:", error);
    return NextResponse.json({ error: "Failed to create expense" }, { status: 500 });
  }
}

// PATCH /api/expenses - Update expense
export async function PATCH(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, categoryId, amount, description, date, period } = body;

    if (!id || !amount || !date) {
      return NextResponse.json({ error: "ID, amount, and date are required" }, { status: 400 });
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { familyId: true },
    });

    if (!user?.familyId) {
      return NextResponse.json({ error: "No family found" }, { status: 400 });
    }

    const [updatedExpense] = await db.update(expenses)
      .set({
        categoryId: categoryId || null,
        amount: String(amount),
        description: description || null,
        date,
        period: period || "monthly",
        updatedAt: new Date(),
      })
      .where(and(eq(expenses.id, id), eq(expenses.familyId, user.familyId)))
      .returning();

    if (!updatedExpense) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    return NextResponse.json({ expense: updatedExpense });
  } catch (error) {
    console.error("Error updating expense:", error);
    return NextResponse.json({ error: "Failed to update expense" }, { status: 500 });
  }
}

// DELETE /api/expenses - Delete expense
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Expense ID required" }, { status: 400 });
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { familyId: true },
    });

    if (!user?.familyId) {
      return NextResponse.json({ error: "No family found" }, { status: 400 });
    }

    const [deleted] = await db.delete(expenses)
      .where(and(eq(expenses.id, id), eq(expenses.familyId, user.familyId)))
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting expense:", error);
    return NextResponse.json({ error: "Failed to delete expense" }, { status: 500 });
  }
}
