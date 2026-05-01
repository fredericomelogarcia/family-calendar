import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { categories, users } from "@/lib/db/schema";
import { auth } from "@clerk/nextjs/server";
import { eq, and } from "drizzle-orm";

const DEFAULT_CATEGORIES = [
  { name: "Groceries", color: "#7C9A7E", budgetAmount: null },
  { name: "Bills", color: "#4F83C2", budgetAmount: null },
  { name: "Transport", color: "#D9903D", budgetAmount: null },
  { name: "Childcare", color: "#8B5CF6", budgetAmount: null },
  { name: "Home", color: "#159A73", budgetAmount: null },
  { name: "Savings", color: "#5B61B2", budgetAmount: null },
  { name: "Health", color: "#C75A9A", budgetAmount: null },
  { name: "Fun", color: "#D76D57", budgetAmount: null },
];

// GET /api/categories - Fetch all categories for family
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

    const categoriesList = await db.query.categories.findMany({
      where: eq(categories.familyId, user.familyId),
      orderBy: (categories, { asc }) => [asc(categories.name)],
    });

    return NextResponse.json({ categories: categoriesList });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
  }
}

// POST /api/categories - Create category
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, color, icon, budgetAmount, budgetPeriod, defaults } = body;

    if (!defaults && (!name || name.length < 2)) {
      return NextResponse.json({ error: "Name must be at least 2 characters" }, { status: 400 });
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { familyId: true },
    });

    if (!user?.familyId) {
      return NextResponse.json({ error: "No family found" }, { status: 400 });
    }
    const familyId = user.familyId;

    if (defaults) {
      const existingCategories = await db.query.categories.findMany({
        where: eq(categories.familyId, familyId),
        columns: { name: true },
      });
      const existingNames = new Set(existingCategories.map((category) => category.name.toLowerCase()));
      const categoriesToCreate = DEFAULT_CATEGORIES.filter((category) => !existingNames.has(category.name.toLowerCase()));

      if (categoriesToCreate.length === 0) {
        return NextResponse.json({ categories: [], created: 0 });
      }

      const createdCategories = await db.insert(categories).values(
        categoriesToCreate.map((category) => ({
          id: crypto.randomUUID(),
          familyId,
          name: category.name,
          color: category.color,
          icon: null,
          budgetAmount: category.budgetAmount,
          budgetPeriod: "monthly",
        }))
      ).returning();

      return NextResponse.json({ categories: createdCategories, created: createdCategories.length }, { status: 201 });
    }

    const [category] = await db.insert(categories).values({
      id: crypto.randomUUID(),
      familyId: user.familyId,
      name,
      color: color || "#7C9A7E",
      icon: icon || null,
      budgetAmount: budgetAmount ? String(budgetAmount) : null,
      budgetPeriod: budgetPeriod || "monthly",
    }).returning();

    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    console.error("Error creating category:", error);
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
  }
}

// PATCH /api/categories - Update category
export async function PATCH(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, name, color, icon, budgetAmount, budgetPeriod } = body;

    if (!id || !name || name.length < 2) {
      return NextResponse.json({ error: "ID and name are required" }, { status: 400 });
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { familyId: true },
    });

    if (!user?.familyId) {
      return NextResponse.json({ error: "No family found" }, { status: 400 });
    }

    const [category] = await db.update(categories)
      .set({
        name,
        color: color || "#7C9A7E",
        icon: icon || null,
        budgetAmount: budgetAmount ? String(budgetAmount) : null,
        budgetPeriod: budgetPeriod || "monthly",
      })
      .where(and(eq(categories.id, id), eq(categories.familyId, user.familyId)))
      .returning();

    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    return NextResponse.json({ category });
  } catch (error) {
    console.error("Error updating category:", error);
    return NextResponse.json({ error: "Failed to update category" }, { status: 500 });
  }
}

// DELETE /api/categories - Delete category
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Category ID required" }, { status: 400 });
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { familyId: true },
    });

    if (!user?.familyId) {
      return NextResponse.json({ error: "No family found" }, { status: 400 });
    }

    const [deleted] = await db.delete(categories)
      .where(and(eq(categories.id, id), eq(categories.familyId, user.familyId)))
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting category:", error);
    return NextResponse.json({ error: "Failed to delete category" }, { status: 500 });
  }
}
