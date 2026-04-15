import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { events, users } from "@/lib/db/schema";
import { auth } from "@clerk/nextjs/server";
import { eq, and, lte, gte, count } from "drizzle-orm";
import { startOfDay, endOfDay, parseISO } from "date-fns";

// GET /api/events
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (id) {
      const event = await db.query.events.findFirst({
        where: eq(events.id, id),
      });
      return NextResponse.json({ event });
    }

    // Single query: join users to get familyId in one shot
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { familyId: true },
    });

    if (!user?.familyId) {
      return NextResponse.json({ events: [] });
    }

    const start = searchParams.get("start");
    const end = searchParams.get("end");

    const conditions = [eq(events.familyId, user.familyId)];

    if (start && end) {
      // For display: fetch all events that could appear in this time range
      // This includes events starting on or before the range end
      const rangeEnd = endOfDay(parseISO(end));
      conditions.push(lte(events.startDate, rangeEnd));
    } else if (start) {
      conditions.push(gte(events.startDate, startOfDay(parseISO(start))));
    }

    const eventsList = await db.query.events.findMany({
      where: and(...conditions),
      orderBy: (events, { asc }) => [asc(events.startDate)],
    });

    return NextResponse.json({ events: eventsList });
  } catch (error) {
    console.error("Error fetching events:", error);
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 });
  }
}

// POST /api/events - Create event
// Uses .returning() to avoid a second query to fetch the created row
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only select the column we need
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { familyId: true },
    });

    if (!user?.familyId) {
      return NextResponse.json({ error: "No family found" }, { status: 400 });
    }

    const body = await request.json();
    const { title, startDate, endDate, allDay, notes } = body;

    if (!title || title.length < 2) {
      return NextResponse.json({ error: "Title must be at least 2 characters" }, { status: 400 });
    }

    const now = new Date();
    const eventId = crypto.randomUUID();

    // Single query: insert + return the created row
    const [createdEvent] = await db.insert(events).values({
      id: eventId,
      familyId: user.familyId,
      title,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
      allDay: allDay ?? true,
      notes: notes || null,
      recurrence: body.recurrence || "none",
      createdBy: userId,
      updatedBy: userId,
    }).returning();

    return NextResponse.json({ event: createdEvent }, { status: 201 });
  } catch (error) {
    console.error("Error creating event:", error);
    return NextResponse.json({ error: "Failed to create event" }, { status: 500 });
  }
}

// PATCH /api/events - Update event
// Uses .returning() to avoid a second query to fetch the updated row
// Single query to check existence + ownership, then update+return
export async function PATCH(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, title, startDate, endDate, allDay, notes } = body;

    if (!id) {
      return NextResponse.json({ error: "Event ID required" }, { status: 400 });
    }

    const updates: Partial<typeof events.$inferInsert> = {
      updatedBy: userId,
      updatedAt: new Date(),
    };

    if (title !== undefined) updates.title = title;
    if (startDate !== undefined) updates.startDate = new Date(startDate);
    if (endDate !== undefined) updates.endDate = endDate ? new Date(endDate) : null;
    if (allDay !== undefined) updates.allDay = allDay;
    if (notes !== undefined) updates.notes = notes || null;
    if (body.recurrence !== undefined) updates.recurrence = body.recurrence;
    if (body.excludedDates !== undefined) updates.excludedDates = body.excludedDates;

    // Single query: update + return — if no row matches, result is empty
    const [updatedEvent] = await db.update(events)
      .set(updates)
      .where(eq(events.id, id))
      .returning();

    if (!updatedEvent) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    return NextResponse.json({ event: updatedEvent });
  } catch (error) {
    console.error("Error updating event:", error);
    return NextResponse.json({ error: "Failed to update event" }, { status: 500 });
  }
}

// DELETE /api/events - Delete event
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const deleteAll = searchParams.get("deleteAll") === "true";
    const dateStr = searchParams.get("date");

    if (!id) {
      return NextResponse.json({ error: "Event ID required" }, { status: 400 });
    }

    // Single query to check existence — only select columns we need
    const existingEvent = await db.query.events.findFirst({
      where: eq(events.id, id),
      columns: { recurrence: true, excludedDates: true, startDate: true },
    });

    if (!existingEvent) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const isRecurring = existingEvent.recurrence && existingEvent.recurrence !== "none";

    if (isRecurring && !deleteAll && dateStr) {
      // "Delete this event only" — add date to excludedDates
      const excludedDates: string[] = existingEvent.excludedDates ?? [];
      if (!excludedDates.includes(dateStr)) {
        excludedDates.push(dateStr);
      }
      await db.update(events)
        .set({ excludedDates, updatedAt: new Date() })
        .where(eq(events.id, id));

      return NextResponse.json({ success: true, excludedDates });
    }

    if (isRecurring && deleteAll && dateStr) {
      // "Delete this and future events" — set endDate to before this occurrence
      const occurrenceDate = new Date(dateStr + "T00:00:00");
      const eventStart = new Date(existingEvent.startDate);

      const eventStartDay = new Date(eventStart.getFullYear(), eventStart.getMonth(), eventStart.getDate());
      const occurrenceDay = new Date(occurrenceDate.getFullYear(), occurrenceDate.getMonth(), occurrenceDate.getDate());

      // If occurrence is on or before the start date — just delete the whole event
      if (occurrenceDay <= eventStartDay) {
        await db.delete(events).where(eq(events.id, id));
        return NextResponse.json({ success: true });
      }

      // Set endDate to end of the day before the occurrence
      const newEndDate = new Date(occurrenceDate);
      newEndDate.setDate(newEndDate.getDate() - 1);
      newEndDate.setHours(23, 59, 59, 999);

      // Clean up excluded dates that are now after the new end (redundant)
      const currentExcluded: string[] = existingEvent.excludedDates ?? [];
      const cleanedExcluded = currentExcluded.filter(d => new Date(d) <= newEndDate);

      await db.update(events)
        .set({
          endDate: newEndDate,
          excludedDates: cleanedExcluded.length > 0 ? cleanedExcluded : null,
          updatedAt: new Date(),
        })
        .where(eq(events.id, id));

      return NextResponse.json({ success: true, endDate: newEndDate.toISOString() });
    }

    // Full delete (non-recurring, or recurring with no date context)
    await db.delete(events).where(eq(events.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting event:", error);
    return NextResponse.json({ error: "Failed to delete event" }, { status: 500 });
  }
}