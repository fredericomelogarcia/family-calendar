import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, income, expenses, allocations, categories } from "@/lib/db/schema";
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";

// Helper to calculate periodic amount from income/expense
function calculatePeriodicAmount(amount: number, period: string): number {
  switch (period) {
    case "weekly": return amount * 4.33; // ~4.33 weeks/month
    case "monthly": return amount;
    case "yearly": return amount / 12;
    case "one-time": return amount; // Use actual amount
    default: return amount;
  }
}

// GET /api/expenses/summary - Get income vs outcome summary
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

    // Get all income for family
    const incomeList = await db.query.income.findMany({
      where: eq(income.familyId, user.familyId),
    });

    // Get all expenses for family
    const expensesList = await db.query.expenses.findMany({
      where: eq(expenses.familyId, user.familyId),
    });

    // Get all categories
    const categoriesList = await db.query.categories.findMany({
      where: eq(categories.familyId, user.familyId),
    });

    // Get allocations for current period
    const period = new Date().toISOString().slice(0, 7);
    const allocationsList = await db.query.allocations.findMany({
      where: eq(allocations.familyId, user.familyId),
    });

    // Calculate totals
    let totalIncomeMonthly = 0;
    for (const inc of incomeList || []) {
      totalIncomeMonthly += calculatePeriodicAmount(parseFloat(inc.amount) || 0, inc.period || "monthly");
    }

    let totalExpensesMonthly = 0;
    for (const exp of expensesList || []) {
      totalExpensesMonthly += calculatePeriodicAmount(parseFloat(exp.amount) || 0, exp.period || "monthly");
    }

    const allocatedAmount = (allocationsList || []).reduce((sum, a) => sum + parseFloat(a.amount || "0"), 0);
    const whatsLeft = totalIncomeMonthly - totalExpensesMonthly;
    const unallocatedWhatsLeft = whatsLeft - allocatedAmount;

    return NextResponse.json({
      summary: {
        income: totalIncomeMonthly,
        expenses: totalExpensesMonthly,
        allocated: allocatedAmount,
        whatsLeft,
        unallocatedLeft: unallocatedWhatsLeft,
        incomeCount: (incomeList || []).length,
        expensesCount: (expensesList || []).length,
        categoriesCount: (categoriesList || []).length,
      },
    });
  } catch (error) {
    console.error("Error fetching summary:", error);
    return NextResponse.json({ error: "Failed to fetch summary" }, { status: 500 });
  }
}